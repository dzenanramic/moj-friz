import type {
  Appointment,
  AppointmentDraft,
  AppointmentView,
  AvailabilityDay,
  AvailabilityQuery,
  BlockDraft,
  Client,
  ClientDetail,
  DateRange,
  Hairdresser,
  PackageInfo,
  Paginated,
  PlanLevel,
  PublicAppointmentView,
  PublicAvailabilityQuery,
  PublicBookingInput,
  PublicBookingResult,
  PublicSalonCatalog,
  SalonProfile,
  SalonService,
  SalonStatistics,
  StatisticsPeriod,
  StatisticsQuery,
  StatisticsServiceRow,
  StatisticsStaffRow,
  StatisticsWeekdayRow,
  TimeBlock,
  Weekday,
  WorkingHoursInterval,
} from '@/data/types'
import type { SalonGateway } from '@/data/gateway'
import { GatewayError } from '@/data/gateway'
import { normalizeForSearch } from '@/lib/text'
import { normalizePhone } from '@/lib/phone'
import {
  addDaysToDateKey,
  addMinutesToInstant,
  dateKeyFromInstant,
  isValidDateKey,
  localDateTimeToInstant,
  minutesFromTime,
  minutesOfDayFromInstant,
  rangeDateKeys,
  todayDateKey,
  weekdayIndexFromDateKey,
} from '@/lib/time'
import {
  fitsWorkingHours,
  generateSlots,
  intervalOverlaps,
  managementPermissions,
  statusBlocksTime,
  validatePlacement,
} from '@/lib/scheduling'

import { createSeedState } from './seed'
import { createOpaqueToken, hashToken } from './token'
import type { DemoState } from './types'

export const DEMO_STORAGE_KEY = 'mojfriz.demo.v1'
const PRICE_LEVEL_1 = 1900
const PRICE_LEVEL_2 = 2900

interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

interface DemoGatewayOptions {
  now?: () => Date
  storage?: StorageLike | null
  latencyMs?: number
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function createId(prefix: string): string {
  if (typeof crypto.randomUUID === 'function') return `${prefix}-${crypto.randomUUID()}`
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function validStoredState(value: unknown): value is DemoState {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<DemoState>
  return (
    candidate.version === 1 &&
    (candidate.level === 'level_1' || candidate.level === 'level_2') &&
    !!candidate.salon &&
    Array.isArray(candidate.hairdressers) &&
    Array.isArray(candidate.services) &&
    Array.isArray(candidate.workingHours) &&
    Array.isArray(candidate.clients) &&
    Array.isArray(candidate.appointments) &&
    Array.isArray(candidate.blocks) &&
    Array.isArray(candidate.managementTokens)
  )
}

function getDefaultStorage(): StorageLike | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null
    const probeKey = '__mojfriz_probe__'
    window.localStorage.setItem(probeKey, '1')
    window.localStorage.removeItem(probeKey)
    return window.localStorage
  } catch {
    return null
  }
}

function emptyAvailability(dateKey: string, isClosed: boolean): AvailabilityDay {
  return { dateKey, slots: [], isClosed, isFull: !isClosed }
}

const STATISTICS_DAYS: Record<StatisticsPeriod, number> = {
  last_7_days: 7,
  last_30_days: 30,
}

function overlapMinutes(startA: number, endA: number, startB: number, endB: number): number {
  return Math.max(0, Math.min(endA, endB) - Math.max(startA, startB))
}

function ratio(part: number, whole: number): number {
  return whole > 0 ? Math.min(1, part / whole) : 0
}

export class DemoGateway implements SalonGateway {
  private state: DemoState
  private readonly now: () => Date
  private readonly storage: StorageLike | null
  private readonly latencyMs: number

  constructor(options: DemoGatewayOptions = {}) {
    this.now = options.now ?? (() => new Date())
    this.storage = options.storage === undefined ? getDefaultStorage() : options.storage
    this.latencyMs = options.latencyMs ?? 110
    this.state = this.readFreshState() ?? createSeedState(this.now())
  }

  /**
   * A stored demo belongs to the day it was seeded on: left alone, tomorrow's pages would show
   * yesterday's calendar and the days after it would slowly empty. A state seeded on an earlier
   * day is reseeded, keeping the guest bookings it holds; one seeded today is reused as it is,
   * so every edit within the day survives a reload, on localhost and on the deployed demo alike.
   */
  private readFreshState(): DemoState | null {
    const stored = this.readStoredState()
    if (!stored) return null
    // A state that cannot say when it was seeded cannot be trusted to still be today's.
    const seededAt = new Date(stored.seededAt)
    const seededKey = Number.isNaN(seededAt.getTime()) ? '' : dateKeyFromInstant(seededAt)
    if (seededKey === todayDateKey(this.now())) return stored

    const fresh = createSeedState(this.now(), {
      carried: {
        appointments: stored.appointments,
        clients: stored.clients,
        managementTokens: stored.managementTokens,
      },
    })
    this.state = fresh
    this.persist()
    return fresh
  }

  private readStoredState(): DemoState | null {
    try {
      const raw = this.storage?.getItem(DEMO_STORAGE_KEY)
      if (!raw) return null
      const parsed: unknown = JSON.parse(raw)
      return validStoredState(parsed) ? parsed : null
    } catch {
      return null
    }
  }

  private persist(): void {
    try {
      this.storage?.setItem(DEMO_STORAGE_KEY, JSON.stringify(this.state))
    } catch {
      // Demo still works in memory when storage is unavailable.
    }
  }

  private async simulate(): Promise<void> {
    if (this.latencyMs > 0) await sleep(this.latencyMs)
  }

  private profile(): SalonProfile {
    return { ...this.state.salon, plan: this.state.level }
  }

  private hairdresser(id: string): Hairdresser {
    const found = this.state.hairdressers.find((hairdresser) => hairdresser.id === id)
    if (!found) throw new GatewayError('NOT_FOUND', 'Frizer nije pronađen.')
    return found
  }

  private service(id: string): SalonService {
    const found = this.state.services.find((service) => service.id === id)
    if (!found) throw new GatewayError('NOT_FOUND', 'Usluga nije pronađena.')
    return found
  }

  private client(id: string): Client {
    const found = this.state.clients.find((client) => client.id === id)
    if (!found) throw new GatewayError('NOT_FOUND', 'Klijent nije pronađen.')
    return found
  }

  private appointment(id: string): Appointment {
    const found = this.state.appointments.find((appointment) => appointment.id === id)
    if (!found) throw new GatewayError('NOT_FOUND', 'Termin nije pronađen.')
    return found
  }

  private internalIntervals(hairdresserId: string, dateKey: string): WorkingHoursInterval[] {
    const weekday = weekdayIndexFromDateKey(dateKey)
    return this.state.workingHours.filter(
      (interval) => interval.hairdresserId === hairdresserId && interval.weekday === weekday,
    )
  }

  private busyFor(hairdresserId: string, excludeAppointmentId?: string) {
    const appointments = this.state.appointments
      .filter(
        (appointment) =>
          appointment.hairdresserId === hairdresserId &&
          appointment.id !== excludeAppointmentId &&
          statusBlocksTime(appointment.status),
      )
      .map((appointment) => ({
        id: appointment.id,
        startsAt: appointment.startsAt,
        endsAt: appointment.endsAt,
      }))

    const blocks = this.state.blocks
      .filter((block) => block.hairdresserId === hairdresserId)
      .map((block) => ({
        id: block.id,
        startsAt: block.startsAt,
        endsAt: block.endsAt,
      }))

    return [...appointments, ...blocks]
  }

  private appointmentView(appointment: Appointment): AppointmentView {
    const hairdresser = this.hairdresser(appointment.hairdresserId)
    const client = this.client(appointment.clientId)
    return {
      ...appointment,
      hairdresserName: hairdresser.displayName,
      hairdresserColorKey: hairdresser.colorKey,
      serviceName: appointment.serviceNameSnapshot,
      clientName: client.name,
      clientPhone: client.phoneOriginal,
    }
  }

  private publicAppointmentView(
    appointment: Appointment,
    managementExpiresAt: string,
  ): PublicAppointmentView {
    const hairdresser = this.hairdresser(appointment.hairdresserId)
    const cancelPermission = managementPermissions(
      appointment.status,
      appointment.startsAt,
      this.now(),
      this.state.salon.cancellationCutoffMinutes,
    )
    const reschedulePermission = managementPermissions(
      appointment.status,
      appointment.startsAt,
      this.now(),
      this.state.salon.rescheduleCutoffMinutes,
    )
    return {
      id: appointment.id,
      salonName: this.state.salon.name,
      salonSlug: this.state.salon.slug,
      salonPhone: this.state.salon.phone,
      salonAddress: this.state.salon.address,
      salonCity: this.state.salon.city,
      serviceId: appointment.serviceId,
      serviceName: appointment.serviceNameSnapshot,
      priceMinor: appointment.priceMinorSnapshot,
      hairdresserId: hairdresser.id,
      hairdresserName: hairdresser.displayName,
      startsAt: appointment.startsAt,
      endsAt: appointment.endsAt,
      status: appointment.status,
      canCancel: cancelPermission.canCancel,
      canReschedule: reschedulePermission.canReschedule,
      bookingLeadMinutes: this.state.salon.bookingLeadMinutes,
      bookingHorizonDays: this.state.salon.bookingHorizonDays,
      cancellationCutoffMinutes: this.state.salon.cancellationCutoffMinutes,
      rescheduleCutoffMinutes: this.state.salon.rescheduleCutoffMinutes,
      managementExpiresAt,
    }
  }

  private assertPublicAvailable(slug: string): void {
    if (slug !== this.state.salon.slug) throw new GatewayError('NOT_FOUND')
    if (this.state.level !== 'level_2') throw new GatewayError('LEVEL_REQUIRED')
    if (!this.state.salon.publicBookingEnabled) throw new GatewayError('NOT_FOUND')
  }

  private async authenticateManagementToken(token: string) {
    if (!token || token.length < 20) throw new GatewayError('MANAGEMENT_TOKEN_INVALID')
    const hashed = await hashToken(token)
    const record = this.state.managementTokens.find((candidate) => candidate.tokenHash === hashed)
    if (!record) throw new GatewayError('MANAGEMENT_TOKEN_INVALID')
    if (record.revokedAt) throw new GatewayError('MANAGEMENT_TOKEN_INVALID')
    if (new Date(record.expiresAt).getTime() <= this.now().getTime()) {
      throw new GatewayError('MANAGEMENT_TOKEN_INVALID')
    }
    const appointment = this.state.appointments.find(
      (candidate) => candidate.id === record.appointmentId,
    )
    if (!appointment) throw new GatewayError('MANAGEMENT_TOKEN_INVALID')
    return { record, appointment }
  }

  private availabilityFor(params: {
    hairdresserId: string
    serviceId: string
    dateKey: string
    minStart?: string
    excludeAppointmentId?: string
  }): AvailabilityDay {
    if (!isValidDateKey(params.dateKey)) throw new GatewayError('INVALID_INPUT')
    const hairdresser = this.hairdresser(params.hairdresserId)
    const service = this.service(params.serviceId)

    if (!hairdresser.isActive) throw new GatewayError('NOT_FOUND')
    if (!service.isActive) throw new GatewayError('NOT_FOUND')
    if (!hairdresser.serviceIds.includes(service.id)) throw new GatewayError('NOT_FOUND')

    const intervals = this.internalIntervals(hairdresser.id, params.dateKey)
    if (intervals.length === 0) return emptyAvailability(params.dateKey, true)

    const result = generateSlots({
      dateKey: params.dateKey,
      durationMinutes: service.durationMinutes,
      workingIntervals: intervals.map((interval) => ({
        start: interval.start,
        end: interval.end,
      })),
      busy: this.busyFor(hairdresser.id, params.excludeAppointmentId),
      minStart: params.minStart,
      excludeEntryId: params.excludeAppointmentId,
    })

    return {
      dateKey: params.dateKey,
      slots: result.slots,
      isClosed: result.isClosed,
      isFull: result.isFull,
    }
  }

  async getCurrentSalon(): Promise<SalonProfile> {
    await this.simulate()
    return this.profile()
  }

  async getPackageInfo(): Promise<PackageInfo> {
    await this.simulate()
    const activeHairdressers = this.state.hairdressers.filter(
      (hairdresser) => hairdresser.isActive,
    ).length
    const price = this.state.level === 'level_1' ? PRICE_LEVEL_1 : PRICE_LEVEL_2
    return {
      level: this.state.level,
      pricePerHairdresserMinor: price,
      activeHairdressers,
      monthlyTotalMinor: price * activeHairdressers,
      subscriptionStatus: this.state.salon.subscriptionStatus,
      trialEndsAt: this.state.salon.trialEndsAt,
    }
  }

  async setLevel(level: PlanLevel): Promise<void> {
    await this.simulate()
    this.state.level = level
    this.state.salon.plan = level
    this.persist()
  }

  async resetDemo(): Promise<void> {
    await this.simulate()
    this.state = createSeedState(this.now())
    this.persist()
  }

  async listHairdressers(): Promise<Hairdresser[]> {
    await this.simulate()
    return this.state.hairdressers.map((hairdresser) => ({
      ...hairdresser,
      serviceIds: [...hairdresser.serviceIds],
    }))
  }

  async listServices(): Promise<SalonService[]> {
    await this.simulate()
    return this.state.services.map((service) => ({ ...service }))
  }

  async listWorkingHours(): Promise<WorkingHoursInterval[]> {
    await this.simulate()
    return this.state.workingHours.map((interval) => ({ ...interval }))
  }

  async listAppointments(range: DateRange, hairdresserId?: string): Promise<AppointmentView[]> {
    await this.simulate()
    const from = new Date(range.from).getTime()
    const to = new Date(range.to).getTime()
    return this.state.appointments
      .filter((appointment) => {
        if (hairdresserId && appointment.hairdresserId !== hairdresserId) return false
        return (
          new Date(appointment.startsAt).getTime() < to &&
          new Date(appointment.endsAt).getTime() > from
        )
      })
      .sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime())
      .map((appointment) => this.appointmentView(appointment))
  }

  async getAppointment(id: string): Promise<AppointmentView> {
    await this.simulate()
    return this.appointmentView(this.appointment(id))
  }

  private resolveClientForManual(draft: AppointmentDraft): Client {
    if (draft.clientId) return this.client(draft.clientId)

    const name = draft.newClientName?.trim() ?? ''
    const phone = draft.newClientPhone?.trim() ?? ''
    if (name.length < 2 || normalizePhone(phone).replace(/\D/g, '').length < 6) {
      throw new GatewayError('INVALID_INPUT', 'Unesite ime i ispravan broj telefona klijenta.')
    }

    const client: Client = {
      id: createId('client'),
      name,
      phoneOriginal: phone,
      phoneNormalized: normalizePhone(phone),
      notes: null,
      createdAt: this.now().toISOString(),
    }
    this.state.clients.push(client)
    return client
  }

  async createAppointment(draft: AppointmentDraft): Promise<AppointmentView> {
    await this.simulate()
    return this.createAppointmentInternal(draft)
  }

  private createAppointmentInternal(draft: AppointmentDraft): AppointmentView {
    const hairdresser = this.hairdresser(draft.hairdresserId)
    const service = this.service(draft.serviceId)
    if (!hairdresser.isActive || !service.isActive) throw new GatewayError('NOT_FOUND')
    if (!hairdresser.serviceIds.includes(service.id)) {
      throw new GatewayError('INVALID_INPUT', 'Frizer ne radi izabranu uslugu.')
    }

    const startsAt = localDateTimeToInstant(draft.dateKey, draft.time)
    if (!startsAt) throw new GatewayError('INVALID_INPUT', 'Datum ili vrijeme nisu ispravni.')
    if (new Date(startsAt).getTime() < this.now().getTime() - 60_000) {
      throw new GatewayError('INVALID_INPUT', 'Novi termin ne može biti u prošlosti.')
    }

    const intervals = this.internalIntervals(hairdresser.id, draft.dateKey)
    const error = validatePlacement({
      dateKey: draft.dateKey,
      startsAt,
      durationMinutes: service.durationMinutes,
      workingIntervals: intervals.map((interval) => ({
        start: interval.start,
        end: interval.end,
      })),
      busy: this.busyFor(hairdresser.id),
    })
    if (error) throw new GatewayError(error)

    const client = this.resolveClientForManual(draft)
    const timestamp = this.now().toISOString()
    const appointment: Appointment = {
      id: createId('appt'),
      hairdresserId: hairdresser.id,
      serviceId: service.id,
      clientId: client.id,
      serviceNameSnapshot: service.name,
      durationMinutesSnapshot: service.durationMinutes,
      priceMinorSnapshot: service.priceMinor,
      startsAt,
      endsAt: addMinutesToInstant(startsAt, service.durationMinutes),
      status: 'confirmed',
      source: 'manual',
      internalNote: draft.internalNote?.trim() || null,
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    this.state.appointments.push(appointment)
    this.persist()
    return this.appointmentView(appointment)
  }

  async updateAppointment(id: string, draft: AppointmentDraft): Promise<AppointmentView> {
    await this.simulate()
    const existing = this.appointment(id)
    if (existing.status !== 'confirmed') {
      throw new GatewayError('APPOINTMENT_NOT_EDITABLE')
    }

    const hairdresser = this.hairdresser(draft.hairdresserId)
    const service = this.service(draft.serviceId)
    if (!hairdresser.isActive || !service.isActive) throw new GatewayError('NOT_FOUND')
    if (!hairdresser.serviceIds.includes(service.id)) {
      throw new GatewayError('INVALID_INPUT', 'Frizer ne radi izabranu uslugu.')
    }

    const startsAt = localDateTimeToInstant(draft.dateKey, draft.time)
    if (!startsAt) throw new GatewayError('INVALID_INPUT', 'Datum ili vrijeme nisu ispravni.')

    const intervals = this.internalIntervals(hairdresser.id, draft.dateKey)
    const placementError = validatePlacement({
      dateKey: draft.dateKey,
      startsAt,
      durationMinutes: service.durationMinutes,
      workingIntervals: intervals.map((interval) => ({
        start: interval.start,
        end: interval.end,
      })),
      busy: this.busyFor(hairdresser.id, existing.id),
      excludeEntryId: existing.id,
    })
    if (placementError) throw new GatewayError(placementError)

    let client = this.state.clients.find((candidate) => candidate.id === existing.clientId)
    if (draft.clientId) {
      client = this.client(draft.clientId)
    } else if (draft.newClientName || draft.newClientPhone) {
      client = this.resolveClientForManual(draft)
    }
    if (!client) throw new GatewayError('NOT_FOUND', 'Klijent nije pronađen.')

    Object.assign(existing, {
      hairdresserId: hairdresser.id,
      serviceId: service.id,
      clientId: client.id,
      serviceNameSnapshot: service.name,
      durationMinutesSnapshot: service.durationMinutes,
      priceMinorSnapshot: service.priceMinor,
      startsAt,
      endsAt: addMinutesToInstant(startsAt, service.durationMinutes),
      internalNote: draft.internalNote?.trim() || null,
      updatedAt: this.now().toISOString(),
    })
    this.persist()
    return this.appointmentView(existing)
  }

  async cancelAppointment(id: string): Promise<AppointmentView> {
    await this.simulate()
    const appointment = this.appointment(id)
    if (appointment.status === 'cancelled') return this.appointmentView(appointment)
    if (appointment.status !== 'confirmed') throw new GatewayError('APPOINTMENT_NOT_EDITABLE')
    appointment.status = 'cancelled'
    appointment.updatedAt = this.now().toISOString()
    this.persist()
    return this.appointmentView(appointment)
  }

  async setAppointmentStatus(
    id: string,
    status: 'completed' | 'no_show',
  ): Promise<AppointmentView> {
    await this.simulate()
    const appointment = this.appointment(id)
    if (appointment.status === 'cancelled') throw new GatewayError('APPOINTMENT_NOT_EDITABLE')
    appointment.status = status
    appointment.updatedAt = this.now().toISOString()
    this.persist()
    return this.appointmentView(appointment)
  }

  async getOwnerAvailability(query: AvailabilityQuery): Promise<AvailabilityDay> {
    await this.simulate()
    return this.availabilityFor({
      ...query,
      minStart: this.now().toISOString(),
    })
  }

  async listTimeBlocks(range: DateRange): Promise<TimeBlock[]> {
    await this.simulate()
    const from = new Date(range.from).getTime()
    const to = new Date(range.to).getTime()
    return this.state.blocks
      .filter((block) => {
        return new Date(block.startsAt).getTime() < to && new Date(block.endsAt).getTime() > from
      })
      .sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime())
      .map((block) => ({ ...block }))
  }

  async createTimeBlock(draft: BlockDraft): Promise<TimeBlock> {
    await this.simulate()
    const hairdresser = this.hairdresser(draft.hairdresserId)
    if (!hairdresser.isActive) throw new GatewayError('NOT_FOUND')
    if (!isValidDateKey(draft.dateKey)) throw new GatewayError('INVALID_INPUT')

    const startsAt = localDateTimeToInstant(draft.dateKey, draft.startTime)
    const endsAt = localDateTimeToInstant(draft.dateKey, draft.endTime)
    if (!startsAt || !endsAt) throw new GatewayError('INVALID_INPUT', 'Vrijeme nije ispravno.')
    if (new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
      throw new GatewayError('INVALID_INPUT', 'Kraj mora biti poslije početka.')
    }
    if (dateKeyFromInstant(endsAt) !== draft.dateKey) {
      throw new GatewayError('INVALID_INPUT', 'Pauza ne može prelaziti u drugi dan.')
    }

    const intervals = this.internalIntervals(hairdresser.id, draft.dateKey)
    if (
      !fitsWorkingHours(
        draft.dateKey,
        startsAt,
        Math.round((new Date(endsAt).getTime() - new Date(startsAt).getTime()) / 60_000),
        intervals.map((interval) => ({ start: interval.start, end: interval.end })),
      )
    ) {
      throw new GatewayError('OUTSIDE_WORKING_HOURS', 'Pauza mora biti unutar radnog vremena.')
    }

    const conflicts = [
      ...this.state.appointments
        .filter(
          (appointment) =>
            appointment.hairdresserId === hairdresser.id && statusBlocksTime(appointment.status),
        )
        .map((appointment) => ({
          startsAt: appointment.startsAt,
          endsAt: appointment.endsAt,
        })),
      ...this.state.blocks
        .filter((block) => block.hairdresserId === hairdresser.id)
        .map((block) => ({ startsAt: block.startsAt, endsAt: block.endsAt })),
    ]
    if (
      conflicts.some((entry) => intervalOverlaps(startsAt, endsAt, entry.startsAt, entry.endsAt))
    ) {
      throw new GatewayError('SLOT_UNAVAILABLE', 'Pauza se preklapa sa terminom ili drugom pauzom.')
    }

    const block: TimeBlock = {
      id: createId('blk'),
      hairdresserId: hairdresser.id,
      startsAt,
      endsAt,
      reason: draft.reason.trim() || 'Pauza',
    }
    this.state.blocks.push(block)
    this.persist()
    return { ...block }
  }

  async deleteTimeBlock(id: string): Promise<void> {
    await this.simulate()
    const index = this.state.blocks.findIndex((block) => block.id === id)
    if (index < 0) throw new GatewayError('NOT_FOUND', 'Pauza nije pronađena.')
    this.state.blocks.splice(index, 1)
    this.persist()
  }

  async listClients(search: string, page: number, pageSize: number): Promise<Paginated<Client>> {
    await this.simulate()
    const query = normalizeForSearch(search)
    const digits = search.replace(/\D/g, '')
    const safePageSize = Math.max(1, Math.min(pageSize, 50))
    const filtered = this.state.clients
      .filter((client) => {
        if (!query && !digits) return true
        const nameMatches = query.length > 0 && normalizeForSearch(client.name).includes(query)
        const phoneMatches = digits.length > 0 && client.phoneNormalized.includes(digits)
        return nameMatches || phoneMatches
      })
      .sort((left, right) => left.name.localeCompare(right.name, 'bs'))

    const total = filtered.length
    const totalPages = Math.max(1, Math.ceil(total / safePageSize))
    const safePage = Math.max(1, Math.min(page, totalPages))
    const start = (safePage - 1) * safePageSize
    return {
      items: filtered.slice(start, start + safePageSize).map((client) => ({ ...client })),
      page: safePage,
      pageSize: safePageSize,
      total,
      totalPages,
    }
  }

  async getClient(id: string): Promise<ClientDetail> {
    await this.simulate()
    const client = this.client(id)
    const appointments = this.state.appointments
      .filter((appointment) => appointment.clientId === client.id)
      .sort((left, right) => new Date(right.startsAt).getTime() - new Date(left.startsAt).getTime())
      .map((appointment) => this.appointmentView(appointment))
    return { client: { ...client }, appointments }
  }

  /**
   * A read-only report over completed, no-show and cancelled appointments. The window ends
   * yesterday: today is still being worked, and a partial day would read as a bad day. Revenue
   * comes only from completed appointments; no-shows are reported as lost value, not income.
   */
  async getStatistics(query: StatisticsQuery): Promise<SalonStatistics> {
    await this.simulate()
    if (!isValidDateKey(query.today)) {
      throw new GatewayError('INVALID_INPUT', 'Datum nije ispravan.')
    }
    const days = STATISTICS_DAYS[query.period]
    if (!days) throw new GatewayError('INVALID_INPUT', 'Period nije ispravan.')

    const to = addDaysToDateKey(query.today, -1)
    const from = addDaysToDateKey(to, -(days - 1))
    const dateKeys = rangeDateKeys(from, to)

    const inRange = this.state.appointments.filter((appointment) => {
      const dateKey = dateKeyFromInstant(appointment.startsAt)
      return dateKey >= from && dateKey <= to
    })
    const realized = inRange.filter(
      (appointment) => appointment.status === 'completed' || appointment.status === 'no_show',
    )
    const completed = realized.filter((appointment) => appointment.status === 'completed')
    const noShows = realized.filter((appointment) => appointment.status === 'no_show')
    const cancelled = inRange.filter((appointment) => appointment.status === 'cancelled')

    const revenueMinor = completed.reduce(
      (total, appointment) => total + (appointment.priceMinorSnapshot ?? 0),
      0,
    )
    const lostRevenueMinor = noShows.reduce(
      (total, appointment) => total + (appointment.priceMinorSnapshot ?? 0),
      0,
    )
    const bookedMinutes = completed.reduce(
      (total, appointment) => total + appointment.durationMinutesSnapshot,
      0,
    )
    const onlineAppointments = realized.filter(
      (appointment) => appointment.source === 'online',
    ).length
    const manualAppointments = realized.length - onlineAppointments

    const clients = new Set<string>()
    for (const appointment of realized) clients.add(appointment.clientId)
    const uniqueClients = clients.size

    // Working minutes for every active hairdresser on every day in the window, less the
    // breaks and absences recorded for that day. Completed minutes are the numerator above.
    const availableByStaff = new Map<string, number>()
    for (const hairdresser of this.state.hairdressers) availableByStaff.set(hairdresser.id, 0)
    for (const dateKey of dateKeys) {
      const weekday = weekdayIndexFromDateKey(dateKey)
      const dayBlocks = this.state.blocks.filter(
        (block) => dateKeyFromInstant(block.startsAt) === dateKey,
      )
      for (const hairdresser of this.state.hairdressers) {
        if (!hairdresser.isActive) continue
        const intervals = this.state.workingHours.filter(
          (interval) => interval.hairdresserId === hairdresser.id && interval.weekday === weekday,
        )
        const blocks = dayBlocks.filter((block) => block.hairdresserId === hairdresser.id)
        let minutes = 0
        for (const interval of intervals) {
          const start = minutesFromTime(interval.start)
          const end = minutesFromTime(interval.end)
          if (start === null || end === null || end <= start) continue
          const blocked = blocks.reduce(
            (total, block) =>
              total +
              overlapMinutes(
                start,
                end,
                minutesOfDayFromInstant(block.startsAt),
                minutesOfDayFromInstant(block.endsAt),
              ),
            0,
          )
          minutes += Math.max(0, end - start - blocked)
        }
        availableByStaff.set(hairdresser.id, (availableByStaff.get(hairdresser.id) ?? 0) + minutes)
      }
    }
    const availableMinutes = [...availableByStaff.values()].reduce(
      (total, minutes) => total + minutes,
      0,
    )

    const staff: StatisticsStaffRow[] = this.state.hairdressers
      .map((hairdresser) => {
        const staffRealized = realized.filter(
          (appointment) => appointment.hairdresserId === hairdresser.id,
        )
        const staffCompleted = completed.filter(
          (appointment) => appointment.hairdresserId === hairdresser.id,
        )
        const staffBookedMinutes = staffCompleted.reduce(
          (total, appointment) => total + appointment.durationMinutesSnapshot,
          0,
        )
        const staffAvailableMinutes = availableByStaff.get(hairdresser.id) ?? 0
        return {
          hairdresserId: hairdresser.id,
          name: hairdresser.displayName,
          colorKey: hairdresser.colorKey,
          appointments: staffRealized.length,
          revenueMinor: staffCompleted.reduce(
            (total, appointment) => total + (appointment.priceMinorSnapshot ?? 0),
            0,
          ),
          bookedMinutes: staffBookedMinutes,
          availableMinutes: staffAvailableMinutes,
          occupancy: ratio(staffBookedMinutes, staffAvailableMinutes),
        }
      })
      .filter((row) => row.appointments > 0 || row.availableMinutes > 0)
      .sort(
        (left, right) =>
          right.revenueMinor - left.revenueMinor ||
          right.appointments - left.appointments ||
          left.name.localeCompare(right.name, 'bs'),
      )

    const serviceRows = new Map<string, StatisticsServiceRow>()
    for (const appointment of realized) {
      const service = this.state.services.find(
        (candidate) => candidate.id === appointment.serviceId,
      )
      const row = serviceRows.get(appointment.serviceId) ?? {
        serviceId: appointment.serviceId,
        name: service?.name ?? appointment.serviceNameSnapshot,
        appointments: 0,
        revenueMinor: 0,
      }
      row.appointments += 1
      if (appointment.status === 'completed') {
        row.revenueMinor += appointment.priceMinorSnapshot ?? 0
      }
      serviceRows.set(appointment.serviceId, row)
    }
    const services = [...serviceRows.values()].sort(
      (left, right) =>
        right.appointments - left.appointments ||
        right.revenueMinor - left.revenueMinor ||
        left.name.localeCompare(right.name, 'bs'),
    )

    const weekdayCounts = new Map<number, number>()
    const hourCounts = new Map<number, number>()
    for (const appointment of realized) {
      const dateKey = dateKeyFromInstant(appointment.startsAt)
      const weekday = weekdayIndexFromDateKey(dateKey)
      weekdayCounts.set(weekday, (weekdayCounts.get(weekday) ?? 0) + 1)
      const hour = Math.floor(minutesOfDayFromInstant(appointment.startsAt) / 60)
      hourCounts.set(hour, (hourCounts.get(hour) ?? 0) + 1)
    }
    const weekdays: StatisticsWeekdayRow[] = Array.from({ length: 7 }, (_, weekday) => ({
      weekday: weekday as Weekday,
      appointments: weekdayCounts.get(weekday) ?? 0,
    }))
    const hours = [...hourCounts.entries()]
      .map(([hour, appointments]) => ({ hour, appointments }))
      .sort((left, right) => right.appointments - left.appointments || left.hour - right.hour)

    const decided = realized.length + cancelled.length
    return {
      period: { from, to },
      summary: {
        appointments: realized.length,
        completed: completed.length,
        noShow: noShows.length,
        cancelled: cancelled.length,
        revenueMinor,
        averageTicketMinor:
          completed.length > 0 ? Math.round(revenueMinor / completed.length) : null,
        lostRevenueMinor,
        bookedMinutes,
        availableMinutes,
        onlineAppointments,
        manualAppointments,
        uniqueClients,
      },
      rates: {
        occupancy: ratio(bookedMinutes, availableMinutes),
        noShowRate: ratio(noShows.length, realized.length),
        cancellationRate: ratio(cancelled.length, decided),
        onlineShare: ratio(onlineAppointments, realized.length),
      },
      staff,
      services,
      weekdays,
      hours,
    }
  }

  async getPublicSalon(slug: string): Promise<PublicSalonCatalog> {
    await this.simulate()
    this.assertPublicAvailable(slug)
    const salon = this.state.salon
    return {
      salon: {
        name: salon.name,
        slug: salon.slug,
        phone: salon.phone,
        address: salon.address,
        city: salon.city,
        timezone: salon.timezone,
        bookingLeadMinutes: salon.bookingLeadMinutes,
        bookingHorizonDays: salon.bookingHorizonDays,
        cancellationCutoffMinutes: salon.cancellationCutoffMinutes,
        rescheduleCutoffMinutes: salon.rescheduleCutoffMinutes,
      },
      services: this.state.services
        .filter((service) => service.isActive)
        .map((service) => ({
          id: service.id,
          name: service.name,
          durationMinutes: service.durationMinutes,
          priceMinor: service.priceMinor,
          currency: service.currency,
        })),
      hairdressers: this.state.hairdressers
        .filter((hairdresser) => hairdresser.isActive)
        .map((hairdresser) => ({
          id: hairdresser.id,
          displayName: hairdresser.displayName,
          colorKey: hairdresser.colorKey,
          serviceIds: hairdresser.serviceIds.filter((serviceId) =>
            this.state.services.some((service) => service.id === serviceId && service.isActive),
          ),
        })),
    }
  }

  async getPublicAvailability(query: PublicAvailabilityQuery): Promise<AvailabilityDay> {
    await this.simulate()
    this.assertPublicAvailable(query.slug)
    if (!this.isDateInPublicWindow(query.dateKey)) {
      return this.availabilityFor({ ...query, minStart: this.publicMinStart() })
    }
    return this.availabilityFor({
      hairdresserId: query.hairdresserId,
      serviceId: query.serviceId,
      dateKey: query.dateKey,
      minStart: this.publicMinStart(),
    })
  }

  private isDateInPublicWindow(dateKey: string): boolean {
    const today = todayDateKey(this.now())
    const last = addDaysToDateKey(today, this.state.salon.bookingHorizonDays - 1)
    return dateKey >= today && dateKey <= last
  }

  private publicMinStart(): string {
    return new Date(
      this.now().getTime() + this.state.salon.bookingLeadMinutes * 60_000,
    ).toISOString()
  }

  async createPublicBooking(input: PublicBookingInput): Promise<PublicBookingResult> {
    await this.simulate()
    this.assertPublicAvailable(input.slug)
    if (input.website) throw new GatewayError('INVALID_INPUT', 'Zahtjev nije moguće obraditi.')
    if (!input.consent) throw new GatewayError('INVALID_INPUT', 'Potrebna je saglasnost.')
    const name = input.name.trim()
    const phone = input.phone.trim()
    if (name.length < 2) throw new GatewayError('INVALID_INPUT', 'Unesite ime i prezime.')
    if (normalizePhone(phone).replace(/\D/g, '').length < 6) {
      throw new GatewayError('INVALID_INPUT', 'Unesite ispravan broj telefona.')
    }

    const service = this.service(input.serviceId)
    const hairdresser = this.hairdresser(input.hairdresserId)
    if (
      !service.isActive ||
      !hairdresser.isActive ||
      !hairdresser.serviceIds.includes(service.id)
    ) {
      throw new GatewayError('NOT_FOUND')
    }

    const startsAt = new Date(input.startsAt)
    if (Number.isNaN(startsAt.getTime())) throw new GatewayError('INVALID_INPUT')
    if (startsAt.getTime() < new Date(this.publicMinStart()).getTime()) {
      throw new GatewayError('CUTOFF_PASSED', 'Termin je preblizu. Izaberite kasniji termin.')
    }

    const dateKey = dateKeyFromInstant(input.startsAt)
    if (!this.isDateInPublicWindow(dateKey)) {
      throw new GatewayError('INVALID_INPUT', 'Izabrani datum je izvan perioda rezervacije.')
    }

    const availability = this.availabilityFor({
      hairdresserId: hairdresser.id,
      serviceId: service.id,
      dateKey,
      minStart: this.publicMinStart(),
    })
    if (!availability.slots.some((slot) => slot.startsAt === input.startsAt)) {
      throw new GatewayError('SLOT_UNAVAILABLE')
    }

    const normalized = normalizePhone(phone)
    const matches = this.state.clients.filter((client) => client.phoneNormalized === normalized)
    let client: Client
    if (matches.length === 1) {
      // Never overwrite an existing client's identity from unauthenticated input.
      client = matches[0]!
    } else {
      client = {
        id: createId('client'),
        name,
        phoneOriginal: phone,
        phoneNormalized: normalized,
        notes: null,
        createdAt: this.now().toISOString(),
      }
      this.state.clients.push(client)
    }

    const timestamp = this.now().toISOString()
    const appointment: Appointment = {
      id: createId('appt'),
      hairdresserId: hairdresser.id,
      serviceId: service.id,
      clientId: client.id,
      serviceNameSnapshot: service.name,
      durationMinutesSnapshot: service.durationMinutes,
      priceMinorSnapshot: service.priceMinor,
      startsAt: input.startsAt,
      endsAt: addMinutesToInstant(input.startsAt, service.durationMinutes),
      status: 'confirmed',
      source: 'online',
      internalNote: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    this.state.appointments.push(appointment)

    const managementToken = createOpaqueToken()
    const managementExpiresAt = new Date(
      new Date(appointment.endsAt).getTime() + 24 * 3_600_000,
    ).toISOString()
    this.state.managementTokens.push({
      appointmentId: appointment.id,
      tokenHash: await hashToken(managementToken),
      expiresAt: managementExpiresAt,
      revokedAt: null,
      createdAt: timestamp,
    })
    this.persist()

    return {
      appointment: this.publicAppointmentView(appointment, managementExpiresAt),
      managementToken,
    }
  }

  async lookupManagement(token: string): Promise<PublicAppointmentView> {
    await this.simulate()
    const { record, appointment } = await this.authenticateManagementToken(token)
    return this.publicAppointmentView(appointment, record.expiresAt)
  }

  async rescheduleManaged(token: string, startsAtValue: string): Promise<PublicAppointmentView> {
    await this.simulate()
    const { record, appointment } = await this.authenticateManagementToken(token)
    if (appointment.status !== 'confirmed') throw new GatewayError('APPOINTMENT_NOT_EDITABLE')

    const permission = managementPermissions(
      appointment.status,
      appointment.startsAt,
      this.now(),
      this.state.salon.rescheduleCutoffMinutes,
    )
    if (!permission.canReschedule) throw new GatewayError('CUTOFF_PASSED')

    const startsAt = new Date(startsAtValue)
    if (Number.isNaN(startsAt.getTime())) throw new GatewayError('INVALID_INPUT')
    if (startsAt.getTime() < new Date(this.publicMinStart()).getTime()) {
      throw new GatewayError('CUTOFF_PASSED', 'Novi termin je preblizu. Izaberite kasniji termin.')
    }

    const dateKey = dateKeyFromInstant(startsAtValue)
    if (!this.isDateInPublicWindow(dateKey)) {
      throw new GatewayError('INVALID_INPUT', 'Izabrani datum je izvan perioda rezervacije.')
    }

    const service = this.service(appointment.serviceId)
    const hairdresser = this.hairdresser(appointment.hairdresserId)
    const intervals = this.internalIntervals(hairdresser.id, dateKey)
    const placementError = validatePlacement({
      dateKey,
      startsAt: startsAtValue,
      durationMinutes: appointment.durationMinutesSnapshot,
      workingIntervals: intervals.map((interval) => ({ start: interval.start, end: interval.end })),
      busy: this.busyFor(hairdresser.id, appointment.id),
      excludeEntryId: appointment.id,
    })
    if (placementError) throw new GatewayError(placementError)

    const availability = this.availabilityFor({
      hairdresserId: hairdresser.id,
      serviceId: service.id,
      dateKey,
      minStart: this.publicMinStart(),
      excludeAppointmentId: appointment.id,
    })
    if (!availability.slots.some((slot) => slot.startsAt === startsAtValue)) {
      throw new GatewayError('SLOT_UNAVAILABLE')
    }

    appointment.startsAt = startsAtValue
    appointment.endsAt = addMinutesToInstant(startsAtValue, appointment.durationMinutesSnapshot)
    appointment.updatedAt = this.now().toISOString()
    record.expiresAt = new Date(
      new Date(appointment.endsAt).getTime() + 24 * 3_600_000,
    ).toISOString()
    this.persist()
    return this.publicAppointmentView(appointment, record.expiresAt)
  }

  async cancelManaged(token: string): Promise<PublicAppointmentView> {
    await this.simulate()
    const { record, appointment } = await this.authenticateManagementToken(token)
    if (appointment.status === 'cancelled') {
      return this.publicAppointmentView(appointment, record.expiresAt)
    }
    if (appointment.status !== 'confirmed') throw new GatewayError('APPOINTMENT_NOT_EDITABLE')
    const permission = managementPermissions(
      appointment.status,
      appointment.startsAt,
      this.now(),
      this.state.salon.cancellationCutoffMinutes,
    )
    if (!permission.canCancel) throw new GatewayError('CUTOFF_PASSED')

    appointment.status = 'cancelled'
    appointment.updatedAt = this.now().toISOString()
    this.persist()
    return this.publicAppointmentView(appointment, record.expiresAt)
  }
}
