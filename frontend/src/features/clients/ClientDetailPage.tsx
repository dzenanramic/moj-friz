import { ArrowLeft, MessageSquare, Phone, Plus } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router'

import { StatusIndicator } from '@/components/ui/Badges'
import { Button, buttonClassName } from '@/components/ui/Button'
import { ErrorState, Panel, Skeleton } from '@/components/ui/Layout'
import { useClient } from '@/data/queries'
import type { AppointmentView } from '@/data/types'
import { cn } from '@/lib/cn'
import { formatKM } from '@/lib/format'
import { usePageTitle } from '@/lib/hooks'
import {
  capitalizeFirst,
  dateKeyFromInstant,
  formatDateKey,
  formatTime,
  formatWeekday,
  todayDateKey,
} from '@/lib/time'

import { AppointmentDialog } from '../appointments/AppointmentDialog'

export function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const client = useClient(id)
  const [createOpen, setCreateOpen] = useState(false)
  usePageTitle(client.data?.client.name ?? 'Klijent')

  if (client.isPending) {
    return (
      <div className="space-y-5">
        <ClientHeaderRow title="Učitavanje…" />
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    )
  }

  if (client.isError || !client.data) {
    return (
      <div>
        <ClientHeaderRow title="Klijent" />
        <div className="mt-5">
          <ErrorState
            title="Klijent nije pronađen"
            message="Link je možda pogrešan ili je demo resetovan."
            onRetry={() => void client.refetch()}
          />
        </div>
      </div>
    )
  }

  const { client: person, appointments } = client.data
  const completed = appointments
    .filter((appointment) => appointment.status === 'completed')
    .sort((a, b) => Date.parse(b.startsAt) - Date.parse(a.startsAt))
  const lastVisit = completed[0]
  const totalValue = appointments
    .filter((appointment) => appointment.status !== 'cancelled')
    .reduce((sum, appointment) => sum + (appointment.priceMinorSnapshot ?? 0), 0)
  const callHref = `tel:${person.phoneOriginal.replace(/\s+/g, '')}`
  const messageHref = `sms:${person.phoneOriginal.replace(/\s+/g, '')}`
  const today = todayDateKey()
  /** Last visit talks in days a person recognises: "danas", "juče", then the date. */
  const lastVisitDate = lastVisit ? dateKeyFromInstant(lastVisit.startsAt) : null

  const byYear = new Map<string, AppointmentView[]>()
  for (const appointment of [...appointments].sort(
    (a, b) => Date.parse(b.startsAt) - Date.parse(a.startsAt),
  )) {
    const year = dateKeyFromInstant(appointment.startsAt).slice(0, 4)
    const group = byYear.get(year) ?? []
    group.push(appointment)
    byYear.set(year, group)
  }
  const years = [...byYear.keys()].sort().reverse()
  const showYearHeadings = years.length > 1

  return (
    <div>
      {/* Back arrow on the left, the name and its actions on the right. */}
      <div className="flex items-start gap-3 pb-5">
        <Link
          to="/klijenti"
          aria-label="Nazad na listu klijenata"
          className="-ml-2.5 -mt-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface hover:text-ink"
        >
          <ArrowLeft aria-hidden="true" className="h-[1.15rem] w-[1.15rem]" />
        </Link>
        <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div className="min-w-0">
            <h1 className="truncate text-ink">{person.name}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-muted">
              <a
                href={callHref}
                className="tabular inline-flex items-center gap-1.5 font-medium text-ink underline decoration-line underline-offset-4 transition-colors hover:text-primary"
              >
                <Phone aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-muted" />
                {person.phoneOriginal}
              </a>
              <span aria-hidden="true" className="text-muted">
                ·
              </span>
              <span>
                {appointments.length === 0
                  ? 'Bez termina'
                  : lastVisitDate === today
                    ? 'Bila danas'
                    : lastVisitDate
                      ? `Zadnji dolazak ${formatDateKey(lastVisitDate)}`
                      : 'Bez završenih termina'}
              </span>
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:shrink-0">
            <Button
              size="md"
              className="col-span-2 sm:col-auto"
              leftIcon={<Plus aria-hidden="true" className="h-4 w-4" />}
              onClick={() => setCreateOpen(true)}
            >
              Novi termin
            </Button>
            <a href={callHref} className={buttonClassName('secondary', 'md')}>
              <Phone aria-hidden="true" className="h-4 w-4 shrink-0" />
              Pozovi
            </a>
            <a href={messageHref} className={buttonClassName('secondary', 'md')}>
              <MessageSquare aria-hidden="true" className="h-4 w-4 shrink-0" />
              Poruka
            </a>
          </div>
        </div>
      </div>

      <div
        className={cn(
          'grid gap-8 lg:items-start',
          person.notes ? 'lg:grid-cols-[minmax(0,1fr)_272px]' : 'lg:grid-cols-1',
        )}
      >
        <div className="min-w-0 space-y-8">
          {/* Three figures, each centred in its own column, on one shared baseline. */}
          <dl className="grid grid-cols-3 divide-x divide-line rounded-lg bg-surface text-center">
            <Stat label="Termini" value={String(appointments.length)} />
            <Stat
              label="Zadnji dolazak"
              value={lastVisitDate ? formatDateKey(lastVisitDate) : '—'}
            />
            <Stat label="Vrijednost" value={formatKM(totalValue)} />
          </dl>

          <section aria-labelledby="client-history">
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h2 id="client-history" className="text-base font-semibold text-ink">
                Historija termina
              </h2>
              {appointments.length > 0 ? (
                <span className="text-xs text-muted">{appointments.length}</span>
              ) : null}
            </div>
            {appointments.length === 0 ? (
              <Panel>
                <p className="text-sm text-muted">Ovaj klijent još nema termina.</p>
                <Button
                  variant="secondary"
                  size="md"
                  className="mt-4"
                  leftIcon={<Plus aria-hidden="true" className="h-4 w-4" />}
                  onClick={() => setCreateOpen(true)}
                >
                  Novi termin
                </Button>
              </Panel>
            ) : (
              <Panel className="py-1">
                <ol>
                  {years.map((year) => (
                    <li key={year}>
                      {showYearHeadings ? (
                        <p className="px-3 pt-3 pb-1 text-xs font-medium text-muted sm:px-4">
                          {year}
                        </p>
                      ) : null}
                      <ol>
                        {byYear.get(year)?.map((appointment) => (
                          <HistoryRow
                            key={appointment.id}
                            appointment={appointment}
                            today={today}
                          />
                        ))}
                      </ol>
                    </li>
                  ))}
                </ol>
              </Panel>
            )}
          </section>
        </div>

        {person.notes ? (
          <aside className="lg:sticky lg:top-6">
            <h2 className="text-xs font-medium text-muted">Napomena</h2>
            <p className="mt-2 rounded-lg bg-surface px-4 py-3 text-sm leading-relaxed text-ink">
              {person.notes}
            </p>
          </aside>
        ) : null}
      </div>

      {createOpen ? (
        <AppointmentDialog
          mode="create"
          defaults={{
            clientId: person.id,
            clientName: person.name,
            clientPhone: person.phoneOriginal,
          }}
          onClose={() => setCreateOpen(false)}
        />
      ) : null}
    </div>
  )
}

function ClientHeaderRow({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 pb-5">
      <Link
        to="/klijenti"
        aria-label="Nazad na listu klijenata"
        className="-ml-2.5 -mt-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface hover:text-ink"
      >
        <ArrowLeft aria-hidden="true" className="h-[1.15rem] w-[1.15rem]" />
      </Link>
      <h1 className="truncate text-ink">{title}</h1>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-2 py-4 sm:px-4">
      <dt className="text-[0.7rem] leading-tight text-muted sm:text-xs">{label}</dt>
      <dd className="tabular mt-1.5 text-[0.95rem] font-semibold text-ink sm:text-lg">{value}</dd>
    </div>
  )
}

/**
 * One visit, read at a glance: when, what, how it ended. The client's own name is left
 * out (every row on this page is the same client), and the price leads the second line
 * because it is what the owner scans for.
 */
function HistoryRow({ appointment, today }: { appointment: AppointmentView; today: string }) {
  const cancelled = appointment.status === 'cancelled'
  const dateKey = dateKeyFromInstant(appointment.startsAt)

  return (
    <div className="flex items-center gap-3 border-b border-line px-3 py-2.5 last:border-b-0 sm:px-4">
      <span className="w-[74px] shrink-0 sm:w-[86px]">
        <span className="tabular block text-sm font-semibold text-ink">
          {formatTime(appointment.startsAt)}
        </span>
        <span className="mt-0.5 block text-[0.7rem] whitespace-nowrap text-muted">
          {dateKey === today
            ? 'danas'
            : `${capitalizeFirst(formatWeekday(dateKey, true))} ${formatDateKey(dateKey)}`}
        </span>
      </span>

      <span className="min-w-0 flex-1">
        <span
          className={cn(
            'block truncate text-sm font-medium text-ink',
            cancelled && 'line-through decoration-line',
          )}
        >
          {appointment.serviceName}
        </span>
        <span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-muted">
          <span
            data-staff={appointment.hairdresserColorKey}
            aria-hidden="true"
            className="staff-bar h-2.5 w-[2px] shrink-0 rounded-xs"
          />
          <span className="truncate">{appointment.hairdresserName}</span>
        </span>
      </span>

      <span className="flex shrink-0 items-center gap-3">
        {appointment.priceMinorSnapshot !== null ? (
          <span className="tabular text-sm font-semibold text-ink">
            {formatKM(appointment.priceMinorSnapshot)}
          </span>
        ) : null}
        <StatusIndicator
          status={appointment.status}
          className="text-[0.7rem] whitespace-nowrap sm:text-xs"
        />
      </span>
    </div>
  )
}
