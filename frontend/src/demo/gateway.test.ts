import { describe, expect, it } from 'vitest'

import { gatewayErrorMessage, isGatewayError } from '@/data/gateway'
import type { AvailabilitySlot } from '@/data/types'
import { addDaysToDateKey, formatTime } from '@/lib/time'

import { DEMO_STORAGE_KEY, DemoGateway } from './gateway'

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
