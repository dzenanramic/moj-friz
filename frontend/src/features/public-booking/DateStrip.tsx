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
        className="hidden h-10 w-9 shrink-0 items-center justify-center rounded-sm text-muted transition-colors hover:bg-paper hover:text-ink sm:flex"
      >
        <ChevronLeft aria-hidden="true" className="h-4 w-4" />
      </button>
      <div
        ref={scrollerRef}
        role="group"
        aria-label={label}
        className="hide-scrollbar flex w-full min-w-0 max-w-full gap-1 overflow-x-auto px-1 pb-1"
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
                'flex min-h-[62px] min-w-[68px] shrink-0 flex-col items-center justify-center rounded-md px-2 py-2 transition-colors',
                active ? 'bg-pine text-white' : 'bg-paper text-ink hover:bg-pine-soft',
              )}
            >
              <span className={cn('text-xs', active ? 'text-white' : 'text-muted')}>
                {formatWeekday(dateKey, true)}
              </span>
              <span className="tabular mt-0.5 text-sm font-semibold whitespace-nowrap">
                {formatDateCompact(dateKey)}
              </span>
              <span className="mt-1 text-[0.65rem] leading-none">
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
        className="hidden h-10 w-9 shrink-0 items-center justify-center rounded-sm text-muted transition-colors hover:bg-paper hover:text-ink sm:flex"
      >
        <ChevronRight aria-hidden="true" className="h-4 w-4" />
      </button>
    </div>
  )
}
