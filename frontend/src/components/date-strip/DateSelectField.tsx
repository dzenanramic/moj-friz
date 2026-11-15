import { useMemo, useState, type ReactNode } from 'react'

import { CustomField } from '@/components/ui/form'
import {
  addDaysToDateKey,
  capitalizeFirst,
  formatDateCompact,
  formatDateKey,
  formatDateLong,
  formatWeekday,
  rangeDateKeys,
} from '@/lib/time'

/** The days on the first screen: two rows of five, a fortnight of dates. */
const FIRST_DAYS = 10

/** The most the picker offers: today and the next quarter, as the calendar works. */
const HORIZON_DAYS = 90

/** A day chosen near the end of the screen always keeps this many after it on screen. */
const MARGIN_DAYS = 3

/** Days a row on every width: two rows give the same shape on a phone and on a desktop. */
const DAYS_PER_ROW = 5

/** A lone day on a new row is absorbed into the rows above it rather than shown alone. */
const MAX_ORPHANS = 1

const KEY_MOVES: Record<string, number> = {
  ArrowRight: 1,
  ArrowLeft: -1,
  ArrowDown: DAYS_PER_ROW,
  ArrowUp: -DAYS_PER_ROW,
}

/**
 * The day of an appointment or a break: a grid of day buttons, not a native date select.
 *
 * A native select opens the operating system's own menu over the sheet, and the sheet's focus
 * trap fights that menu: the day can close by itself and land on a neighbour. A grid has no such
 * menu, so the day changes only when the owner presses a day.
 */
export function DateSelectField({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  startDateKey,
}: {
  id: string
  label: string
  /** The chosen day, YYYY-MM-DD in salon time. */
  value: string
  onChange: (dateKey: string) => void
  error?: string
  hint?: ReactNode
  /** The first day offered, usually today. */
  startDateKey: string
}) {
  const horizon = useMemo(
    () => rangeDateKeys(startDateKey, addDaysToDateKey(startDateKey, HORIZON_DAYS - 1)),
    [startDateKey],
  )

  // A day from outside the quarter (an old appointment, or a demo opened the next morning) joins
  // the days at its end, so it stays selectable.
  const allDays = useMemo(
    () =>
      value >= startDateKey && value <= horizon[horizon.length - 1]!
        ? horizon
        : [...horizon, value].sort(),
    [horizon, startDateKey, value],
  )

  const [extraDays, setExtraDays] = useState(0)
  const capacity = Math.max(FIRST_DAYS, extraDays)
  const chosenIndex = allDays.indexOf(value)
  const end = Math.min(allDays.length, Math.max(capacity, chosenIndex + 1 + MARGIN_DAYS))
  // Whole rows only, so a step never leaves a ragged edge behind.
  const daysOnScreen = useMemo(() => {
    const shown = allDays.slice(0, end)
    const wholeRows = Math.ceil(shown.length / DAYS_PER_ROW) * DAYS_PER_ROW
    return wholeRows - shown.length <= MAX_ORPHANS ? allDays.slice(0, wholeRows) : shown
  }, [allDays, end])
  const more = end < allDays.length

  const neighbour = (moves: number) => allDays[chosenIndex + moves] ?? null

  return (
    <CustomField
      label={label}
      htmlFor={id}
      hint={typeof hint === 'string' ? hint : undefined}
      error={error}
      summary={
        value
          ? `${capitalizeFirst(formatDateLong(value))}${
              value === startDateKey
                ? ' (danas)'
                : value === addDaysToDateKey(startDateKey, 1)
                  ? ' (sutra)'
                  : ''
            }`
          : null
      }
    >
      <div
        id={id}
        role="toolbar"
        aria-label={label}
        className="rounded-md bg-paper p-1.5"
        onKeyDown={(event) => {
          const moves = KEY_MOVES[event.key]
          if (!moves) return
          const next = neighbour(moves)
          if (!next || next === value) return
          event.preventDefault()
          onChange(next)
        }}
      >
        <div className="picker-days">
          {daysOnScreen.map((day) => {
            const chosen = day === value
            return (
              <button
                key={day}
                type="button"
                onClick={() => onChange(day)}
                aria-pressed={chosen}
                aria-label={`${formatWeekday(day)}, ${formatDateKey(day)}`}
                tabIndex={chosen ? 0 : -1}
                className={chosen ? 'picker-day bg-primary text-on-primary' : 'picker-day'}
              >
                {formatDateCompact(day)}
              </button>
            )
          })}
        </div>
        {more ? (
          <button
            type="button"
            onClick={() => setExtraDays(Math.max(capacity, end) + FIRST_DAYS)}
            className="picker-more"
          >
            Više datuma
          </button>
        ) : null}
      </div>
    </CustomField>
  )
}
