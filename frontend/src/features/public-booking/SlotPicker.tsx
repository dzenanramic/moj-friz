import { ChevronRight } from 'lucide-react'

import { Skeleton } from '@/components/ui/Layout'
import { gatewayErrorMessage } from '@/data/gateway'
import type { AvailabilityDay } from '@/data/types'
import { cn } from '@/lib/cn'
import { formatDateLong, formatTime, minutesOfDayFromInstant } from '@/lib/time'

export function SlotPicker({
  availability,
  selected,
  onSelect,
  dateKey,
  isPending,
  error,
  nextOpenDate,
  onPickNextOpen,
}: {
  availability: AvailabilityDay | undefined
  selected?: string
  onSelect: (startsAt: string) => void
  dateKey: string
  isPending: boolean
  error: unknown
  /** The next day in the strip that still has openings, so an empty day is never a dead end. */
  nextOpenDate?: string
  onPickNextOpen?: (dateKey: string) => void
}) {
  if (isPending) {
    return (
      <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
        {Array.from({ length: 10 }).map((_, index) => (
          <Skeleton key={index} className="h-10 w-full" />
        ))}
      </div>
    )
  }

  if (error) {
    return <p className="text-sm text-danger">{gatewayErrorMessage(error)}</p>
  }

  if (!availability) {
    return <p className="text-sm text-muted">Izaberite datum da vidite slobodne termine.</p>
  }

  if (availability.isClosed || availability.slots.length === 0) {
    const closed = availability.isClosed
    return (
      <div className="rounded-md bg-paper px-4 py-8 text-center">
        <p className="text-sm font-semibold text-ink">
          {closed ? 'Salon ne radi tog dana' : 'Nema slobodnih termina'}
        </p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
          {closed
            ? 'Izaberite drugi datum iznad.'
            : `${formatDateLong(dateKey)} je popunjen ili je prošlo vrijeme za rezervaciju. Izaberite drugi datum.`}
        </p>
        {nextOpenDate && onPickNextOpen ? (
          <button
            type="button"
            onClick={() => onPickNextOpen(nextOpenDate)}
            className="mt-4 inline-flex min-h-10 items-center gap-1.5 rounded-sm px-3 text-sm font-medium text-primary transition-colors hover:bg-primary-tint"
          >
            Prvi slobodan dan: {formatDateLong(nextOpenDate)}
            <ChevronRight aria-hidden="true" className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    )
  }

  const groups = groupSlots(availability)
  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="mb-2 flex items-center gap-2 text-sm text-muted">
            {group.label}
            <span aria-hidden="true" className="h-px flex-1 bg-line" />
          </p>
          <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
            {group.slots.map((slot) => {
              const active = slot.startsAt === selected
              return (
                <button
                  key={slot.startsAt}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onSelect(slot.startsAt)}
                  className={cn(
                    'tabular inline-flex min-h-11 items-center justify-center rounded-sm text-sm font-medium transition-[background-color,color,box-shadow,transform] duration-150 active:scale-[0.97]',
                    active
                      ? 'bg-primary text-on-primary'
                      : 'bg-paper text-ink ring-1 ring-inset ring-line hover:bg-primary-tint hover:ring-primary/30',
                  )}
                >
                  {formatTime(slot.startsAt)}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function groupSlots(availability: AvailabilityDay) {
  const morning = availability.slots.filter(
    (slot) => minutesOfDayFromInstant(slot.startsAt) < 12 * 60,
  )
  const afternoon = availability.slots.filter((slot) => {
    const minutes = minutesOfDayFromInstant(slot.startsAt)
    return minutes >= 12 * 60 && minutes < 17 * 60
  })
  const evening = availability.slots.filter(
    (slot) => minutesOfDayFromInstant(slot.startsAt) >= 17 * 60,
  )
  return [
    { label: 'Prijepodne', slots: morning },
    { label: 'Poslijepodne', slots: afternoon },
    { label: 'Veče', slots: evening },
  ].filter((group) => group.slots.length > 0)
}
