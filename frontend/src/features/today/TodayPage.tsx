import { CalendarDays, Plus, Sun } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Button, ButtonLink } from '@/components/ui/Button'
import { ErrorState, EmptyState, PageHeader, Panel, Skeleton } from '@/components/ui/Layout'
import { useAppointments, useWorkingHours } from '@/data/queries'
import type { AppointmentView } from '@/data/types'
import { formatTerminCount } from '@/lib/format'
import { useNow, usePageTitle } from '@/lib/hooks'
import {
  addDaysToDateKey,
  dayRange,
  formatDateCompact,
  formatDateKey,
  todayDateKey,
  weekdayIndexFromDateKey,
} from '@/lib/time'

import { AppointmentDialog } from '../appointments/AppointmentDialog'
import { AppointmentListItem } from '../appointments/AppointmentListItem'
interface DialogState {
  mode: 'create' | 'edit'
  appointment?: AppointmentView
  defaults?: { dateKey?: string; time?: string; hairdresserId?: string }
}

export function TodayPage() {
  usePageTitle('Danas')
  const now = useNow()
  const today = todayDateKey(now)
  const range = useMemo(() => dayRange(today), [today])
  const appointments = useAppointments(range)
  const workingHours = useWorkingHours()
  const [dialog, setDialog] = useState<DialogState | null>(null)

  // A day is closed only once the working hours are known: an interval-free day means the
  // owner does not work, while a pending read must never be reported as closed.
  const todayWeekday = weekdayIndexFromDateKey(today)
  const isClosed =
    workingHours.isSuccess &&
    !(workingHours.data ?? []).some((interval) => interval.weekday === todayWeekday)

  const nextOpenDateKey = useMemo(() => {
    const intervals = workingHours.data
    if (!intervals) return addDaysToDateKey(today, 1)
    for (let offset = 1; offset <= 7; offset += 1) {
      const dateKey = addDaysToDateKey(today, offset)
      if (intervals.some((interval) => interval.weekday === weekdayIndexFromDateKey(dateKey))) {
        return dateKey
      }
    }
    return addDaysToDateKey(today, 1)
  }, [today, workingHours.data])

  const active = (appointments.data ?? []).filter((item) => item.status !== 'cancelled')
  const nowMs = now.getTime()
  const inProgress = active.find(
    (item) =>
      item.status === 'confirmed' &&
      new Date(item.startsAt).getTime() <= nowMs &&
      new Date(item.endsAt).getTime() > nowMs,
  )
  const upcoming = active.filter(
    (item) => item.status === 'confirmed' && new Date(item.startsAt).getTime() > nowMs,
  )
  const finished = active.filter((item) => item.status === 'completed' || item.status === 'no_show')

  // The clock the page leads with: the chair that is occupied now, otherwise the next one.
  const focal = inProgress ?? upcoming[0]
  // Keep the focal appointment out of the list under it, so the day is not read twice.
  const later = (inProgress ? upcoming : upcoming.slice(1)).filter((item) => item.id !== focal?.id)
  const earlier = finished.filter((item) => item.id !== focal?.id)

  const openAppointment = (appointment: AppointmentView) => setDialog({ mode: 'edit', appointment })

  return (
    <div>
      <PageHeader
        title="Danas"
        align="start"
        // sm:pb-8 comes after the component's default pb-7/sm:pb-9, so it wins on wider screens;
        // there is no pb-6 on the phone, hence `sm:` rather than a plain override.
        className="sm:pb-8"
        actions={
          <>
            <ButtonLink
              to={`/kalendar?datum=${today}`}
              variant="secondary"
              size="md"
              aria-label="Otvori kalendar"
            >
              <CalendarDays aria-hidden="true" className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Kalendar</span>
            </ButtonLink>
            {isClosed ? null : (
              <Button
                size="md"
                aria-label="Novi termin"
                leftIcon={<Plus aria-hidden="true" className="h-4 w-4" />}
                onClick={() => setDialog({ mode: 'create', defaults: { dateKey: today } })}
              >
                Novi termin
              </Button>
            )}
          </>
        }
      />

      {appointments.isError ? (
        <ErrorState
          title="Raspored se nije učitao"
          message="Pokušajte ponovo. Demo podaci su i dalje u ovom pregledniku."
          onRetry={() => void appointments.refetch()}
        />
      ) : null}

      {appointments.isPending ? (
        <Panel className="mt-7">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center gap-4">
                <Skeleton className="h-9 w-12" />
                <Skeleton className="h-10 flex-1" />
              </div>
            ))}
          </div>
        </Panel>
      ) : appointments.isError ? null : active.length === 0 ? (
        <EmptyState
          className="mt-7"
          as="h2"
          icon={Sun}
          title={isClosed ? 'Salon je danas zatvoren' : 'Danas je mirno'}
          description={
            isClosed
              ? `Danas ne radite. Prvi sljedeći radni dan je ${formatDateKey(nextOpenDateKey)}.`
              : 'Nema termina za danas. Dodajte prvi termin ili provjerite kalendar.'
          }
          action={
            isClosed ? (
              <ButtonLink to={`/kalendar?datum=${nextOpenDateKey}`}>
                Pogledaj {formatDateCompact(nextOpenDateKey)}
              </ButtonLink>
            ) : undefined
          }
        />
      ) : (
        <div className="mt-8 space-y-8">
          {later.length > 0 ? (
            <section aria-labelledby="later-heading">
              <DaySectionHeading
                id="later-heading"
                title={inProgress ? 'Kasnije danas' : 'Predstojeći'}
                meta={formatTerminCount(later.length)}
              />
              <Panel className="mt-3 py-1">
                {later.map((appointment) => (
                  <AppointmentListItem
                    key={appointment.id}
                    appointment={appointment}
                    onOpen={openAppointment}
                    showPrice
                  />
                ))}
              </Panel>
            </section>
          ) : null}

          {earlier.length > 0 ? (
            <section aria-labelledby="finished-heading">
              <DaySectionHeading id="finished-heading" title="Današnji termini" />
              <Panel className="mt-3 py-1">
                {earlier.map((appointment) => (
                  <AppointmentListItem
                    key={appointment.id}
                    appointment={appointment}
                    onOpen={openAppointment}
                    showPrice
                  />
                ))}
              </Panel>
            </section>
          ) : null}
        </div>
      )}

      {dialog ? (
        <AppointmentDialog
          mode={dialog.mode}
          appointment={dialog.appointment}
          defaults={dialog.defaults}
          onClose={() => setDialog(null)}
        />
      ) : null}
    </div>
  )
}

/** A ledger section: the title over a hairline, the count at the right of the rule. */
function DaySectionHeading({ id, title, meta }: { id: string; title: string; meta?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-line pb-2">
      <h2 id={id} className="text-base font-semibold text-ink">
        {title}
      </h2>
      {meta ? <span className="text-xs text-muted">{meta}</span> : null}
    </div>
  )
}
