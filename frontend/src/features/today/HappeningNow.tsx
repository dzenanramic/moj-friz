import { Check, Clock3 } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import type { AppointmentView } from '@/data/types'
import { formatTime } from '@/lib/time'

/**
 * The day's focal moment: what is happening in the chair right now, or what is next.
 *
 * A book owner opens this screen mid-day, so the clock the app leads with should be the one
 * that matters, not the top of the list. The time stays in the sans with tabular figures: a
 * serif's figures do not line up as a clock, and a time here is read, not admired.
 */
export function HappeningNow({
  appointment,
  state,
  now,
  onOpen,
}: {
  appointment: AppointmentView
  /** `now` while it is in the chair; `next` when the day has not reached it yet. */
  state: 'now' | 'next'
  now: Date
  onOpen: (appointment: AppointmentView) => void
}) {
  const happening = state === 'now'
  const started = new Date(appointment.startsAt).getTime() <= now.getTime()

  return (
    <section
      aria-label={happening ? 'Termin u toku' : 'Sljedeći termin'}
      className="relative overflow-hidden rounded-md border border-line bg-surface"
    >
      {/* The copper margin rule: the same mark as the sidebar's active screen, on the card. */}
      <span aria-hidden="true" className="absolute inset-y-0 left-0 w-[3px] bg-accent-ui" />
      <div className="flex flex-col gap-5 px-5 py-5 sm:flex-row sm:items-center sm:gap-7 sm:px-7 sm:py-6">
        <div className="flex min-w-0 flex-1 items-center gap-5">
          {/* The clock is the one number on this screen; the range under it adds the end. */}
          <p className="tabular shrink-0 text-[2.6rem] leading-none font-semibold tracking-tight text-ink sm:text-[3rem]">
            {formatTime(appointment.startsAt)}
          </p>
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-xs font-medium text-accent-ui">
              {started ? (
                <Clock3 aria-hidden="true" className="h-3.5 w-3.5" />
              ) : (
                <Check aria-hidden="true" className="h-3.5 w-3.5" />
              )}
              {happening ? 'Sada u stolici' : 'Sljedeći termin danas'}
            </p>
            <p className="mt-1 truncate text-lg font-semibold text-ink">{appointment.clientName}</p>
            <p className="mt-0.5 truncate text-sm text-muted">
              {appointment.serviceName} · {appointment.hairdresserName} · do{' '}
              {formatTime(appointment.endsAt)}
            </p>
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={() => onOpen(appointment)}>
          Detalji
        </Button>
      </div>
    </section>
  )
}
