import { describe, expect, it } from 'vitest'

import {
  addDaysToDateKey,
  dayRange,
  formatDateKey,
  formatDateLong,
  formatTime,
  formatWeekday,
  localDateTimeToInstant,
  minutesOfDayFromInstant,
  weekdayIndexFromDateKey,
} from './time'

describe('time helpers', () => {
  it('formats dates and times in the required local format', () => {
    expect(formatDateKey('2026-11-10')).toBe('10.11.2026')
    expect(formatDateLong('2026-11-10')).toBe('utorak, 10.11.2026')
    expect(formatWeekday('2026-11-10')).toBe('utorak')
    expect(weekdayIndexFromDateKey('2026-11-09')).toBe(0)
    expect(weekdayIndexFromDateKey('2026-11-15')).toBe(6)
  })

  it('converts local salon wall time to UTC instants', () => {
    const instant = localDateTimeToInstant('2026-11-10', '09:30')
    expect(instant).toBe('2026-11-10T08:30:00.000Z')
    expect(instant ? formatTime(instant) : null).toBe('09:30')
    expect(instant ? minutesOfDayFromInstant(instant) : null).toBe(570)
  })

  it('handles the spring-forward gap without silently changing the time', () => {
    expect(localDateTimeToInstant('2026-03-29', '02:30')).toBeNull()
    expect(localDateTimeToInstant('2026-03-29', '03:30')).not.toBeNull()
  })

  it('accepts the repeated autumn wall time', () => {
    const instant = localDateTimeToInstant('2026-10-25', '02:30')
    expect(instant).not.toBeNull()
    expect(instant ? formatTime(instant) : null).toBe('02:30')
  })

  it('builds 23-hour and 25-hour local days across DST', () => {
    const spring = dayRange('2026-03-29')
    const autumn = dayRange('2026-10-25')
    expect((new Date(spring.to).getTime() - new Date(spring.from).getTime()) / 3_600_000).toBe(23)
    expect((new Date(autumn.to).getTime() - new Date(autumn.from).getTime()) / 3_600_000).toBe(25)
  })

  it('adds calendar days without adding fixed 24-hour blocks', () => {
    expect(addDaysToDateKey('2026-03-28', 2)).toBe('2026-03-30')
    expect(addDaysToDateKey('2026-10-24', 2)).toBe('2026-10-26')
  })
})
