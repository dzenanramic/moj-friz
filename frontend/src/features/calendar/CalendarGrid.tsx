/* Mouse click on empty grid space is a convenience; every action has a keyboard-accessible control. */
/* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
import { useEffect, useState, type MouseEvent } from 'react'

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

/**
 * A phone gets a narrower hour gutter and a narrower column, so two or three hairdressers fit
 * beside each other before the grid has to scroll sideways; the desks get the roomy ones. Both
 * are in px for the inline grid template, so the media query is read in JS.
 */
const GUTTER_WIDTH = 58
const GUTTER_WIDTH_NARROW = 44
const MIN_COLUMN_WIDTH = 186
const MIN_COLUMN_WIDTH_NARROW = 132
const NARROW_MEDIA = '(max-width: 639px)'
const HOUR_HEIGHT = 64

interface CalendarGridProps {
  dateKey: string
  now: Date
  hairdressers: Hairdresser[]
  workingHours: WorkingHoursInterval[]
  appointments: AppointmentView[]
  /** Breaks and absences, drawn as shaded bands. The calendar page does not show them. */
  blocks?: TimeBlock[]
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
  blocks = [],
  onOpenAppointment,
  onCreateAt,
}: CalendarGridProps) {
  const narrow = useMediaQuery(NARROW_MEDIA)
  const gutterWidth = narrow ? GUTTER_WIDTH_NARROW : GUTTER_WIDTH
  const minColumnWidth = narrow ? MIN_COLUMN_WIDTH_NARROW : MIN_COLUMN_WIDTH
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
    <div className="overflow-x-auto rounded-md border border-line bg-surface py-2">
      <div
        className="min-w-full"
        style={{
          minWidth: gutterWidth + hairdressers.length * minColumnWidth,
        }}
      >
        <div
          className="grid"
          style={{
            gridTemplateColumns: `${gutterWidth}px repeat(${hairdressers.length}, minmax(${minColumnWidth}px, 1fr))`,
          }}
        >
          <div />
          {hairdressers.map((hairdresser) => {
            const intervals = intervalsFor(hairdresser.id)
            return (
              <div
                key={hairdresser.id}
                data-staff={hairdresser.colorKey}
                className="px-2 pb-2 sm:px-3 sm:pb-3"
              >
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
            gridTemplateColumns: `${gutterWidth}px repeat(${hairdressers.length}, minmax(${minColumnWidth}px, 1fr))`,
            height: totalHeight,
          }}
        >
          <div className="relative">
            {hourMarks.map((minute) => (
              <span
                key={minute}
                className="tabular absolute right-1.5 -translate-y-1/2 text-[0.7rem] text-muted sm:right-2 sm:text-xs"
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
            const closedStretches = closedStretchesFor(intervals, gridStart, gridEnd)
            return (
              <div
                key={hairdresser.id}
                data-staff={hairdresser.colorKey}
                className="relative cursor-copy bg-paper"
                onClick={(event) => handleColumnClick(event, hairdresser.id)}
              >
                {/*
                 * Hours outside this hairdresser's day are hatched paper; open hours are the
                 * surface. Free space in the day therefore reads as the page, and a slot
                 * nobody can book never looks like one somebody can.
                 */}
                {closedStretches.map((stretch) => (
                  <div
                    key={stretch.key}
                    aria-hidden="true"
                    className="closed-hatch pointer-events-none absolute inset-x-0"
                    style={stretch.style}
                  />
                ))}

                {/*
                 * The grid is a choice on a phone now, so a hairdresser with no hours today is
                 * a column of hatching with nothing to explain it. The hint sits inside the
                 * open hours, where a tap would otherwise still open a form.
                 */}
                {intervals.length === 0 && gridEnd > gridStart ? (
                  <p
                    data-ignore-column-click
                    className="pointer-events-none absolute inset-x-1 top-3 z-[2] rounded-xs px-1 text-center text-[0.7rem] leading-snug text-muted"
                  >
                    Ne radi danas
                  </p>
                ) : null}

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
                    className="pointer-events-none absolute inset-x-0 border-t"
                    style={{
                      top: ((minute - gridStart) / 60) * HOUR_HEIGHT,
                      borderTopColor: 'var(--rule-grid)',
                    }}
                  />
                ))}

                {staffBlocks.map((block) => {
                  const position = positionFor(block.startsAt, block.endsAt)
                  return (
                    <div
                      key={block.id}
                      data-ignore-column-click
                      className="closed-hatch pointer-events-none absolute inset-x-1 z-[2] overflow-hidden rounded-xs px-1.5 py-1"
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
                  // A card shows what fits in the height it got from its slot, not what its
                  // duration promises: a clipped line is worse than a shorter card.
                  const height = position.height
                  const tight = height < 40
                  const showName = height >= 32
                  const showService = height >= 54
                  return (
                    <button
                      key={appointment.id}
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        onOpenAppointment(appointment)
                      }}
                      /*
                       * Text on a hairdresser's tinted card is `--staff-ink`, not `muted`: the
                       * tint is the card, so the card's own pair carries the second line.
                       */
                      className={cn(
                        'staff-soft absolute inset-x-1 z-[3] overflow-hidden rounded-xs border-l-[3px] px-2 text-left transition-colors',
                        'hover:brightness-[0.96]',
                        tight ? 'py-0.5' : 'py-1',
                      )}
                      style={{
                        ...position,
                        borderLeftColor: 'var(--staff)',
                      }}
                    >
                      <p className="tabular text-[0.68rem] leading-tight font-medium staff-text">
                        {formatTimeRange(appointment.startsAt, appointment.endsAt)}
                      </p>
                      {showName ? (
                        <p
                          className={cn(
                            'truncate text-xs font-semibold text-ink',
                            tight ? 'leading-tight' : 'leading-snug',
                          )}
                        >
                          {appointment.serviceName}
                          <br />
                          {appointment.clientName}
                        </p>
                      ) : null}
                      {showService ? (
                        <p className="truncate text-[0.68rem] leading-snug staff-text">
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

interface ClosedStretch {
  key: string
  style: { top: number; height: number }
}

/**
 * The hours of the grid a hairdresser is not working, as one stretch per gap: before the day
 * starts, after it ends, and between two intervals (a split shift). Each is hatched, so it
 * cannot be read as a free slot.
 */
function closedStretchesFor(
  intervals: WorkingHoursInterval[],
  gridStart: number,
  gridEnd: number,
): ClosedStretch[] {
  const open = intervals
    .map((interval) => ({ start: parseMinutes(interval.start), end: parseMinutes(interval.end) }))
    .filter((interval): interval is { start: number; end: number } =>
      Boolean(interval.start !== null && interval.end !== null),
    )
    .map((interval) => ({
      start: Math.max(interval!.start, gridStart),
      end: Math.min(interval!.end, gridEnd),
    }))
    .filter((interval) => interval.end > interval.start)
    .sort((a, b) => a.start - b.start)

  const stretches: ClosedStretch[] = []
  let cursor = gridStart
  for (const interval of open) {
    if (interval.start > cursor) {
      stretches.push({
        key: `closed-${cursor}-${interval.start}`,
        style: {
          top: ((cursor - gridStart) / 60) * HOUR_HEIGHT,
          height: ((interval.start - cursor) / 60) * HOUR_HEIGHT,
        },
      })
    }
    cursor = Math.max(cursor, interval.end)
  }
  if (cursor < gridEnd) {
    stretches.push({
      key: `closed-${cursor}-${gridEnd}`,
      style: {
        top: ((cursor - gridStart) / 60) * HOUR_HEIGHT,
        height: ((gridEnd - cursor) / 60) * HOUR_HEIGHT,
      },
    })
  }
  return stretches
}

function isNumber(value: number | null): value is number {
  return value !== null
}

/**
 * True while the viewport matches `query`. The grid needs this in JS because its column template
 * is an inline style, not a utility class. Without `matchMedia` it reports false: the roomy grid.
 */
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(
    () =>
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia(query).matches,
  )

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const list = window.matchMedia(query)
    const onChange = () => setMatches(list.matches)
    onChange()
    list.addEventListener('change', onChange)
    return () => list.removeEventListener('change', onChange)
  }, [query])

  return matches
}
