import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useRef, type KeyboardEvent, type ReactNode } from 'react'

import { cn } from '@/lib/cn'

export interface DateStripItem {
  /** YYYY-MM-DD in salon time. */
  dateKey: string
  /** The accessible name of the day, e.g. "utorak, 17.11.2026, 34 slobodna termina". */
  label: string
  /** Small line over the date ("uto"). */
  weekday: string
  /** The date itself ("17.11."). */
  day: string
  /** Small line under the date ("danas", "34", "ne radi"). */
  hint?: string
  /** A dot under the date: today or the selected day. */
  dot?: 'today' | 'selected' | false
  /** Draw it muted (closed, or no slots left). */
  muted?: boolean
}

/**
 * A horizontal strip of days: the pattern used for "pick one of the next few days".
 *
 * It is a scroller, not a calendar: one row, swipe or scroll sideways on a phone, snap
 * each day into line so it never stops half-way, arrows and the arrow keys for pointer
 * and keyboard, and the selected day is always scrolled into view when it changes.
 */
export function HorizontalDateStrip({
  items,
  value,
  onChange,
  label,
  showArrows = true,
  className,
  cellClassName,
}: {
  items: DateStripItem[]
  value: string
  onChange: (dateKey: string) => void
  /** The strip's accessible name, e.g. "Izaberite datum". */
  label: string
  showArrows?: boolean
  className?: string
  cellClassName?: (item: DateStripItem, selected: boolean) => string
}) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const selectedRef = useRef<HTMLButtonElement>(null)

  // Keep the chosen day in view whenever it changes, including the first render.
  useEffect(() => {
    const scroller = scrollerRef.current
    const cell = selectedRef.current
    if (!scroller || !cell || typeof scroller.scrollTo !== 'function') return
    const target = cell.offsetLeft - scroller.clientWidth / 2 + cell.clientWidth / 2
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    scroller.scrollTo({ left: Math.max(0, target), behavior: reduce ? 'auto' : 'smooth' })
  }, [value])

  const shift = (amount: number) => {
    const scroller = scrollerRef.current
    if (!scroller || typeof scroller.scrollBy !== 'function') return
    scroller.scrollBy({ left: amount, behavior: 'smooth' })
  }

  /** The selected day moves with the arrow keys; Tab still leaves the strip after one stop. */
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    const index = items.findIndex((item) => item.dateKey === value)
    const next = items[index + (event.key === 'ArrowRight' ? 1 : -1)]
    if (!next) return
    event.preventDefault()
    onChange(next.dateKey)
  }

  return (
    <div className={cn('flex min-w-0 items-center gap-1', className)}>
      {showArrows ? (
        <button
          type="button"
          onClick={() => shift(-240)}
          aria-label="Prethodni datumi"
          className="hidden h-10 w-8 shrink-0 items-center justify-center rounded-sm text-muted transition-colors hover:bg-surface hover:text-ink sm:inline-flex"
        >
          <ChevronLeft aria-hidden="true" className="h-4 w-4" />
        </button>
      ) : null}

      <div
        ref={scrollerRef}
        role="group"
        aria-label={label}
        className="hide-scrollbar flex w-full min-w-0 max-w-full snap-x snap-mandatory gap-1.5 overflow-x-auto px-0.5 py-0.5"
        style={{ scrollPaddingInline: '0.5rem' }}
      >
        {items.map((item) => {
          const selected = item.dateKey === value
          return (
            <button
              key={item.dateKey}
              ref={selected ? selectedRef : undefined}
              type="button"
              onClick={() => onChange(item.dateKey)}
              aria-pressed={selected}
              aria-label={item.label}
              aria-current={selected ? 'date' : undefined}
              data-date-key={item.dateKey}
              tabIndex={selected ? 0 : -1}
              onKeyDown={onKeyDown}
              className={cn(
                'flex min-h-[64px] min-w-[68px] shrink-0 snap-center flex-col items-center justify-center gap-0.5 rounded-md border px-2 py-2 transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.98]',
                selected
                  ? 'border-primary bg-primary text-on-primary shadow-card'
                  : 'border-line bg-surface text-ink hover:border-muted hover:bg-paper',
                cellClassName?.(item, selected),
              )}
            >
              <span
                className={cn(
                  'text-[0.7rem] leading-none',
                  selected
                    ? 'text-on-primary/80'
                    : item.dot === 'today'
                      ? 'text-primary'
                      : 'text-muted',
                )}
              >
                {item.weekday}
              </span>
              <span className="tabular text-[0.95rem] leading-tight font-semibold whitespace-nowrap">
                {item.day}
              </span>
              {item.hint ? (
                <span
                  className={cn(
                    'text-[0.65rem] leading-none',
                    selected ? 'text-on-primary/80' : 'text-muted',
                  )}
                >
                  {item.hint}
                </span>
              ) : item.dot ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    'mt-0.5 h-1 w-1 rounded-full',
                    selected
                      ? 'bg-on-primary'
                      : item.dot === 'today'
                        ? 'bg-primary'
                        : 'bg-transparent',
                  )}
                />
              ) : null}
            </button>
          )
        })}
      </div>

      {showArrows ? (
        <button
          type="button"
          onClick={() => shift(240)}
          aria-label="Sljedeći datumi"
          className="hidden h-10 w-8 shrink-0 items-center justify-center rounded-sm text-muted transition-colors hover:bg-surface hover:text-ink sm:inline-flex"
        >
          <ChevronRight aria-hidden="true" className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  )
}

/** A small caption under the strip, e.g. "Povucite prstom za drugi dan". */
export function DateStripHint({ children }: { children: ReactNode }) {
  return <p className="mt-1.5 text-[0.7rem] text-muted">{children}</p>
}
