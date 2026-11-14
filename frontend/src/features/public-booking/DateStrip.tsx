import { useMemo } from 'react'

import {
  HorizontalDateStrip,
  type DateStripItem,
} from '@/components/date-strip/HorizontalDateStrip'
import { formatDateCompact, formatDateLong, formatWeekday, todayDateKey } from '@/lib/time'

export interface DayAvailability {
  /** Slots still bookable on this day; undefined while still unknown. */
  free?: number
  closed?: boolean
}

/**
 * The guest's day picker: the shared horizontal strip, fed with what each day knows —
 * how many slots are free, or that the salon is closed.
 */
export function DateStrip({
  dates,
  selected,
  onSelect,
  label = 'Izaberite datum',
  dayInfo,
}: {
  dates: string[]
  selected: string
  onSelect: (dateKey: string) => void
  label?: string
  dayInfo?: Record<string, DayAvailability>
}) {
  const today = todayDateKey()

  const items: DateStripItem[] = useMemo(
    () =>
      dates.map((dateKey) => {
        const info = dayInfo?.[dateKey]
        const free = info?.free
        const isToday = dateKey === today
        const soldOut = free !== undefined && free === 0
        const hint = isToday
          ? 'danas'
          : soldOut
            ? info?.closed
              ? 'ne radi'
              : 'puno'
            : free !== undefined
              ? `${free}`
              : undefined
        const freeLabel =
          free === undefined
            ? null
            : free === 0
              ? info?.closed
                ? 'salon ne radi'
                : 'nema slobodnih termina'
              : `${free} slobodnih termina`
        return {
          dateKey,
          label: `${formatDateLong(dateKey)}${freeLabel ? `, ${freeLabel}` : ''}`,
          weekday: formatWeekday(dateKey, true),
          day: formatDateCompact(dateKey),
          hint,
          muted: soldOut,
        }
      }),
    [dates, dayInfo, today],
  )

  return <HorizontalDateStrip label={label} items={items} value={selected} onChange={onSelect} />
}
