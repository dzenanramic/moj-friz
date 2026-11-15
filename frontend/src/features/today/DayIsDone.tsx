import { Check, Moon, X } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import type { AppointmentView } from '@/data/types'
import { formatTerminCount } from '@/lib/format'
import { formatTime } from '@/lib/time'

/**
 * The day is over. What the owner opens this screen for at that point is how it went, so the
 * tally is the display moment — not an apology and not another list. With nothing booked at
 * all, the card is not rendered and the ordinary empty state speaks instead.
 */
export function DayIsDone({
  now,
  completedCount,
  total,
  served,
  missed,
  onOpen,
}: {
  now: Date
  completedCount: number
  total: number
  served: AppointmentView[]
  missed: AppointmentView[]
  onOpen: (appointment: AppointmentView) => void
}) {
  const last = served[served.length - 1]
  const lastMissing = !last && missed.length > 0

  return (
    <section
      aria-labelledby="day-done-heading"
      className="relative overflow-hidden rounded-md border border-line bg-surface"
    >
      <span aria-hidden="true" className="absolute inset-y-0 left-0 w-[3px] bg-accent-ui" />
      <div className="flex flex-col gap-6 px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <div className="flex min-w-0 items-center gap-5">
          <div className="shrink-0">
            <p className="tabular text-[2.6rem] leading-none font-semibold tracking-tight text-ink">
              {completedCount}
              <span className="font-normal text-muted"> / {total}</span>
            </p>
            <p className="mt-1.5 text-xs text-muted">
              {formatTerminCount(completedCount)} završeno
            </p>
          </div>
          <div className="min-w-0">
            <h2 id="day-done-heading" className="text-lg font-semibold text-ink">
              Današnji raspored je završen
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              {last
                ? `Posljednji termin je završio u ${formatTime(last.endsAt)}.`
                : 'Završen je posljednji termin za danas.'}
              {lastMissing ? ' Jedan termin je ostao bez dolaska.' : null}
            </p>
            <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
              <span className="inline-flex items-center gap-1.5">
                <Check aria-hidden="true" className="h-3.5 w-3.5 text-primary" />
                {formatTerminCount(completedCount)}
              </span>
              {missed.length > 0 ? (
                <span className="inline-flex items-center gap-1.5 text-accent-ui">
                  <X aria-hidden="true" className="h-3.5 w-3.5" />
                  {formatTerminCount(missed.length)} bez dolaska
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1.5">
                <Moon aria-hidden="true" className="h-3.5 w-3.5" />
                Sada je {formatTime(now.toISOString())}
              </span>
            </p>
          </div>
        </div>
        {last ? (
          <Button variant="secondary" size="sm" onClick={() => onOpen(last)}>
            Zadnji termin
          </Button>
        ) : null}
      </div>
    </section>
  )
}
