import { CalendarRange, List, type LucideIcon } from 'lucide-react'

import { cn } from '@/lib/cn'
import { useMediaQuery } from '@/lib/hooks'

import type { CalendarView } from './useCalendarView'

interface ViewOption {
  value: CalendarView
  /** The word on a wide screen. */
  label: string
  /** The word on a phone, where it shares a line with the page title. */
  shortLabel: string
  /** The accessible name, e.g. "Prikaži raspored po satima". */
  name: string
  icon: LucideIcon
}

const OPTIONS: ViewOption[] = [
  {
    value: 'agenda',
    label: 'Lista',
    shortLabel: 'Lista',
    name: 'Prikaži listu termina',
    icon: List,
  },
  {
    value: 'grid',
    label: 'Raspored',
    shortLabel: 'Tabela',
    name: 'Prikaži raspored po satima',
    icon: CalendarRange,
  },
]

/** Where the short phone labels give way to the full words. */
const WIDE_LABELS = '(min-width: 40rem)'

/**
 * The agenda/grid switch, as the segmented control a phone already teaches.
 *
 * A sunken grey track with a hairline around it, and the chosen half is a raised white pill that
 * sits slightly above the track — the shape of a system switch, not of a pair of buttons. It reads
 * as one control because the track is one object: no inner border, no shadow of its own. The
 * chosen pill carries the label at full weight; the other side stays muted until pressed.
 *
 * Each half is a real radio, so the arrow keys move between them and a screen reader hears a
 * choice of two. It sits in the page header beside the title; on a phone the labels shorten to
 * "Lista" / "Sat" so the pair stays one line next to a large "Kalendar".
 */
export function CalendarViewSwitch({
  value,
  onChange,
  className,
}: {
  value: CalendarView
  onChange: (next: CalendarView) => void
  className?: string
}) {
  // One label is rendered per width, not two with one hidden: a hidden "Raspored" still widens
  // the button, which is how "Sat" got clipped in a 390px row.
  const wideLabels = useMediaQuery(WIDE_LABELS)

  return (
    <div
      role="radiogroup"
      aria-label="Prikaz dana"
      className={cn(
        // `leading-h1`: the track is one title line tall (see PageHeader `actionsWrap="beside"`).
        // The track is tinted paper, not grey line: on dark a grey track and a white pill are the
        // same weight, and the chosen half disappears.
        'inline-flex h-[max(2.25rem,1.08em)] shrink-0 items-center gap-0.5 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--color-ink)_10%,var(--color-paper))] p-0.5 leading-h1 ring-1 ring-line ring-inset',
        className,
      )}
    >
      {OPTIONS.map((option) => {
        const Icon = option.icon
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={option.name}
            onClick={() => onChange(option.value)}
            className={cn(
              // Tighter inside a 390px row: the pair shares the line with a large "Kalendar".
              'inline-flex h-full items-center gap-1 rounded-full px-2 text-[0.78rem] transition-[background-color,color,box-shadow] duration-150 sm:gap-1.5 sm:px-3 sm:text-[0.8rem]',
              selected
                ? 'bg-surface font-semibold text-ink shadow-card ring-1 ring-line ring-inset'
                : 'font-medium text-muted hover:text-ink active:scale-[0.98]',
            )}
          >
            <Icon
              aria-hidden="true"
              className={cn('h-3.5 w-3.5 shrink-0', selected ? 'text-primary' : 'text-muted')}
            />
            <span>{wideLabels ? option.label : option.shortLabel}</span>
          </button>
        )
      })}
    </div>
  )
}
