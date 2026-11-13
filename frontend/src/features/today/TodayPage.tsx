import { CalendarDays, Clock3, Plus, Sun } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router'

import { Button, ButtonLink } from '@/components/ui/Button'
import { ErrorState, EmptyState, PageHeader, Panel, Skeleton } from '@/components/ui/Layout'
import { useAppointments } from '@/data/queries'
import type { AppointmentView } from '@/data/types'
import { cn } from '@/lib/cn'
import { formatHairdresserCount, formatKM, formatTerminCount } from '@/lib/format'
import { useNow, usePageTitle } from '@/lib/hooks'
import {
  capitalizeFirst,
  dayRange,
  formatDateKey,
  formatDateLong,
  formatTime,
  todayDateKey,
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
  const [dialog, setDialog] = useState<DialogState | null>(null)

  const active = (appointments.data ?? []).filter((item) => item.status !== 'cancelled')
  const upcoming = active.filter(
    (item) => item.status === 'confirmed' && new Date(item.endsAt).getTime() > now.getTime(),
  )
  const finished = active.filter((item) => item.status === 'completed' || item.status === 'no_show')
  const next = upcoming[0]
  const staffCount = new Set(active.map((item) => item.hairdresserId)).size
  const valueMinor = active.reduce((sum, item) => sum + (item.priceMinorSnapshot ?? 0), 0)

  const openAppointment = (appointment: AppointmentView) => setDialog({ mode: 'edit', appointment })

  return (
    <div>
      <PageHeader
        title="Danas"
        description={
          <>
            {capitalizeFirst(formatDateLong(today))}
            <span className="text-line-strong" aria-hidden="true">
              {' · '}
            </span>
            {appointments.isPending
              ? 'Učitavanje rasporeda…'
              : `${formatTerminCount(active.length)}, ${formatHairdresserCount(staffCount)}`}
          </>
        }
        actions={
          <>
            <ButtonLink
              to={`/kalendar?datum=${today}`}
              variant="secondary"
              leftIcon={<CalendarDays className="h-4 w-4" />}
            >
              Kalendar
            </ButtonLink>
            <Button
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setDialog({ mode: 'create', defaults: { dateKey: today } })}
            >
              Novi termin
            </Button>
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
          className="relative overflow-hidden rounded-lg bg-pine-soft"
        >
          <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-pine" />
          <div className="flex flex-col gap-5 px-5 py-5 sm:flex-row sm:items-center sm:px-7 sm:py-6">
            <div className="flex min-w-0 flex-1 items-center gap-5">
              <p className="tabular text-3xl leading-none font-semibold text-pine-strong sm:text-4xl">
                {formatTime(next.startsAt)}
              </p>
              <div className="min-w-0">
                <p className="text-xs font-medium text-pine-strong">Sljedeći termin</p>
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
          icon={Sun}
          title="Danas je mirno"
          description={
            isSunday(today)
              ? 'Salon je nedjeljom zatvoren. Otvorite kalendar za naredne dane.'
              : 'Nema termina za danas. Dodajte prvi termin ili provjerite kalendar.'
          }
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => setDialog({ mode: 'create', defaults: { dateKey: today } })}
              >
                Novi termin
              </Button>
              <ButtonLink to={`/kalendar?datum=${today}`} variant="secondary">
                Otvori kalendar
              </ButtonLink>
            </div>
          }
        />
      ) : (
        <div className="mt-9 grid gap-10 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-start">
          <div className="space-y-10">
            <section aria-labelledby="upcoming-heading">
              <div className="mb-1 flex items-baseline justify-between gap-3">
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
                  <p className="px-3 py-5 text-sm text-muted">
                    Današnji termini su završeni. Sljedeće obaveze su u kalendaru.
                  </p>
                )}
              </Panel>
            </section>

            {finished.length > 0 ? (
              <section aria-labelledby="finished-heading">
                <div className="mb-1 flex items-baseline justify-between gap-3">
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

          <aside className="space-y-8 lg:sticky lg:top-6">
            <section>
              <h2 className="text-base font-semibold text-ink">Smjena danas</h2>
              <dl className="mt-3 space-y-2.5 text-sm">
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-muted">Termini</dt>
                  <dd className="tabular font-medium text-ink">{active.length}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-muted">Frizeri sa terminima</dt>
                  <dd className="tabular font-medium text-ink">{staffCount}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-muted">Online rezervacije</dt>
                  <dd className="tabular font-medium text-ink">
                    {active.filter((item) => item.source === 'online').length}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-muted">Vrijednost termina</dt>
                  <dd className="tabular font-medium text-ink">{formatKM(valueMinor)}</dd>
                </div>
              </dl>
              <p className="mt-3 text-xs leading-relaxed text-muted">
                Računa se iz prikazanih termina. Demo podaci, bez naplate.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-ink">Prečice</h2>
              <div className="mt-2">
                <Link
                  to={`/kalendar?datum=${today}`}
                  className="flex min-h-10 items-center gap-2 rounded-sm px-2 -mx-2 text-sm text-muted transition-colors hover:bg-surface hover:text-ink"
                >
                  <CalendarDays aria-hidden="true" className="h-4 w-4" />
                  Cijeli raspored dana
                </Link>
                <Link
                  to="/klijenti"
                  className="flex min-h-10 items-center gap-2 rounded-sm px-2 -mx-2 text-sm text-muted transition-colors hover:bg-surface hover:text-ink"
                >
                  <Clock3 aria-hidden="true" className="h-4 w-4" />
                  Pretraži klijente
                </Link>
              </div>
            </section>
          </aside>
        </div>
      )}

      <div
        className={cn('mt-10 flex items-center justify-between pb-2 text-xs text-muted lg:hidden')}
      >
        <span>{formatDateKey(today)}</span>
        <span className="inline-flex items-center gap-1.5">
          <Clock3 aria-hidden="true" className="h-3.5 w-3.5" />
          {formatTime(now.toISOString())}
        </span>
      </div>

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

function isSunday(dateKey: string): boolean {
  const date = new Date(`${dateKey}T12:00:00Z`)
  return date.getUTCDay() === 0
}
