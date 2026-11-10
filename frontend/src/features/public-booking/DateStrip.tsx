import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useRef } from 'react'

import { cn } from '@/lib/cn'

import { formatDateCompact, formatDateLong, formatWeekday, todayDateKey } from '@/lib/time'

export function DateStrip({
  dates,
  selected,
  onSelect,
  label = 'Izaberite datum',
}: {
  dates: string[]
  selected: string
  onSelect: (dateKey: string) => void
  label?: string
}) {
  const today = todayDateKey()
  const scrollerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller) return
    const selectedButton = scroller.querySelector<HTMLElement>(`[data-date-key="${selected}"]`)
    if (!selectedButton || typeof scroller.scrollTo !== 'function') return
    const target = Math.max(
      0,
      selectedButton.offsetLeft - scroller.clientWidth / 2 + selectedButton.clientWidth / 2,
    )
    scroller.scrollTo({ left: target, behavior: 'smooth' })
  }, [selected])

  const shift = (amount: number) => {
    const scroller = scrollerRef.current
    if (!scroller || typeof scroller.scrollBy !== 'function') return
    scroller.scrollBy({ left: amount, behavior: 'smooth' })
  }

  return (
    <div className="flex min-w-0 items-center gap-1">
      <button
        type="button"
        onClick={() => shift(-240)}
        aria-label="Prethodni datumi"
        className="hidden h-10 w-9 shrink-0 items-center justify-center rounded-sm border border-line bg-surface text-muted transition-colors hover:text-ink sm:flex"
      >
        <ChevronLeft aria-hidden="true" className="h-4 w-4" />
      </button>
      <div
        ref={scrollerRef}
        role="group"
        aria-label={label}
        className="hide-scrollbar flex w-full min-w-0 max-w-full gap-1.5 overflow-x-auto pb-1"
      >
        {dates.map((dateKey) => {
          const active = dateKey === selected
          return (
            <button
              key={dateKey}
              type="button"
              aria-pressed={active}
              aria-label={formatDateLong(dateKey)}
              data-date-key={dateKey}
              onClick={() => onSelect(dateKey)}
              className={cn(
                'flex min-h-[64px] min-w-[62px] shrink-0 flex-col items-center justify-center rounded-md border px-1.5 py-2 transition-colors',
                active
                  ? 'border-pine bg-pine text-white'
                  : 'border-line bg-surface text-ink hover:border-line-strong hover:bg-paper',
              )}
            >
              <span
                className={cn(
                  'text-[0.65rem] font-medium',
                  active ? 'text-white/70' : 'text-muted',
                )}
              >
                {formatWeekday(dateKey, true)}
              </span>
              <span className="time-gutter-label mt-0.5 text-sm font-semibold">
                {formatDateCompact(dateKey)}
              </span>
              <span
                className={cn(
                  'mt-1 text-[0.6rem] leading-none',
                  active ? 'text-amber' : 'text-muted',
                )}
              >
                {dateKey === today ? 'Danas' : '\u00A0'}
              </span>
            </button>
          )
        })}
      </div>
      <button
        type="button"
        onClick={() => shift(240)}
        aria-label="Sljedeći datumi"
        className="hidden h-10 w-9 shrink-0 items-center justify-center rounded-sm border border-line bg-surface text-muted transition-colors hover:text-ink sm:flex"
      >
        <ChevronRight aria-hidden="true" className="h-4 w-4" />
      </button>
    </div>
  )
}
