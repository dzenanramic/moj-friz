import type { AppointmentStatus, AvailabilitySlot } from '@/data/types'

import {
  addDaysToDateKey,
  addMinutesToInstant,
  dateKeyFromInstant,
  localDateTimeToInstant,
  minutesFromTime,
  SLOT_STEP_MINUTES,
  timeFromMinutes,
  zoned,
} from './time'

export interface WorkingInterval {
  start: string
  end: string
}

export interface BusyInterval {
  id: string
  startsAt: string
  endsAt: string
}

export interface SlotGenerationInput {
  dateKey: string
  durationMinutes: number
  workingIntervals: WorkingInterval[]
  busy: BusyInterval[]
  minStart?: string
  maxStart?: string
  stepMinutes?: number
  excludeEntryId?: string
}

export interface SlotGenerationResult {
  slots: AvailabilitySlot[]
  isClosed: boolean
  isFull: boolean
}

export function statusBlocksTime(status: AppointmentStatus): boolean {
  return status !== 'cancelled'
}

export function intervalOverlaps(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
): boolean {
  return (
    new Date(aStart).getTime() < new Date(bEnd).getTime() &&
    new Date(bStart).getTime() < new Date(aEnd).getTime()
  )
}

export function findBusyConflict(
  startsAt: string,
  endsAt: string,
  busy: BusyInterval[],
  excludeEntryId?: string,
): BusyInterval | undefined {
  return busy.find(
    (entry) =>
      entry.id !== excludeEntryId &&
      intervalOverlaps(startsAt, endsAt, entry.startsAt, entry.endsAt),
  )
}

function localMinutesOfInstant(instant: string): number {
  const local = zoned(instant)
  return local.getHours() * 60 + local.getMinutes()
}

export function fitsWorkingHours(
  dateKey: string,
  startsAt: string,
  durationMinutes: number,
  workingIntervals: WorkingInterval[],
): boolean {
  if (dateKeyFromInstant(startsAt) !== dateKey || durationMinutes <= 0) return false

  const localStart = localMinutesOfInstant(startsAt)
  return workingIntervals.some((interval) => {
    const start = minutesFromTime(interval.start)
    const end = minutesFromTime(interval.end)
    if (start === null || end === null || end <= start) return false
    return localStart >= start && localStart + durationMinutes <= end
  })
}

export function generateSlots({
  dateKey,
  durationMinutes,
  workingIntervals,
  busy,
  minStart,
  maxStart,
  stepMinutes = SLOT_STEP_MINUTES,
  excludeEntryId,
}: SlotGenerationInput): SlotGenerationResult {
  if (workingIntervals.length === 0 || durationMinutes <= 0) {
    return { slots: [], isClosed: workingIntervals.length === 0, isFull: false }
  }

  const minMs = minStart ? new Date(minStart).getTime() : null
  const maxMs = maxStart ? new Date(maxStart).getTime() : null
  const seen = new Set<number>()
  const slots: AvailabilitySlot[] = []

  for (const interval of workingIntervals) {
    const intervalStart = minutesFromTime(interval.start)
    const intervalEnd = minutesFromTime(interval.end)
    if (intervalStart === null || intervalEnd === null || intervalEnd <= intervalStart) continue

    for (
      let startMinute = intervalStart;
      startMinute + durationMinutes <= intervalEnd;
      startMinute += stepMinutes
    ) {
      const startInstant = localDateTimeToInstant(dateKey, timeFromMinutes(startMinute))
      if (!startInstant) continue
      const startMs = new Date(startInstant).getTime()
      if (seen.has(startMs)) continue
      if (minMs !== null && startMs < minMs) continue
      if (maxMs !== null && startMs > maxMs) continue

      const endInstant = addMinutesToInstant(startInstant, durationMinutes)
      if (findBusyConflict(startInstant, endInstant, busy, excludeEntryId)) continue

      seen.add(startMs)
      slots.push({ startsAt: startInstant, endsAt: endInstant })
    }
  }

  slots.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
  return { slots, isClosed: false, isFull: slots.length === 0 }
}

export type PlacementError = 'OUTSIDE_WORKING_HOURS' | 'SLOT_UNAVAILABLE'

export function validatePlacement(params: {
  dateKey: string
  startsAt: string
  durationMinutes: number
  workingIntervals: WorkingInterval[]
  busy: BusyInterval[]
  excludeEntryId?: string
}): PlacementError | null {
  if (
    !fitsWorkingHours(
      params.dateKey,
      params.startsAt,
      params.durationMinutes,
      params.workingIntervals,
    )
  ) {
    return 'OUTSIDE_WORKING_HOURS'
  }

  const endsAt = addMinutesToInstant(params.startsAt, params.durationMinutes)
  if (findBusyConflict(params.startsAt, endsAt, params.busy, params.excludeEntryId)) {
    return 'SLOT_UNAVAILABLE'
  }
  return null
}

export interface ManagementPermissions {
  canCancel: boolean
  canReschedule: boolean
}

export function managementPermissions(
  status: AppointmentStatus,
  startsAt: string,
  now: Date,
  cutoffMinutes: number,
): ManagementPermissions {
  const cutoff = new Date(startsAt).getTime() - cutoffMinutes * 60_000
  const allowed = status === 'confirmed' && now.getTime() <= cutoff
  return { canCancel: allowed, canReschedule: allowed }
}

export function publicDateWindow(todayKey: string, horizonDays: number): string[] {
  const safeHorizon = Math.max(1, Math.min(horizonDays, 90))
  return Array.from({ length: safeHorizon }, (_, index) => addDaysToDateKey(todayKey, index))
}

export function isDateInPublicWindow(
  dateKey: string,
  todayKey: string,
  horizonDays: number,
): boolean {
  const last = addDaysToDateKey(todayKey, Math.max(0, horizonDays - 1))
  return dateKey >= todayKey && dateKey <= last
}

export function publicMinStart(now: Date, leadMinutes: number): string {
  return new Date(now.getTime() + Math.max(0, leadMinutes) * 60_000).toISOString()
}
