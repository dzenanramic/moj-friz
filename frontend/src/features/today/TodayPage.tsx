import { CalendarDays, Clock3, Plus, Sun } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router'

import { Button, ButtonLink } from '@/components/ui/Button'
import { ErrorState, EmptyState, PageHeader, Panel, Skeleton } from '@/components/ui/Layout'
import { useAppointments } from '@/data/queries'
import type { AppointmentView } from '@/data/types'
import { formatHairdresserCount, formatKM, formatTerminCount } from '@/lib/format'
import { useNow, usePageTitle } from '@/lib/hooks'
import {
  capitalizeFirst,
  dayRange,
  formatDateLong,
  formatDateKey,
  formatTime,
  todayDateKey,
} from '@/lib/time'
import { cn } from '@/lib/cn'

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

  const openAppointment = (appointment: AppointmentView) => setDialog({ mode: 'edit', appointment })

  return (
    <div>
      <PageHeader
        title="Danas"
        description={
          <>
            <span className="font-medium text-ink">{capitalizeFirst(formatDateLong(today))}</span>
            <span className="mx-2 text-line-strong" aria-hidden="true">
              /
            </span>
            {appointments.isPending
              ? 'Učitavanje rasporeda…'
              : `${formatTerminCount(active.length)} · ${formatHairdresserCount(staffCount)}`}
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
          title="Raspored se nije učitao."
          message="Pokušajte ponovo. Demo podaci su i dalje u ovom pregledniku."
          onRetry={() => void appointments.refetch()}
        />
      ) : null}

      {next ? (
        <Panel className="mb-6 overflow-hidden">
          <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
            <div className="flex min-w-0 items-center gap-4">
              <div className="w-14 shrink-0 text-center sm:w-16">
                <p className="time-gutter-label font-display text-2xl font-semibold tracking-tight text-pine">
                  {formatTime(next.startsAt)}
                </p>
                <p className="mt-0.5 text-[0.65rem] font-medium text-muted">Sljedeće</p>
              </div>
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-ink">{next.clientName}</p>
                <p className="mt-0.5 truncate text-sm text-muted">
                  {next.serviceName} · {next.hairdresserName}
                </p>
              </div>
            </div>
            <div className="ml-auto flex shrink-0 flex-wrap items-center gap-2">
              <span className="text-sm text-muted">
                {formatTime(next.startsAt)}–{formatTime(next.endsAt)}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => openAppointment(next)}
                className="sm:ml-2"
              >
                Detalji
              </Button>
            </div>
          </div>
          <div className="h-1 bg-pine/80" aria-hidden="true" />
        </Panel>
      ) : null}

      {appointments.isPending ? (
        <Panel className="p-4">
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
          icon={Sun}
          title="Danas je mirno."
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
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
          <div className="space-y-8">
            <section aria-labelledby="upcoming-heading">
              <div className="mb-2 flex items-baseline justify-between gap-3">
                <h2 id="upcoming-heading" className="text-sm font-semibold text-ink">
                  Predstojeći
                </h2>
                <span className="text-xs text-muted">
                  {upcoming.length > 0 ? formatTerminCount(upcoming.length) : 'Nema preostalih'}
                </span>
              </div>
              <Panel className="px-1 sm:px-2">
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
                <div className="mb-2 flex items-baseline justify-between gap-3">
                  <h2 id="finished-heading" className="text-sm font-semibold text-ink">
                    Završeno danas
                  </h2>
                  <span className="text-xs text-muted">{formatTerminCount(finished.length)}</span>
                </div>
                <Panel className="px-1 sm:px-2">
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

          <aside className="space-y-5 lg:sticky lg:top-6">
            <Panel className="p-4">
              <h2 className="text-sm font-semibold text-ink">Smjena danas</h2>
              <dl className="mt-3 space-y-2.5">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <dt className="text-muted">Termini</dt>
                  <dd className="font-medium text-ink">{formatTerminCount(active.length)}</dd>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <dt className="text-muted">Frizeri sa terminima</dt>
                  <dd className="font-medium text-ink">{staffCount}</dd>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <dt className="text-muted">Online rezervacije</dt>
                  <dd className="font-medium text-ink">
                    {active.filter((item) => item.source === 'online').length}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-line pt-2.5 text-sm">
                  <dt className="text-muted">Vrijednost termina</dt>
                  <dd className="font-medium text-ink">
                    {formatKM(
                      active.reduce((sum, item) => sum + (item.priceMinorSnapshot ?? 0), 0),
                    )}
                  </dd>
                </div>
              </dl>
              <p className="mt-3 text-[0.7rem] leading-relaxed text-muted">
                Računa se iz prikazanih termina. Demo podaci, bez naplate.
              </p>
            </Panel>

            <Panel className="p-4">
              <h2 className="text-sm font-semibold text-ink">Prečice</h2>
              <div className="mt-3 space-y-1.5">
                <Link
                  to={`/kalendar?datum=${today}`}
                  className="flex min-h-10 items-center gap-2 rounded-sm px-2 text-sm text-muted transition-colors hover:bg-paper hover:text-ink"
                >
                  <CalendarDays aria-hidden="true" className="h-4 w-4" />
                  Cijeli raspored dana
                </Link>
                <Link
                  to="/klijenti"
                  className="flex min-h-10 items-center gap-2 rounded-sm px-2 text-sm text-muted transition-colors hover:bg-paper hover:text-ink"
                >
                  <Clock3 aria-hidden="true" className="h-4 w-4" />
                  Pretraži klijente
                </Link>
              </div>
            </Panel>
          </aside>
        </div>
      )}

      <div className="mt-8 flex items-center justify-between border-t border-line pt-4 text-xs text-muted lg:hidden">
        <span>{formatDateKey(today)}</span>
        <span className={cn('inline-flex items-center gap-1.5')}>
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
