import type {
  Appointment,
  AppointmentSource,
  AppointmentStatus,
  Client,
  Hairdresser,
  SalonProfile,
  SalonService,
  StaffColor,
  TimeBlock,
  Weekday,
  WorkingHoursInterval,
} from '@/data/types'
import { normalizePhone } from '@/lib/phone'
import { intervalOverlaps } from '@/lib/scheduling'
import {
  addDaysToDateKey,
  addMinutesToInstant,
  dateKeyFromInstant,
  localDateTimeToInstant,
  minutesFromTime,
  SALON_TIMEZONE,
  timeFromMinutes,
  todayDateKey,
  weekdayIndexFromDateKey,
} from '@/lib/time'

import type { DemoState, ManagementTokenRecord } from './types'

export const DEMO_SALON_ID = 'salon-studio-lana'
export const DEMO_SALON_SLUG = 'studio-lana'

const SERVICES: SalonService[] = [
  {
    id: 'svc-zensko',
    name: 'Žensko šišanje',
    durationMinutes: 45,
    priceMinor: 2500,
    currency: 'BAM',
    isActive: true,
  },
  {
    id: 'svc-musko',
    name: 'Muško šišanje',
    durationMinutes: 30,
    priceMinor: 1500,
    currency: 'BAM',
    isActive: true,
  },
  {
    id: 'svc-feniranje',
    name: 'Feniranje',
    durationMinutes: 45,
    priceMinor: 2000,
    currency: 'BAM',
    isActive: true,
  },
  {
    id: 'svc-bojenje',
    name: 'Bojenje',
    durationMinutes: 120,
    priceMinor: 6000,
    currency: 'BAM',
    isActive: true,
  },
  {
    id: 'svc-pramenovi',
    name: 'Pramenovi',
    durationMinutes: 150,
    priceMinor: 8000,
    currency: 'BAM',
    isActive: true,
  },
  {
    id: 'svc-svecana',
    name: 'Svečana frizura',
    durationMinutes: 60,
    priceMinor: 4000,
    currency: 'BAM',
    isActive: true,
  },
]

const HAIRDRESSERS: Hairdresser[] = [
  {
    id: 'hd-lana',
    displayName: 'Lana Jovanović',
    isActive: true,
    colorKey: '4',
    serviceIds: [
      'svc-zensko',
      'svc-musko',
      'svc-feniranje',
      'svc-bojenje',
      'svc-pramenovi',
      'svc-svecana',
    ],
  },
  {
    id: 'hd-amina',
    displayName: 'Amina Hadžić',
    isActive: true,
    colorKey: '1',
    serviceIds: ['svc-zensko', 'svc-musko', 'svc-feniranje', 'svc-bojenje'],
  },
  {
    id: 'hd-milica',
    displayName: 'Milica Savić',
    isActive: true,
    colorKey: '3',
    serviceIds: ['svc-zensko', 'svc-musko', 'svc-feniranje', 'svc-pramenovi', 'svc-svecana'],
  },
]

const CLIENT_NAMES = [
  'Ana Marković',
  'Jelena Kovačević',
  'Marija Savić',
  'Dragana Ilić',
  'Tijana Božić',
  'Sara Todorović',
  'Ivana Marić',
  'Lejla Begić',
  'Nikolina Vuković',
  'Marko Jovanović',
  'Stefan Babić',
  'Nikola Pavlović',
  'Milan Đukić',
  'Adnan Hodžić',
  'Petar Stanković',
  'Elena Radić',
  'Katarina Simić',
  'Tamara Đurić',
  'Nataša Kralj',
  'Vesna Perić',
  'Jovana Lukić',
  'Bojana Šarić',
  'Maida Kovač',
  'Selma Alić',
  'Aida Softić',
  'Amra Delić',
  'Goran Zorić',
  'Dejan Vasić',
  'Vladimir Petrović',
  'Damir Mujić',
  'Emir Salihović',
  'Haris Omerović',
  'Kenan Mehić',
  'Faruk Dizdar',
  'Ljiljana Tošić',
  'Mirjana Đaković',
  'Sanja Vukić',
  'Danijela Brkić',
  'Biljana Cvijić',
  'Aleksandra Đorđević',
  'Sandra Janković',
  'Martina Šimunović',
  'Ksenija Blagojević',
  'Andrijana Crnković',
  'Miloš Ristić',
  'Nemanja Stojanović',
  'Ognjen Tadić',
  'Vuk Đukanović',
]

const CLIENT_NOTES: Record<number, string> = {
  0: 'Preferira prijepodnevne termine.',
  1: 'Redovna klijentica, dolazi svakih 6 sedmica.',
  3: 'Voli blaži ton boje.',
  6: 'Dolazi s djetetom — potrebno malo više vremena.',
  8: 'Novi klijent — prvi termin.',
  13: 'Preferira tiši dio salona.',
}

/**
 * Every day of the week is a working day in the demo, Sunday included: a quiet day reads as
 * broken in a screenshot. Saturday and Sunday are shorter and open later; they are still wide
 * enough for ten appointments once the seed fills them, and for a guest to find a free slot.
 */
const STAFF_WORK_HOURS: Record<
  string,
  Array<{ from: Weekday; to: Weekday; start: string; end: string }>
> = {
  'hd-lana': [
    { from: 0, to: 4, start: '09:00', end: '18:00' },
    { from: 5, to: 5, start: '09:00', end: '15:00' },
    { from: 6, to: 6, start: '10:00', end: '16:00' },
  ],
  'hd-amina': [
    { from: 1, to: 4, start: '10:00', end: '19:00' },
    { from: 5, to: 5, start: '09:00', end: '15:00' },
    { from: 6, to: 6, start: '10:00', end: '16:00' },
  ],
  'hd-milica': [
    { from: 0, to: 2, start: '09:00', end: '17:00' },
    { from: 3, to: 3, start: '12:00', end: '20:00' },
    { from: 4, to: 4, start: '09:00', end: '17:00' },
    { from: 5, to: 5, start: '09:00', end: '15:00' },
    { from: 6, to: 6, start: '10:00', end: '15:00' },
  ],
}

/** Today is filled too, but the day is already running: no invented morning history. */
const TODAY_START_OVERRIDE = '10:00'

/**
 * The least a seeded day shows, Sunday included. History is seeded as completed work, so
 * statistics have a month to report on; today itself only starts at `TODAY_START_OVERRIDE`,
 * so a late opening still shows work ahead rather than invented morning history. Only a day
 * that is still too thin is topped up, and the guest bookings of an earlier seed are kept, so
 * the demo replaces its own data and nobody else's.
 */
export const MIN_SEED_APPOINTMENTS_PER_DAY = 10
const SEED_PAST_DAYS = 30
const SEED_FUTURE_DAYS = 20
const SHORT_SERVICE_MINUTES = 45
/**
 * How far one hairdresser's day is walked: the day's own walks stop here and keep the rest of
 * their hours free, so a guest always has where to book. Only a day that is still too thin
 * after these walks is topped up, and only until it has `MIN_SEED_APPOINTMENTS_PER_DAY`.
 */
const WALK_MIN_APPOINTMENTS = 4

/** The order each hairdresser takes services in, so a column does not read as one service. */
const SERVICE_ORDER: Record<string, string[]> = {
  'hd-lana': [
    'svc-zensko',
    'svc-bojenje',
    'svc-feniranje',
    'svc-pramenovi',
    'svc-svecana',
    'svc-musko',
  ],
  'hd-amina': ['svc-musko', 'svc-zensko', 'svc-feniranje', 'svc-bojenje'],
  'hd-milica': ['svc-feniranje', 'svc-zensko', 'svc-musko', 'svc-svecana', 'svc-pramenovi'],
}

const BREAKS: Record<string, { start: string; end: string }> = {
  'hd-lana': { start: '12:30', end: '13:00' },
  'hd-amina': { start: '14:00', end: '14:30' },
  'hd-milica': { start: '12:30', end: '13:00' },
}

const SERVICE_BY_ID = new Map(SERVICES.map((service) => [service.id, service]))
const HAIRDRESSER_BY_ID = new Map(HAIRDRESSERS.map((hairdresser) => [hairdresser.id, hairdresser]))

function clientId(index: number): string {
  return `client-${String(index + 1).padStart(2, '0')}`
}

function createClients(now: Date): Client[] {
  return CLIENT_NAMES.map((name, index) => {
    const phone = `061 000 ${String(index + 1).padStart(3, '0')}`
    return {
      id: clientId(index),
      name,
      phoneOriginal: phone,
      phoneNormalized: normalizePhone(phone),
      notes: CLIENT_NOTES[index] ?? null,
      // Every demo client existed before the seeded history starts, so a client is never
      // shown as "new" on a day that is older than their record.
      createdAt: new Date(now.getTime() - (180 - index * 2) * 86_400_000).toISOString(),
    }
  })
}

function createWorkingHours(): WorkingHoursInterval[] {
  const result: WorkingHoursInterval[] = []
  for (const hairdresser of HAIRDRESSERS) {
    const patterns = STAFF_WORK_HOURS[hairdresser.id] ?? []
    for (const pattern of patterns) {
      for (let weekday = pattern.from; weekday <= pattern.to; weekday += 1) {
        result.push({
          id: `wh-${hairdresser.id}-${weekday}`,
          hairdresserId: hairdresser.id,
          weekday: weekday as Weekday,
          start: pattern.start,
          end: pattern.end,
        })
      }
    }
  }
  return result
}

function workIntervalFor(
  workingHours: WorkingHoursInterval[],
  hairdresserId: string,
  weekday: number,
): WorkingHoursInterval | undefined {
  return workingHours.find(
    (interval) => interval.hairdresserId === hairdresserId && interval.weekday === weekday,
  )
}

function createBlocks(todayKey: string, workingHours: WorkingHoursInterval[]): TimeBlock[] {
  const blocks: TimeBlock[] = []

  // Lunch breaks are drawn for today only. Past days already read as finished work, and
  // tomorrow already has a full day: a break there would only make the day read thinner.
  const weekday = weekdayIndexFromDateKey(todayKey)
  for (const hairdresser of HAIRDRESSERS) {
    const interval = workIntervalFor(workingHours, hairdresser.id, weekday)
    if (!interval) continue

    const intervalStart = minutesFromTime(interval.start)
    const intervalEnd = minutesFromTime(interval.end)
    const breakTime = BREAKS[hairdresser.id]
    if (!breakTime || intervalStart === null || intervalEnd === null) continue
    const breakStart = minutesFromTime(breakTime.start)
    const breakEnd = minutesFromTime(breakTime.end)
    if (breakStart === null || breakEnd === null) continue

    if (breakStart >= intervalStart && breakEnd <= intervalEnd) {
      const startsAt = localDateTimeToInstant(todayKey, breakTime.start)
      const endsAt = localDateTimeToInstant(todayKey, breakTime.end)
      if (startsAt && endsAt) {
        blocks.push({
          id: `blk-${todayKey}-${hairdresser.id}-pauza`,
          hairdresserId: hairdresser.id,
          startsAt,
          endsAt,
          reason: 'Pauza',
        })
      }
    }
  }

  // One honest date-specific absence in the days ahead, at the very end of a late day, so
  // it closes real working hours without taking a seeded appointment off the schedule.
  for (let offset = 1; offset <= 5; offset += 1) {
    const dateKey = addDaysToDateKey(todayKey, offset)
    const hairdresser = HAIRDRESSERS[2]!
    const interval = workIntervalFor(workingHours, hairdresser.id, weekdayIndexFromDateKey(dateKey))
    if (!interval) continue
    const intervalEnd = minutesFromTime(interval.end)
    if (intervalEnd === null || intervalEnd < 20 * 60) continue

    const startsAt = localDateTimeToInstant(dateKey, '18:00')
    const endsAt = localDateTimeToInstant(dateKey, '20:00')
    if (startsAt && endsAt) {
      blocks.push({
        id: `blk-${dateKey}-${hairdresser.id}-odsustvo`,
        hairdresserId: hairdresser.id,
        startsAt,
        endsAt,
        reason: 'Odsustvo',
      })
    }
    break
  }

  return blocks
}

function pickService(
  hairdresser: Hairdresser,
  preferredIndex: number,
  startMinute: number,
  intervalEnd: number,
  shortOnly = false,
): SalonService | null {
  const ordered = SERVICE_ORDER[hairdresser.id] ?? hairdresser.serviceIds
  const services = ordered
    .map((serviceId) => SERVICE_BY_ID.get(serviceId))
    .filter(
      (service): service is SalonService =>
        service !== undefined &&
        service.isActive &&
        hairdresser.serviceIds.includes(service.id) &&
        (!shortOnly || service.durationMinutes <= SHORT_SERVICE_MINUTES),
    )
  if (services.length === 0) return null

  for (let step = 0; step < services.length; step += 1) {
    const service = services[(preferredIndex + step) % services.length]!
    if (startMinute + service.durationMinutes <= intervalEnd) return service
  }
  return null
}

/**
 * Seed identity is per (day, hairdresser, slot), so a re-seed of another day never collides.
 * It is marked on the id itself: a guest booking gets a random `appt-<uuid>` and is never
 * mistaken for demo data.
 */
const SEED_ID_PREFIX = 'appt-seed-'

function isSeedId(id: string): boolean {
  return id.startsWith(SEED_ID_PREFIX)
}

interface WalkResult {
  placed: number
}

/**
 * One hairdresser's day, as a walk through it: each service starts a little after the one
 * before ends, so the agenda is a real chain of work, not a grid of fixed slots. The walk is
 * deliberately short — it keeps the rest of the hours free — and the day tops itself up only
 * when what the walks produced is still too little to show.
 */
function startsWithWalk(
  offset: number,
  hairdresserIndex: number,
  intervalStart: number,
  intervalEnd: number,
  firstStart: number,
  addAppointment: (slotIndex: number, startMinute: number, shortOnly?: boolean) => number,
): WalkResult {
  // Each hairdresser walks the day from a slightly different moment, so the columns do not
  // start together and the grid reads like a real book.
  const stagger = Math.min(
    (hairdresserIndex * 15 + (offset - (offset > 0 ? 1 : 0)) * 5 + 45) % 75,
    120,
  )
  const start = Math.max(intervalStart, firstStart) + stagger
  let cursor = start
  let placed = 0
  let slotIndex = 0

  while (cursor < intervalEnd && placed < WALK_MIN_APPOINTMENTS) {
    // The first two are short so the walk opens with a chain of real work; every fourth may be
    // a long service, so the demo's six services all appear in the calendar and the statistics.
    const added = addAppointment(slotIndex, cursor, placed < 2 || placed % 4 !== 3)
    if (added > 0) {
      placed += 1
      // Gaps are real: a client leaves, the seat is cleaned, the next one arrives.
      cursor += added + (placed < 4 ? 60 : placed < 8 ? 30 : 15)
    } else {
      // Nothing fits here: move on so a long service cannot stall the walk.
      cursor += 15
    }
    slotIndex += 1
  }
  return { placed }
}

function createAppointments(
  now: Date,
  todayKey: string,
  workingHours: WorkingHoursInterval[],
  blocks: TimeBlock[],
  clients: Client[],
  carried: Appointment[] = [],
): Appointment[] {
  const appointments: Appointment[] = []
  const nowMs = now.getTime()

  /** Returns the appointment it placed, or null when nothing fits or the time is taken. */
  const addAppointment = (
    dateKey: string,
    offset: number,
    hairdresser: Hairdresser,
    hairdresserIndex: number,
    slotIndex: number,
    startMinute: number,
    intervalEnd: number,
    shortOnly = false,
  ): Appointment | null => {
    const service = pickService(
      hairdresser,
      Math.abs(offset) + hairdresserIndex + slotIndex,
      startMinute,
      intervalEnd,
      shortOnly,
    )
    if (!service) return null

    const slotTime = timeFromMinutes(startMinute)
    const startsAt = localDateTimeToInstant(dateKey, slotTime)
    if (!startsAt) return null
    const endsAt = addMinutesToInstant(startsAt, service.durationMinutes)
    const endMs = new Date(endsAt).getTime()
    const isPast = endMs <= nowMs

    const busy = (entries: Array<{ startsAt: string; endsAt: string }>) =>
      entries.some((entry) => intervalOverlaps(startsAt, endsAt, entry.startsAt, entry.endsAt))
    if (
      busy([
        ...blocks
          .filter((block) => block.hairdresserId === hairdresser.id)
          .map((block) => ({ startsAt: block.startsAt, endsAt: block.endsAt })),
        ...appointments
          .filter((appointment) => appointment.hairdresserId === hairdresser.id)
          .map((appointment) => ({ startsAt: appointment.startsAt, endsAt: appointment.endsAt })),
      ])
    ) {
      return null
    }

    const client =
      clients[(Math.abs(offset) * 3 + hairdresserIndex * 2 + slotIndex) % clients.length]!
    const dateSlotKey = `${offset >= 0 ? 'p' : 'm'}${Math.abs(offset)}-${hairdresserIndex}-${slotIndex}`

    // An earlier seed still holds a real guest booking at this time: keep the guest, place
    // the demo around it, and give the guest back the marketing marks the seed removes.
    const guestBooking = carried.find(
      (appointment) =>
        appointment.hairdresserId === hairdresser.id &&
        appointment.status === 'confirmed' &&
        !isSeedId(appointment.id) &&
        intervalOverlaps(startsAt, endsAt, appointment.startsAt, appointment.endsAt),
    )
    if (guestBooking) return null

    let status: AppointmentStatus = isPast ? 'completed' : 'confirmed'
    if (isPast && (Math.abs(offset) + hairdresserIndex + slotIndex) % 9 === 0) {
      status = 'no_show'
    }

    const source: AppointmentSource =
      (Math.abs(offset) + hairdresserIndex + slotIndex) % 4 === 0 ? 'online' : 'manual'
    const bookingTime = new Date(
      new Date(startsAt).getTime() - (isPast ? 4 : 2) * 86_400_000,
    ).toISOString()
    const createdAt =
      new Date(bookingTime).getTime() > nowMs ? new Date(nowMs).toISOString() : bookingTime
    const note =
      (Math.abs(offset) + hairdresserIndex) % 7 === 0 ? 'Potvrditi dužinu usluge na dolasku.' : null

    const appointment: Appointment = {
      id: `${SEED_ID_PREFIX}${dateSlotKey}`,
      hairdresserId: hairdresser.id,
      serviceId: service.id,
      clientId: client.id,
      serviceNameSnapshot: service.name,
      durationMinutesSnapshot: service.durationMinutes,
      priceMinorSnapshot: service.priceMinor,
      startsAt,
      endsAt,
      status,
      source,
      internalNote: note,
      createdAt,
      updatedAt: createdAt,
    }
    appointments.push(appointment)
    return appointment
  }

  for (let offset = -SEED_PAST_DAYS; offset <= SEED_FUTURE_DAYS; offset += 1) {
    const dateKey = addDaysToDateKey(todayKey, offset)
    const weekday = weekdayIndexFromDateKey(dateKey)
    let dayCount = 0
    /** This day's walks, one per working hairdresser: where each of them filled the day. */
    const walks: Array<{
      dateKey: string
      hairdresser: Hairdresser
      hairdresserIndex: number
      startMinute: number
      intervalEnd: number
    }> = []

    HAIRDRESSERS.forEach((hairdresser, hairdresserIndex) => {
      const interval = workIntervalFor(workingHours, hairdresser.id, weekday)
      if (!interval) return
      const intervalStart = minutesFromTime(interval.start)
      const intervalEnd = minutesFromTime(interval.end)
      if (intervalStart === null || intervalEnd === null) return

      const firstStart =
        offset === 0
          ? Math.max(intervalStart, minutesFromTime(TODAY_START_OVERRIDE) ?? 0)
          : intervalStart
      const walk = startsWithWalk(
        offset,
        hairdresserIndex,
        intervalStart,
        intervalEnd,
        firstStart,
        (slotIndex, startMinute, shortOnly) =>
          addAppointment(
            dateKey,
            offset,
            hairdresser,
            hairdresserIndex,
            slotIndex,
            startMinute,
            intervalEnd,
            shortOnly,
          )?.durationMinutesSnapshot ?? 0,
      )
      dayCount += walk.placed
      walks.push({
        dateKey,
        hairdresser,
        hairdresserIndex,
        startMinute: Math.max(intervalStart, firstStart),
        intervalEnd,
      })
    })

    // A day's walks keep room for a guest to book, so they are only topped up when the day
    // still has too few appointments to show. Gaps are searched from the end of the day
    // backwards, so the morning keeps as much room as the floor allows.
    if (dayCount >= MIN_SEED_APPOINTMENTS_PER_DAY) continue
    for (const walk of walks.filter((entry) => entry.dateKey === dateKey)) {
      for (
        let minute = walk.intervalEnd - SHORT_SERVICE_MINUTES;
        minute >= walk.startMinute;
        minute -= 15
      ) {
        if (dayCount >= MIN_SEED_APPOINTMENTS_PER_DAY) break
        const placed = addAppointment(
          dateKey,
          offset,
          walk.hairdresser,
          walk.hairdresserIndex,
          90 + walk.hairdresserIndex * 100 + minute,
          Math.max(minute, walk.startMinute),
          walk.intervalEnd,
          true,
        )
        if (placed) dayCount += 1
      }
    }
  }

  return appointments.sort(
    (left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime(),
  )
}

interface SeedOptions {
  /** State from before the re-seed, so the demo never throws away a real guest file. */
  carried?: {
    appointments: Appointment[]
    clients: Client[]
    managementTokens: ManagementTokenRecord[]
  }
}

export function createSeedState(now: Date = new Date(), options: SeedOptions = {}): DemoState {
  const todayKey = todayDateKey(now)
  const workingHours = createWorkingHours()
  const clients = createClients(now)
  const blocks = createBlocks(todayKey, workingHours)
  const appointments = createAppointments(
    now,
    todayKey,
    workingHours,
    blocks,
    clients,
    options.carried?.appointments,
  )
  const guests = guestBookingsOf(options.carried?.appointments, todayKey, blocks, appointments)
  const guestClients = guestClientsOf(options.carried?.clients, guests, clients)
  // The guest's private link is theirs: a reseed must not take it away.
  const keptIds = new Set(guests.map((guest) => guest.id))
  const guestTokens = (options.carried?.managementTokens ?? []).filter((token) =>
    keptIds.has(token.appointmentId),
  )

  const salon: SalonProfile = {
    id: DEMO_SALON_ID,
    name: 'Studio Lana',
    slug: DEMO_SALON_SLUG,
    phone: '051 000 000',
    address: 'Veselina Masleše 8',
    city: 'Banja Luka',
    timezone: SALON_TIMEZONE,
    plan: 'level_2',
    subscriptionStatus: 'trial',
    trialStartedAt: new Date(now.getTime() - 3 * 86_400_000).toISOString(),
    trialEndsAt: new Date(now.getTime() + 11 * 86_400_000).toISOString(),
    publicBookingEnabled: true,
    bookingLeadMinutes: 60,
    bookingHorizonDays: 30,
    cancellationCutoffMinutes: 120,
    rescheduleCutoffMinutes: 120,
  }

  return {
    version: 1,
    level: 'level_2',
    seededAt: now.toISOString(),
    salon,
    hairdressers: HAIRDRESSERS.map((hairdresser) => ({
      ...hairdresser,
      serviceIds: [...hairdresser.serviceIds],
    })),
    services: SERVICES.map((service) => ({ ...service })),
    workingHours,
    clients: [...clients, ...guestClients],
    appointments: [...appointments, ...guests].sort(
      (left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime(),
    ),
    blocks,
    managementTokens: guestTokens.map((token) => ({ ...token })),
  }
}

function guestBookingsOf(
  carried: Appointment[] | undefined,
  todayKey: string,
  blocks: TimeBlock[],
  appointments: Appointment[],
): Appointment[] {
  if (!carried || carried.length === 0) return []

  const taken = [
    ...blocks.map((block) => ({ startsAt: block.startsAt, endsAt: block.endsAt })),
    ...appointments.map((appointment) => ({
      startsAt: appointment.startsAt,
      endsAt: appointment.endsAt,
    })),
  ]

  return carried
    .filter((appointment) => {
      if (isSeedId(appointment.id)) return false
      if (appointment.status !== 'confirmed') return true
      if (dateKeyFromInstant(appointment.startsAt) < todayKey) return false
      return !taken.some((entry) =>
        intervalOverlaps(appointment.startsAt, appointment.endsAt, entry.startsAt, entry.endsAt),
      )
    })
    .map((appointment) => ({ ...appointment }))
}

function guestClientsOf(
  carried: Client[] | undefined,
  guests: Appointment[],
  clients: Client[],
): Client[] {
  if (!carried) return []
  const known = new Set(clients.map((client) => client.id))
  const result: Client[] = []
  for (const guest of guests) {
    if (known.has(guest.clientId)) continue
    const client = carried.find((candidate) => candidate.id === guest.clientId)
    if (!client) continue
    known.add(client.id)
    result.push({ ...client })
  }
  return result
}

export function staffColorFor(hairdresserId: string): StaffColor {
  return HAIRDRESSER_BY_ID.get(hairdresserId)?.colorKey ?? '1'
}

export function demoServiceById(serviceId: string): SalonService | undefined {
  return SERVICE_BY_ID.get(serviceId)
}
