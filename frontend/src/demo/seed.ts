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
  localDateTimeToInstant,
  minutesFromTime,
  SALON_TIMEZONE,
  todayDateKey,
  weekdayIndexFromDateKey,
} from '@/lib/time'

import type { DemoState } from './types'

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
    colorKey: 'pine',
    serviceIds: ['svc-zensko', 'svc-feniranje', 'svc-bojenje', 'svc-pramenovi', 'svc-svecana'],
  },
  {
    id: 'hd-amina',
    displayName: 'Amina Hadžić',
    isActive: true,
    colorKey: 'slate',
    serviceIds: ['svc-zensko', 'svc-musko', 'svc-feniranje', 'svc-bojenje'],
  },
  {
    id: 'hd-milica',
    displayName: 'Milica Savić',
    isActive: true,
    colorKey: 'clay',
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
]

const CLIENT_NOTES: Record<number, string> = {
  0: 'Preferira prijepodnevne termine.',
  1: 'Redovna klijentica, dolazi svakih 6 sedmica.',
  3: 'Voli blaži ton boje.',
  6: 'Dolazi s djetetom — potrebno malo više vremena.',
  8: 'Novi klijent — prvi termin.',
  13: 'Preferira tiši dio salona.',
}

const STAFF_WORK_HOURS: Record<
  string,
  Array<{ from: Weekday; to: Weekday; start: string; end: string }>
> = {
  'hd-lana': [
    { from: 0, to: 4, start: '09:00', end: '18:00' },
    { from: 5, to: 5, start: '09:00', end: '14:00' },
  ],
  'hd-amina': [
    { from: 1, to: 4, start: '10:00', end: '19:00' },
    { from: 5, to: 5, start: '09:00', end: '15:00' },
  ],
  'hd-milica': [
    { from: 0, to: 2, start: '09:00', end: '17:00' },
    { from: 3, to: 3, start: '12:00', end: '20:00' },
    { from: 4, to: 4, start: '09:00', end: '17:00' },
    { from: 5, to: 5, start: '09:00', end: '13:00' },
  ],
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
      createdAt: new Date(now.getTime() - (90 - index * 3) * 86_400_000).toISOString(),
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

  for (let offset = 0; offset <= 2; offset += 1) {
    const dateKey = addDaysToDateKey(todayKey, offset)
    const weekday = weekdayIndexFromDateKey(dateKey)

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
        const startsAt = localDateTimeToInstant(dateKey, breakTime.start)
        const endsAt = localDateTimeToInstant(dateKey, breakTime.end)
        if (startsAt && endsAt) {
          blocks.push({
            id: `blk-${dateKey}-${hairdresser.id}-pauza`,
            hairdresserId: hairdresser.id,
            startsAt,
            endsAt,
            reason: 'Pauza',
          })
        }
      }
    }
  }

  // One honest date-specific absence, only if it fits inside working hours.
  for (let offset = 1; offset <= 5; offset += 1) {
    const dateKey = addDaysToDateKey(todayKey, offset)
    const weekday = weekdayIndexFromDateKey(dateKey)
    const hairdresser = HAIRDRESSERS[2]!
    const interval = workIntervalFor(workingHours, hairdresser.id, weekday)
    if (!interval) continue
    const intervalEnd = minutesFromTime(interval.end)
    if (intervalEnd === null || intervalEnd < 17 * 60) continue

    const startsAt = localDateTimeToInstant(dateKey, '15:00')
    const endsAt = localDateTimeToInstant(dateKey, '17:00')
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
): SalonService | null {
  const services = hairdresser.serviceIds
    .map((serviceId) => SERVICE_BY_ID.get(serviceId))
    .filter((service): service is SalonService => service !== undefined)
  if (services.length === 0) return null

  for (let step = 0; step < services.length; step += 1) {
    const service = services[(preferredIndex + step) % services.length]!
    if (startMinute + service.durationMinutes <= intervalEnd) return service
  }
  return null
}

function createAppointments(
  now: Date,
  todayKey: string,
  workingHours: WorkingHoursInterval[],
  blocks: TimeBlock[],
  clients: Client[],
): Appointment[] {
  const appointments: Appointment[] = []
  const nowMs = now.getTime()

  const addAppointment = (
    dateKey: string,
    offset: number,
    hairdresser: Hairdresser,
    hairdresserIndex: number,
    slotIndex: number,
    slotTime: string,
    intervalEnd: number,
  ): void => {
    const startMinute = minutesFromTime(slotTime)
    if (startMinute === null) return
    const service = pickService(
      hairdresser,
      Math.abs(offset) + hairdresserIndex + slotIndex * 2,
      startMinute,
      intervalEnd,
    )
    if (!service) return

    const startsAt = localDateTimeToInstant(dateKey, slotTime)
    if (!startsAt) return
    const endsAt = addMinutesToInstant(startsAt, service.durationMinutes)

    const busy = [
      ...blocks
        .filter((block) => block.hairdresserId === hairdresser.id)
        .map((block) => ({ startsAt: block.startsAt, endsAt: block.endsAt })),
      ...appointments
        .filter((appointment) => appointment.hairdresserId === hairdresser.id)
        .map((appointment) => ({ startsAt: appointment.startsAt, endsAt: appointment.endsAt })),
    ]
    if (busy.some((entry) => intervalOverlaps(startsAt, endsAt, entry.startsAt, entry.endsAt))) {
      return
    }

    const client =
      clients[(Math.abs(offset) * 3 + hairdresserIndex * 2 + slotIndex) % clients.length]!
    const endMs = new Date(endsAt).getTime()
    const isPast = endMs <= nowMs
    let status: AppointmentStatus = isPast ? 'completed' : 'confirmed'
    if (isPast && (Math.abs(offset) + hairdresserIndex + slotIndex) % 9 === 0) {
      status = 'no_show'
    }
    if (offset < 0 && hairdresserIndex === 1 && slotIndex === 0 && Math.abs(offset) % 4 === 1) {
      status = 'cancelled'
    }

    const source: AppointmentSource =
      (Math.abs(offset) + hairdresserIndex + slotIndex) % 4 === 0 ? 'online' : 'manual'
    const createdAt = new Date(new Date(startsAt).getTime() - 4 * 86_400_000).toISOString()
    const note =
      (Math.abs(offset) + hairdresserIndex) % 7 === 0 ? 'Potvrditi dužinu usluge na dolasku.' : null

    appointments.push({
      id: `appt-${offset >= 0 ? 'p' : 'm'}${Math.abs(offset)}-${hairdresserIndex}-${slotIndex}`,
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
    })
  }

  for (let offset = -7; offset <= 10; offset += 1) {
    const dateKey = addDaysToDateKey(todayKey, offset)
    const weekday = weekdayIndexFromDateKey(dateKey)

    HAIRDRESSERS.forEach((hairdresser, hairdresserIndex) => {
      const interval = workIntervalFor(workingHours, hairdresser.id, weekday)
      if (!interval) return
      const intervalStart = minutesFromTime(interval.start)
      const intervalEnd = minutesFromTime(interval.end)
      if (intervalStart === null || intervalEnd === null) return
      if ((offset + hairdresserIndex) % 3 === 0) return

      const firstTime = interval.start
      addAppointment(dateKey, offset, hairdresser, hairdresserIndex, 0, firstTime, intervalEnd)

      if ((offset + hairdresserIndex) % 2 === 0) {
        const secondMinute = intervalStart + 270
        if (secondMinute + 30 <= intervalEnd) {
          const secondTime = `${String(Math.floor(secondMinute / 60)).padStart(2, '0')}:${String(
            secondMinute % 60,
          ).padStart(2, '0')}`
          addAppointment(dateKey, offset, hairdresser, hairdresserIndex, 1, secondTime, intervalEnd)
        }
      }
    })
  }

  return appointments.sort(
    (left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime(),
  )
}

export function createSeedState(now: Date = new Date()): DemoState {
  const todayKey = todayDateKey(now)
  const workingHours = createWorkingHours()
  const clients = createClients(now)
  const blocks = createBlocks(todayKey, workingHours)
  const appointments = createAppointments(now, todayKey, workingHours, blocks, clients)

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
    clients,
    appointments,
    blocks,
    managementTokens: [],
  }
}

export function staffColorFor(hairdresserId: string): StaffColor {
  return HAIRDRESSER_BY_ID.get(hairdresserId)?.colorKey ?? 'pine'
}

export function demoServiceById(serviceId: string): SalonService | undefined {
  return SERVICE_BY_ID.get(serviceId)
}
