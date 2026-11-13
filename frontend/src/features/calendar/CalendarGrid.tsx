/* Mouse click on empty grid space is a convenience; every action has a keyboard-accessible control. */
/* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
import type { MouseEvent } from 'react'

import { cn } from '@/lib/cn'
import type { AppointmentView, Hairdresser, TimeBlock, WorkingHoursInterval } from '@/data/types'
import { formatDuration } from '@/lib/format'
import {
  formatTime,
  formatTimeRange,
  minutesOfDayFromInstant,
  timeFromMinutes,
  todayDateKey,
  weekdayIndexFromDateKey,
} from '@/lib/time'

const GUTTER_WIDTH = 58
const MIN_COLUMN_WIDTH = 186
const HOUR_HEIGHT = 64

interface CalendarGridProps {
  dateKey: string
  now: Date
  hairdressers: Hairdresser[]
  workingHours: WorkingHoursInterval[]
  appointments: AppointmentView[]
  blocks: TimeBlock[]
  onOpenAppointment: (appointment: AppointmentView) => void
  onCreateAt: (hairdresserId: string, time: string) => void
}

interface Positioned {
  top: number
  height: number
}

export function CalendarGrid({
  dateKey,
  now,
  hairdressers,
  workingHours,
  appointments,
  blocks,
  onOpenAppointment,
  onCreateAt,
}: CalendarGridProps) {
  const weekday = weekdayIndexFromDateKey(dateKey)
  const intervalsFor = (hairdresserId: string) =>
    workingHours.filter(
      (interval) => interval.hairdresserId === hairdresserId && interval.weekday === weekday,
    )

  const allIntervals = hairdressers.flatMap((hairdresser) => intervalsFor(hairdresser.id))
  if (allIntervals.length === 0) return null

  const starts = allIntervals.map((interval) => parseMinutes(interval.start)).filter(isNumber)
  const ends = allIntervals.map((interval) => parseMinutes(interval.end)).filter(isNumber)
  const gridStart = Math.max(6 * 60, Math.min(...starts))
  const gridEnd = Math.min(22 * 60, Math.max(...ends))
  const totalHeight = ((gridEnd - gridStart) / 60) * HOUR_HEIGHT
  const isToday = dateKey === todayDateKey(now)
  const nowMinutes = minutesOfDayFromInstant(now.toISOString())
  const nowTop = ((nowMinutes - gridStart) / 60) * HOUR_HEIGHT
  const showNow = isToday && nowMinutes >= gridStart && nowMinutes <= gridEnd

  const positionFor = (startsAt: string, endsAt: string): Positioned => {
    const start = minutesOfDayFromInstant(startsAt)
    const end = minutesOfDayFromInstant(endsAt)
    return {
      top: ((start - gridStart) / 60) * HOUR_HEIGHT,
      height: Math.max(((end - start) / 60) * HOUR_HEIGHT, 26),
    }
  }

  const hourMarks: number[] = []
  for (let minute = Math.ceil(gridStart / 60) * 60; minute <= gridEnd; minute += 60) {
    hourMarks.push(minute)
  }

  const handleColumnClick = (event: MouseEvent<HTMLDivElement>, hairdresserId: string) => {
    if ((event.target as HTMLElement).closest('[data-ignore-column-click]')) return
    const target = event.currentTarget
    const rect = target.getBoundingClientRect()
    const offset = Math.max(0, Math.min(event.clientY - rect.top, totalHeight))
    const rawMinutes = gridStart + (offset / HOUR_HEIGHT) * 60
    const snapped = Math.round(rawMinutes / 15) * 15
    onCreateAt(hairdresserId, timeFromMinutes(snapped))
  }

  return (
    <div className="overflow-x-auto rounded-lg bg-surface py-2">
      <div
        className="min-w-full"
        style={{
          minWidth: GUTTER_WIDTH + hairdressers.length * MIN_COLUMN_WIDTH,
        }}
      >
        <div
          className="grid"
          style={{
            gridTemplateColumns: `${GUTTER_WIDTH}px repeat(${hairdressers.length}, minmax(${MIN_COLUMN_WIDTH}px, 1fr))`,
          }}
        >
          <div />
          {hairdressers.map((hairdresser) => {
            const intervals = intervalsFor(hairdresser.id)
            return (
              <div key={hairdresser.id} data-staff={hairdresser.colorKey} className="px-3 pb-3">
                <div className="flex items-center gap-2">
                  <span aria-hidden="true" className="staff-bar h-3 w-[3px] rounded-xs" />
                  <p className="truncate text-sm font-semibold text-ink">
                    {hairdresser.displayName}
                  </p>
                </div>
                <p className="tabular mt-1 pl-[11px] text-xs text-muted">
                  {intervals.length > 0
                    ? intervals.map((interval) => `${interval.start}–${interval.end}`).join(', ')
                    : 'Ne radi'}
                </p>
              </div>
            )
          })}
        </div>

        <div
          className="relative grid"
          style={{
            gridTemplateColumns: `${GUTTER_WIDTH}px repeat(${hairdressers.length}, minmax(${MIN_COLUMN_WIDTH}px, 1fr))`,
            height: totalHeight,
          }}
        >
          <div className="relative">
            {hourMarks.map((minute) => (
              <span
                key={minute}
                className="tabular absolute right-2 -translate-y-1/2 text-xs text-muted"
                style={{ top: ((minute - gridStart) / 60) * HOUR_HEIGHT }}
              >
                {timeFromMinutes(minute)}
              </span>
            ))}
            {showNow ? (
              <span
                className="calendar-now-label tabular absolute right-1 z-10 -translate-y-1/2 rounded-xs px-1 py-0.5 text-[0.7rem] font-semibold"
                style={{ top: nowTop }}
              >
                {formatTime(now.toISOString())}
              </span>
            ) : null}
          </div>

          {hairdressers.map((hairdresser) => {
            const intervals = intervalsFor(hairdresser.id)
            const staffAppointments = appointments.filter(
              (appointment) => appointment.hairdresserId === hairdresser.id,
            )
            const staffBlocks = blocks.filter((block) => block.hairdresserId === hairdresser.id)
            return (
              <div
                key={hairdresser.id}
                data-staff={hairdresser.colorKey}
                className="relative cursor-copy bg-paper"
                onClick={(event) => handleColumnClick(event, hairdresser.id)}
              >
                {intervals.map((interval) => {
                  const start = parseMinutes(interval.start)
                  const end = parseMinutes(interval.end)
                  if (start === null || end === null) return null
                  return (
                    <div
                      key={interval.id}
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-0 bg-surface"
                      style={{
                        top: ((Math.max(start, gridStart) - gridStart) / 60) * HOUR_HEIGHT,
                        height:
                          ((Math.min(end, gridEnd) - Math.max(start, gridStart)) / 60) *
                          HOUR_HEIGHT,
                      }}
                    />
                  )
                })}

                {hourMarks.map((minute) => (
                  <div
                    key={minute}
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 border-t border-line"
                    style={{ top: ((minute - gridStart) / 60) * HOUR_HEIGHT }}
                  />
                ))}

                {staffBlocks.map((block) => {
                  const position = positionFor(block.startsAt, block.endsAt)
                  return (
                    <div
                      key={block.id}
                      data-ignore-column-click
                      className="pointer-events-none absolute inset-x-1 z-[2] overflow-hidden rounded-xs bg-paper px-1.5 py-1"
                      style={position}
                      title={`${block.reason}: ${formatTimeRange(block.startsAt, block.endsAt)}`}
                    >
                      <p className="truncate text-[0.68rem] leading-tight font-medium text-muted">
                        {block.reason}
                      </p>
                      <p className="tabular truncate text-[0.65rem] leading-tight text-muted">
                        {formatTimeRange(block.startsAt, block.endsAt)}
                      </p>
                    </div>
                  )
                })}

                {staffAppointments.map((appointment) => {
                  const position = positionFor(appointment.startsAt, appointment.endsAt)
                  const compact = appointment.durationMinutesSnapshot < 45
                  return (
                    <button
                      key={appointment.id}
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        onOpenAppointment(appointment)
                      }}
                      className={cn(
                        'staff-soft absolute inset-x-1 z-[3] overflow-hidden rounded-xs border-l-[3px] px-2 py-1 text-left transition-colors',
                        'hover:brightness-[0.97]',
                      )}
                      style={{
                        ...position,
                        borderLeftColor: 'var(--staff)',
                      }}
                    >
                      <p className="tabular text-[0.68rem] leading-tight font-medium text-muted">
                        {formatTimeRange(appointment.startsAt, appointment.endsAt)}
                      </p>
                      <p className="truncate text-xs leading-snug font-semibold text-ink">
                        {appointment.clientName}
                      </p>
                      {!compact ? (
                        <p className="truncate text-[0.68rem] leading-snug text-muted">
                          {appointment.serviceName} ·{' '}
                          {formatDuration(appointment.durationMinutesSnapshot)}
                        </p>
                      ) : null}
                    </button>
                  )
                })}

                {showNow ? (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 z-[4]"
                    style={{ top: nowTop }}
                  >
                    <div className="calendar-now-line" />
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function parseMinutes(time: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(time)
  if (!match) return null
  return Number(match[1]) * 60 + Number(match[2])
}

function isNumber(value: number | null): value is number {
  return value !== null
}
