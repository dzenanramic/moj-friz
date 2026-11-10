import { describe, expect, it } from 'vitest'

import {
  generateSlots,
  managementPermissions,
  publicDateWindow,
  validatePlacement,
} from './scheduling'
import { addDaysToDateKey, formatTime, localDateTimeToInstant } from './time'

const dateKey = '2026-11-11'

function at(time: string): string {
  const instant = localDateTimeToInstant(dateKey, time)
  if (!instant) throw new Error(`Invalid test time ${time}`)
  return instant
}

describe('slot generation', () => {
  const working = [{ start: '09:00', end: '12:00' }]
  const busy = [{ id: 'busy-1', startsAt: at('10:00'), endsAt: at('10:30') }]

  it('respects duration, step and half-open intervals', () => {
    const result = generateSlots({
      dateKey,
      durationMinutes: 45,
      workingIntervals: working,
      busy,
    })
    expect(result.isClosed).toBe(false)
    expect(result.slots.map((slot) => formatTime(slot.startsAt))).toEqual([
      '09:00',
      '09:15',
      '10:30',
      '10:45',
      '11:00',
      '11:15',
    ])
  })

  it('allows back-to-back appointments', () => {
    const result = generateSlots({
      dateKey,
      durationMinutes: 45,
      workingIntervals: working,
      busy: [{ id: 'busy-1', startsAt: at('09:00'), endsAt: at('09:45') }],
    })
    expect(result.slots.some((slot) => formatTime(slot.startsAt) === '09:45')).toBe(true)
  })

  it('filters slots before a minimum start', () => {
    const result = generateSlots({
      dateKey,
      durationMinutes: 30,
      workingIntervals: working,
      busy: [],
      minStart: at('10:00'),
    })
    expect(
      result.slots.every(
        (slot) => new Date(slot.startsAt).getTime() >= new Date(at('10:00')).getTime(),
      ),
    ).toBe(true)
  })

  it('reports a closed day when there are no working intervals', () => {
    const result = generateSlots({
      dateKey,
      durationMinutes: 30,
      workingIntervals: [],
      busy: [],
    })
    expect(result).toMatchObject({ isClosed: true, slots: [] })
  })
})

describe('placement validation', () => {
  const working = [{ start: '09:00', end: '12:00' }]
  const busy = [{ id: 'busy-1', startsAt: at('10:00'), endsAt: at('10:30') }]

  it('rejects a start outside working hours', () => {
    expect(
      validatePlacement({
        dateKey,
        startsAt: at('08:30'),
        durationMinutes: 30,
        workingIntervals: working,
        busy,
      }),
    ).toBe('OUTSIDE_WORKING_HOURS')
  })

  it('rejects an overlap and accepts the boundary', () => {
    expect(
      validatePlacement({
        dateKey,
        startsAt: at('10:00'),
        durationMinutes: 30,
        workingIntervals: working,
        busy,
      }),
    ).toBe('SLOT_UNAVAILABLE')
    expect(
      validatePlacement({
        dateKey,
        startsAt: at('10:30'),
        durationMinutes: 30,
        workingIntervals: working,
        busy,
      }),
    ).toBeNull()
  })
})

describe('public management rules', () => {
  it('applies the cancellation cutoff', () => {
    const now = new Date('2026-11-11T07:00:00.000Z') // 08:00 local
    const start = at('09:00')
    expect(managementPermissions('confirmed', start, now, 120)).toEqual({
      canCancel: false,
      canReschedule: false,
    })
    expect(
      managementPermissions('confirmed', start, new Date('2026-11-11T06:00:00.000Z'), 120),
    ).toEqual({ canCancel: true, canReschedule: true })
    expect(managementPermissions('cancelled', start, now, 0)).toEqual({
      canCancel: false,
      canReschedule: false,
    })
  })

  it('builds exactly the configured horizon', () => {
    const dates = publicDateWindow('2026-11-10', 30)
    expect(dates).toHaveLength(30)
    expect(dates[0]).toBe('2026-11-10')
    expect(dates[29]).toBe(addDaysToDateKey('2026-11-10', 29))
  })
})
