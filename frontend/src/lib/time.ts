import { TZDate } from '@date-fns/tz'

export const SALON_TIMEZONE = 'Europe/Sarajevo'
export const SLOT_STEP_MINUTES = 15
export const WEEK_STARTS_ON = 0

const WEEKDAYS = [
  'ponedjeljak',
  'utorak',
  'srijeda',
  'četvrtak',
  'petak',
  'subota',
  'nedjelja',
] as const

const WEEKDAYS_SHORT = ['pon', 'uto', 'sri', 'čet', 'pet', 'sub', 'ned'] as const

const MONTHS = [
  'januar',
  'februar',
  'mart',
  'april',
  'maj',
  'jun',
  'jul',
  'avgust',
  'septembar',
  'oktobar',
  'novembar',
  'decembar',
] as const

interface DateParts {
  year: number
  month: number
  day: number
}

function pad(value: number, length = 2): string {
  return String(value).padStart(length, '0')
}

function validParts(parts: DateParts): boolean {
  return (
    Number.isInteger(parts.year) &&
    Number.isInteger(parts.month) &&
    Number.isInteger(parts.day) &&
    parts.month >= 1 &&
    parts.month <= 12 &&
    parts.day >= 1 &&
    parts.day <= 31
  )
}

export function parseDateKey(dateKey: string): DateParts | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey)
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const parts = { year, month, day }
  if (!validParts(parts)) return null

  const utc = new Date(Date.UTC(year, month - 1, day, 12))
  if (
    utc.getUTCFullYear() !== year ||
    utc.getUTCMonth() !== month - 1 ||
    utc.getUTCDate() !== day
  ) {
    return null
  }

  return parts
}

export function isValidDateKey(dateKey: string): boolean {
  return parseDateKey(dateKey) !== null
}

function dateKeyFromParts(parts: DateParts): string {
  return `${pad(parts.year, 4)}-${pad(parts.month)}-${pad(parts.day)}`
}

export function zoned(value: string | Date): TZDate {
  return new TZDate(typeof value === 'string' ? new Date(value) : value, SALON_TIMEZONE)
}

export function salonNow(now: Date = new Date()): TZDate {
  return zoned(now)
}

export function dateKeyFromInstant(value: string | Date): string {
  const date = zoned(value)
  return dateKeyFromParts({
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  })
}

export function todayDateKey(now: Date = new Date()): string {
  return dateKeyFromInstant(now)
}

export function addDaysToDateKey(dateKey: string, days: number): string {
  const parts = parseDateKey(dateKey)
  if (!parts) throw new Error(`Invalid date key: ${dateKey}`)
  const utc = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days, 12))
  return dateKeyFromParts({
    year: utc.getUTCFullYear(),
    month: utc.getUTCMonth() + 1,
    day: utc.getUTCDate(),
  })
}

export function weekdayIndexFromDateKey(dateKey: string): number {
  const parts = parseDateKey(dateKey)
  if (!parts) throw new Error(`Invalid date key: ${dateKey}`)
  const utc = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 12))
  return (utc.getUTCDay() + 6) % 7
}

export function rangeDateKeys(startDateKey: string, endDateKey: string): string[] {
  const result: string[] = []
  let current = startDateKey
  let guard = 0
  while (current <= endDateKey && guard < 400) {
    result.push(current)
    current = addDaysToDateKey(current, 1)
    guard += 1
  }
  return result
}

/**
 * The days the calendar's date strip holds: the selected day and the three weeks after it,
 * enough to scroll for a later day without opening a calendar. Near the end of one month
 * the window simply runs into the next.
 */
export const CALENDAR_WINDOW_DAYS = 21

export function calendarWindowDateKeys(selectedDateKey: string): string[] {
  return Array.from({ length: CALENDAR_WINDOW_DAYS }, (_, index) =>
    addDaysToDateKey(selectedDateKey, index),
  )
}

export function weekDateKeys(dateKey: string): string[] {
  const start = addDaysToDateKey(dateKey, -weekdayIndexFromDateKey(dateKey))
  return Array.from({ length: 7 }, (_, index) => addDaysToDateKey(start, index))
}

export function localDateTimeToInstant(dateKey: string, time: string): string | null {
  const parts = parseDateKey(dateKey)
  const match = /^(\d{1,2}):(\d{2})$/.exec(time)
  if (!parts || !match) return null

  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null

  const date = new TZDate(
    parts.year,
    parts.month - 1,
    parts.day,
    hours,
    minutes,
    0,
    0,
    SALON_TIMEZONE,
  )

  // DST spring-forward can make a local wall time nonexistent. Reject it instead
  // of silently booking a different time.
  if (
    date.getFullYear() !== parts.year ||
    date.getMonth() !== parts.month - 1 ||
    date.getDate() !== parts.day ||
    date.getHours() !== hours ||
    date.getMinutes() !== minutes
  ) {
    return null
  }

  return new Date(date.getTime()).toISOString()
}

export function startOfSalonDay(dateKey: string): string {
  const instant = localDateTimeToInstant(dateKey, '00:00')
  if (!instant) throw new Error(`Cannot resolve start of day for ${dateKey}`)
  return instant
}

export function endOfSalonDay(dateKey: string): string {
  return startOfSalonDay(addDaysToDateKey(dateKey, 1))
}

export function dayRange(dateKey: string): { from: string; to: string } {
  return { from: startOfSalonDay(dateKey), to: endOfSalonDay(dateKey) }
}

export function formatDateKey(dateKey: string): string {
  const parts = parseDateKey(dateKey)
  if (!parts) return dateKey
  return `${pad(parts.day)}.${pad(parts.month)}.${parts.year}`
}

export function formatDateCompact(dateKey: string): string {
  const parts = parseDateKey(dateKey)
  if (!parts) return dateKey
  return `${pad(parts.day)}.${pad(parts.month)}.`
}

export function formatDateLong(dateKey: string): string {
  const parts = parseDateKey(dateKey)
  if (!parts) return dateKey
  return `${WEEKDAYS[weekdayIndexFromDateKey(dateKey)] ?? ''}, ${formatDateKey(dateKey)}`
}

export function formatWeekday(dateKey: string, short = false): string {
  const index = weekdayIndexFromDateKey(dateKey)
  return (short ? WEEKDAYS_SHORT[index] : WEEKDAYS[index]) ?? ''
}

export function formatDayNumber(dateKey: string): string {
  return pad(parseDateKey(dateKey)?.day ?? 1)
}

export function formatMonth(dateKey: string): string {
  const parts = parseDateKey(dateKey)
  return parts ? (MONTHS[parts.month - 1] ?? '') : ''
}

export function formatMonthYear(dateKey: string): string {
  const parts = parseDateKey(dateKey)
  if (!parts) return ''
  return `${MONTHS[parts.month - 1] ?? ''} ${parts.year}`
}

export function formatInstantDate(instant: string): string {
  return formatDateKey(dateKeyFromInstant(instant))
}

export function minutesOfDayFromInstant(instant: string): number {
  const date = zoned(instant)
  return date.getHours() * 60 + date.getMinutes()
}

export function formatTime(instant: string): string {
  const date = zoned(instant)
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function formatTimeRange(startsAt: string, endsAt: string): string {
  return `${formatTime(startsAt)}–${formatTime(endsAt)}`
}

export function formatDateTime(instant: string): string {
  return `${formatDateKey(dateKeyFromInstant(instant))} u ${formatTime(instant)}`
}

export function minutesFromTime(time: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time)
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null
  return hours * 60 + minutes
}

export function timeFromMinutes(minutes: number): string {
  const normalized = ((minutes % (24 * 60)) + 24 * 60) % (24 * 60)
  return `${pad(Math.floor(normalized / 60))}:${pad(normalized % 60)}`
}

export function minutesBetween(startInstant: string, endInstant: string): number {
  return Math.round((new Date(endInstant).getTime() - new Date(startInstant).getTime()) / 60000)
}

export function addMinutesToInstant(instant: string, minutes: number): string {
  return new Date(new Date(instant).getTime() + minutes * 60_000).toISOString()
}

export function relativeDayLabel(dateKey: string, todayKey: string): string {
  if (dateKey === todayKey) return 'Danas'
  if (dateKey === addDaysToDateKey(todayKey, 1)) return 'Sutra'
  if (dateKey === addDaysToDateKey(todayKey, -1)) return 'Juče'
  return formatDateLong(dateKey)
}

export function isPastInstant(instant: string, now: Date = new Date()): boolean {
  return new Date(instant).getTime() < now.getTime()
}

export function isInstantOnDate(instant: string, dateKey: string): boolean {
  return dateKeyFromInstant(instant) === dateKey
}

export function isSalonToday(instantOrDateKey: string, now: Date = new Date()): boolean {
  if (/^\d{4}-\d{2}-\d{2}$/.test(instantOrDateKey)) {
    return instantOrDateKey === todayDateKey(now)
  }
  return dateKeyFromInstant(instantOrDateKey) === todayDateKey(now)
}

export function salonHourFraction(now: Date = new Date()): number {
  const date = salonNow(now)
  return date.getHours() + date.getMinutes() / 60
}

export function isoWeekdayLabel(weekday: number, short = false): string {
  const index = ((weekday % 7) + 7) % 7
  return (short ? WEEKDAYS_SHORT[index] : WEEKDAYS[index]) ?? ''
}

export function fullMonthName(monthIndex: number): string {
  return MONTHS[((monthIndex % 12) + 12) % 12] ?? ''
}

export function capitalizeFirst(value: string): string {
  if (!value) return value
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function dateKeyToDate(dateKey: string): Date {
  const parts = parseDateKey(dateKey)
  if (!parts) throw new Error(`Invalid date key: ${dateKey}`)
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 12))
}
