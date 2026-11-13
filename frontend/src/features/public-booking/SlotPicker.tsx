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
}: {
  availability: AvailabilityDay | undefined
  selected?: string
  onSelect: (startsAt: string) => void
  dateKey: string
  isPending: boolean
  error: unknown
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

  if (availability.isClosed) {
    return (
      <div className="rounded-md bg-paper px-4 py-8 text-center">
        <p className="text-sm font-semibold text-ink">Salon ne radi tog dana</p>
        <p className="mt-1 text-sm text-muted">Izaberite drugi datum iznad.</p>
      </div>
    )
  }

  if (availability.slots.length === 0) {
    return (
      <div className="rounded-md bg-paper px-4 py-8 text-center">
        <p className="text-sm font-semibold text-ink">Nema slobodnih termina</p>
        <p className="mt-1 text-sm text-muted">
          {formatDateLong(dateKey)} je popunjen ili je prošlo vrijeme za rezervaciju. Izaberite
          drugi datum.
        </p>
      </div>
    )
  }

  const groups = groupSlots(availability)
  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="mb-2 text-sm text-muted">{group.label}</p>
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
                    'tabular inline-flex min-h-10 items-center justify-center rounded-sm text-sm font-medium transition-colors',
                    active ? 'bg-pine text-white' : 'bg-paper text-ink hover:bg-pine-soft',
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
