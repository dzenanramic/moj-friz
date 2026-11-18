import { describe, expect, it } from 'vitest'

import { gatewayErrorMessage, isGatewayError } from '@/data/gateway'
import type { AvailabilitySlot } from '@/data/types'
import {
  addDaysToDateKey,
  dateKeyFromInstant,
  dayRange,
  endOfSalonDay,
  formatTime,
  startOfSalonDay,
  todayDateKey,
  weekdayIndexFromDateKey,
} from '@/lib/time'

import { DEMO_STORAGE_KEY, DemoGateway } from './gateway'
import { createSeedState, MIN_SEED_APPOINTMENTS_PER_DAY } from './seed'

class MemoryStorage {
  private readonly values = new Map<string, string>()

  getItem(key: string): string | null {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value)
  }

  removeItem(key: string): void {
    this.values.delete(key)
  }
}

const fixedNow = new Date('2026-11-10T08:00:00.000Z') // 09:00 in Sarajevo
const today = '2026-11-10'

function createGateway(storage = new MemoryStorage()) {
  return {
    storage,
    gateway: new DemoGateway({ now: () => fixedNow, storage, latencyMs: 0 }),
  }
}

async function firstOwnerSlot(
  gateway: DemoGateway,
  startDate = addDaysToDateKey(today, 7),
): Promise<{ slot: AvailabilitySlot; dateKey: string }> {
  for (let offset = 0; offset < 8; offset += 1) {
    const dateKey = addDaysToDateKey(startDate, offset)
    const availability = await gateway.getOwnerAvailability({
      hairdresserId: 'hd-lana',
      serviceId: 'svc-zensko',
      dateKey,
    })
    if (availability.slots[0]) return { slot: availability.slots[0], dateKey }
  }
  throw new Error('Seed produced no owner availability')
}

async function firstPublicSlot(
  gateway: DemoGateway,
  startDate = addDaysToDateKey(today, 8),
): Promise<{ slot: AvailabilitySlot; dateKey: string }> {
  for (let offset = 0; offset < 8; offset += 1) {
    const dateKey = addDaysToDateKey(startDate, offset)
    const availability = await gateway.getPublicAvailability({
      slug: 'studio-lana',
      hairdresserId: 'hd-lana',
      serviceId: 'svc-zensko',
      dateKey,
    })
    if (availability.slots[0]) return { slot: availability.slots[0], dateKey }
  }
  throw new Error('Seed produced no public availability')
}

describe('demo seed', () => {
  const seededDays = 21

  it('gives every day of the window at least ten appointments, Sunday included', () => {
    // A different day of the week (and a different hour) for each run, so the check is not
    // tied to the weekday the fixed date happens to land on.
    for (let start = 0; start < 7; start += 1) {
      const now = new Date(Date.UTC(2026, 10, 15 + start, 6, 30))
      const state = createSeedState(now)
      const todayKey = todayDateKey(now)
      for (let offset = 0; offset < seededDays; offset += 1) {
        const dateKey = addDaysToDateKey(todayKey, offset)
        const active = state.appointments.filter(
          (appointment) =>
            dateKeyFromInstant(appointment.startsAt) === dateKey &&
            appointment.status !== 'cancelled',
        )
        expect(
          active.length,
          `${dateKey} (weekday ${weekdayIndexFromDateKey(dateKey)})`,
        ).toBeGreaterThanOrEqual(MIN_SEED_APPOINTMENTS_PER_DAY)
      }
    }
  })

  it('never books a hairdresser twice at the same time', () => {
    const state = createSeedState(new Date('2026-11-18T09:00:00.000Z'))
    for (const hairdresser of state.hairdressers) {
      const theirs = state.appointments
        .filter((appointment) => appointment.hairdresserId === hairdresser.id)
        .sort((left, right) => left.startsAt.localeCompare(right.startsAt))
      for (let index = 1; index < theirs.length; index += 1) {
        expect(theirs[index]!.startsAt >= theirs[index - 1]!.endsAt).toBe(true)
      }
    }
  })

  it('reseeds a state from an earlier day but keeps the guest booking it holds', async () => {
    const storage = new MemoryStorage()
    const { gateway } = createGateway(storage)
    const { slot } = await firstPublicSlot(gateway)
    const booking = await gateway.createPublicBooking({
      slug: 'studio-lana',
      serviceId: 'svc-zensko',
      hairdresserId: 'hd-lana',
      startsAt: slot.startsAt,
      name: 'Demo Gost',
      phone: '061 000 099',
      consent: true,
    })

    // The same browser, the next day: the stored demo belongs to another day, while the
    // guest's appointment is still ahead.
    const later = new Date(new Date(slot.startsAt).getTime() - 12 * 3_600_000)
    const reopened = new DemoGateway({ now: () => later, storage, latencyMs: 0 })
    expect((await reopened.lookupManagement(booking.managementToken)).startsAt).toBe(slot.startsAt)

    // Its own demo data moved with the day; the guest's booking did not.
    const todayAppointments = await reopened.listAppointments(dayRange(todayDateKey(later)))
    expect(todayAppointments.length).toBeGreaterThanOrEqual(MIN_SEED_APPOINTMENTS_PER_DAY)
    expect((await reopened.getClient('client-01')).client.name).toBe('Ana Marković')
  })

  it('keeps the same state when it was seeded today', async () => {
    const storage = new MemoryStorage()
    const { gateway } = createGateway(storage)
    const first = await gateway.listAppointments(dayRange(today))

    const laterToday = new Date(fixedNow.getTime() + 2 * 3_600_000)
    const reopened = new DemoGateway({ now: () => laterToday, storage, latencyMs: 0 })
    const again = await reopened.listAppointments(dayRange(today))
    expect(again.map((entry) => entry.id)).toEqual(first.map((entry) => entry.id))
  })
})

describe('demo scheduling gateway', () => {
  it('creates, conflicts, cancels and frees a slot', async () => {
    const { gateway } = createGateway()
    const { slot, dateKey } = await firstOwnerSlot(gateway)
    const draft = {
      hairdresserId: 'hd-lana',
      serviceId: 'svc-zensko',
      clientId: 'client-01',
      dateKey,
      time: formatTime(slot.startsAt),
      internalNote: 'Test napomena',
    }

    const created = await gateway.createAppointment(draft)
    expect(created.startsAt).toBe(slot.startsAt)
    expect(created.serviceName).toBe('Žensko šišanje')
    expect(created.source).toBe('manual')

    await expect(gateway.createAppointment(draft)).rejects.toMatchObject({
      code: 'SLOT_UNAVAILABLE',
    })

    const cancelled = await gateway.cancelAppointment(created.id)
    expect(cancelled.status).toBe('cancelled')
    expect((await gateway.cancelAppointment(created.id)).status).toBe('cancelled')

    const availability = await gateway.getOwnerAvailability({
      hairdresserId: 'hd-lana',
      serviceId: 'svc-zensko',
      dateKey,
    })
    expect(availability.slots.some((entry) => entry.startsAt === slot.startsAt)).toBe(true)
  })

  it('creates a block and removes the affected slot', async () => {
    const { gateway } = createGateway()
    const { slot, dateKey } = await firstOwnerSlot(gateway)
    const time = formatTime(slot.startsAt)
    const end = formatTime(slot.endsAt)

    await gateway.createTimeBlock({
      hairdresserId: 'hd-lana',
      dateKey,
      startTime: time,
      endTime: end,
      reason: 'Pauza',
    })

    const availability = await gateway.getOwnerAvailability({
      hairdresserId: 'hd-lana',
      serviceId: 'svc-zensko',
      dateKey,
    })
    expect(availability.slots.some((entry) => entry.startsAt === slot.startsAt)).toBe(false)

    const blocks = await gateway.listTimeBlocks({
      from: slot.startsAt,
      to: slot.endsAt,
    })
    expect(blocks.some((block) => block.reason === 'Pauza')).toBe(true)
  })

  it('persists state without storing a raw management token', async () => {
    const { gateway, storage } = createGateway()
    const { slot } = await firstPublicSlot(gateway)

    const result = await gateway.createPublicBooking({
      slug: 'studio-lana',
      serviceId: 'svc-zensko',
      hairdresserId: 'hd-lana',
      startsAt: slot.startsAt,
      name: 'Demo Gost',
      phone: '061 000 099',
      consent: true,
    })

    const raw = storage.getItem(DEMO_STORAGE_KEY)
    expect(raw).toBeTruthy()
    expect(raw).not.toContain(result.managementToken)
    expect(JSON.parse(raw!)).toMatchObject({ version: 1, level: 'level_2' })

    const managed = await gateway.lookupManagement(result.managementToken)
    expect(managed.status).toBe('confirmed')
    expect('internalNote' in managed).toBe(false)

    const reloaded = new DemoGateway({
      now: () => fixedNow,
      storage,
      latencyMs: 0,
    })
    expect((await reloaded.lookupManagement(result.managementToken)).startsAt).toBe(slot.startsAt)
  })

  it('keeps guest management scoped to the token and allows cancellation', async () => {
    const { gateway } = createGateway()
    const { slot } = await firstPublicSlot(gateway)
    const result = await gateway.createPublicBooking({
      slug: 'studio-lana',
      serviceId: 'svc-zensko',
      hairdresserId: 'hd-lana',
      startsAt: slot.startsAt,
      name: 'Demo Gost',
      phone: '061 000 098',
      consent: true,
    })

    await expect(gateway.lookupManagement('not-a-real-token')).rejects.toMatchObject({
      code: 'MANAGEMENT_TOKEN_INVALID',
    })

    const cancelled = await gateway.cancelManaged(result.managementToken)
    expect(cancelled.status).toBe('cancelled')
    expect((await gateway.cancelManaged(result.managementToken)).status).toBe('cancelled')
    await expect(
      gateway.rescheduleManaged(result.managementToken, slot.startsAt),
    ).rejects.toMatchObject({
      code: 'APPOINTMENT_NOT_EDITABLE',
    })
  })

  it('enforces Level 2 for public booking and reports package totals', async () => {
    const { gateway } = createGateway()
    await gateway.setLevel('level_1')
    await expect(gateway.getPublicSalon('studio-lana')).rejects.toMatchObject({
      code: 'LEVEL_REQUIRED',
    })
    const packageInfo = await gateway.getPackageInfo()
    expect(packageInfo).toMatchObject({
      level: 'level_1',
      pricePerHairdresserMinor: 1900,
      activeHairdressers: 3,
      monthlyTotalMinor: 5700,
    })
  })

  it('reuses one clearly matched client for duplicate guest phones', async () => {
    const { gateway } = createGateway()
    const first = await firstPublicSlot(gateway)
    const firstBooking = await gateway.createPublicBooking({
      slug: 'studio-lana',
      serviceId: 'svc-zensko',
      hairdresserId: 'hd-lana',
      startsAt: first.slot.startsAt,
      name: 'Prva Gost',
      phone: '061 000 097',
      consent: true,
    })
    expect(firstBooking.appointment.status).toBe('confirmed')
    const clients = await gateway.listClients('061 000 097', 1, 10)
    expect(clients.total).toBe(1)
  })

  it('maps gateway errors to user-facing messages', async () => {
    const { gateway } = createGateway()
    try {
      await gateway.getPublicSalon('nepostojeci-salon')
      throw new Error('Expected NOT_FOUND')
    } catch (error) {
      expect(isGatewayError(error)).toBe(true)
      expect(gatewayErrorMessage(error)).toMatch(/pronađen/i)
    }
  })
})

describe('demo statistics', () => {
  it('reports full past days and keeps every breakdown in step with the summary', async () => {
    const { gateway } = createGateway()
    const stats = await gateway.getStatistics({ period: 'last_7_days', today })

    // Today is still being worked, so the report ends yesterday.
    expect(stats.period).toEqual({
      from: addDaysToDateKey(today, -7),
      to: addDaysToDateKey(today, -1),
    })
    expect(stats.summary.appointments).toBeGreaterThan(0)
    expect(stats.summary.completed).toBeGreaterThan(0)
    expect(stats.summary.revenueMinor).toBeGreaterThan(0)
    expect(stats.summary.averageTicketMinor).not.toBeNull()
    expect(stats.summary.completed + stats.summary.noShow).toBe(stats.summary.appointments)
    expect(stats.summary.onlineAppointments + stats.summary.manualAppointments).toBe(
      stats.summary.appointments,
    )
    expect(stats.summary.availableMinutes).toBeGreaterThan(0)
    expect(stats.rates.occupancy).toBeGreaterThan(0)
    expect(stats.rates.occupancy).toBeLessThanOrEqual(1)
    expect(stats.summary.cancelled).toBe(0)
    expect(stats.rates.cancellationRate).toBe(0)

    expect(stats.staff.reduce((total, row) => total + row.appointments, 0)).toBe(
      stats.summary.appointments,
    )
    expect(stats.services.reduce((total, row) => total + row.appointments, 0)).toBe(
      stats.summary.appointments,
    )
    expect(stats.weekdays.reduce((total, row) => total + row.appointments, 0)).toBe(
      stats.summary.appointments,
    )
    expect(stats.hours.reduce((total, row) => total + row.appointments, 0)).toBe(
      stats.summary.appointments,
    )
  })

  it('widens the window for the month and counts revenue only from completed work', async () => {
    const { gateway } = createGateway()
    const week = await gateway.getStatistics({ period: 'last_7_days', today })
    const month = await gateway.getStatistics({ period: 'last_30_days', today })

    expect(month.period).toEqual({
      from: addDaysToDateKey(today, -30),
      to: addDaysToDateKey(today, -1),
    })
    expect(month.summary.appointments).toBeGreaterThan(week.summary.appointments)

    const appointments = await gateway.listAppointments({
      from: startOfSalonDay(month.period.from),
      to: endOfSalonDay(month.period.to),
    })
    expect(month.summary.revenueMinor).toBe(
      appointments
        .filter((entry) => entry.status === 'completed')
        .reduce((total, entry) => total + (entry.priceMinorSnapshot ?? 0), 0),
    )
    expect(month.summary.lostRevenueMinor).toBe(
      appointments
        .filter((entry) => entry.status === 'no_show')
        .reduce((total, entry) => total + (entry.priceMinorSnapshot ?? 0), 0),
    )
  })
})
