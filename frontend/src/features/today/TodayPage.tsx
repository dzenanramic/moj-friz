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
  formatTime,
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
  const upcoming = active.filter(
    (item) => item.status === 'confirmed' && new Date(item.endsAt).getTime() > now.getTime(),
  )
  const finished = active.filter((item) => item.status === 'completed' || item.status === 'no_show')
  const next = upcoming[0]

  const openAppointment = (appointment: AppointmentView) => setDialog({ mode: 'edit', appointment })

  return (
    <div>
      <PageHeader
        title="Danas"
        align="start"
        className="pb-6 sm:pb-8"
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

      {next ? (
        <section
          aria-label="Sljedeći termin"
          className="relative overflow-hidden rounded-lg bg-primary-tint"
        >
          <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-primary" />
          <div className="flex flex-col gap-5 px-5 py-5 sm:flex-row sm:items-center sm:px-7 sm:py-6">
            <div className="flex min-w-0 flex-1 items-center gap-5">
              <p className="tabular text-3xl leading-none font-semibold text-primary sm:text-4xl">
                {formatTime(next.startsAt)}
              </p>
              <div className="min-w-0">
                <p className="text-xs font-medium text-primary">Sljedeći termin</p>
                <p className="mt-1 truncate text-lg font-semibold text-ink">{next.clientName}</p>
                <p className="mt-0.5 truncate text-sm text-muted">
                  {next.serviceName} · {next.hairdresserName} · do {formatTime(next.endsAt)}
                </p>
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={() => openAppointment(next)}>
              Detalji
            </Button>
          </div>
        </section>
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
        <div className="mt-8 grid gap-8">
          <div className="space-y-8">
            <section aria-labelledby="upcoming-heading">
              <div className="mb-3 flex items-baseline justify-between gap-3">
                <h2 id="upcoming-heading" className="text-base font-semibold text-ink">
                  Predstojeći
                </h2>
                <span className="text-xs text-muted">
                  {upcoming.length > 0 ? formatTerminCount(upcoming.length) : 'Nema preostalih'}
                </span>
              </div>
              <Panel className="py-1">
                {upcoming.length > 0 ? (
                  upcoming.map((appointment) => (
                    <AppointmentListItem
                      key={appointment.id}
                      appointment={appointment}
                      onOpen={openAppointment}
                      showPrice
                    />
                  ))
                ) : (
                  <div className="flex items-center gap-3 px-3 py-5 sm:px-4">
                    <Sun aria-hidden="true" className="h-4 w-4 shrink-0 text-muted" />
                    <p className="text-sm text-muted">Današnji termini su završeni.</p>
                  </div>
                )}
              </Panel>
            </section>

            {finished.length > 0 ? (
              <section aria-labelledby="finished-heading">
                <div className="mb-3 flex items-baseline justify-between gap-3">
                  <h2 id="finished-heading" className="text-base font-semibold text-ink">
                    Završeno danas
                  </h2>
                  <span className="text-xs text-muted">{formatTerminCount(finished.length)}</span>
                </div>
                <Panel className="py-1">
                  {finished.map((appointment) => (
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
