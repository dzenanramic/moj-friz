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
  TimeBlock,
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

export class DemoGateway implements SalonGateway {
  private state: DemoState
  private readonly now: () => Date
  private readonly storage: StorageLike | null
  private readonly latencyMs: number

  constructor(options: DemoGatewayOptions = {}) {
    this.now = options.now ?? (() => new Date())
    this.storage = options.storage === undefined ? getDefaultStorage() : options.storage
    this.latencyMs = options.latencyMs ?? 110
    this.state = this.readStoredState() ?? createSeedState(this.now())
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
