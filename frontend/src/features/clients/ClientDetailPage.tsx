import { Phone } from 'lucide-react'
import { useParams } from 'react-router'

import { BackLink, ErrorState, PageHeader, Panel, Skeleton } from '@/components/ui/Layout'
import { useClient } from '@/data/queries'
import { formatKM, formatTerminCount } from '@/lib/format'
import { usePageTitle } from '@/lib/hooks'
import { dateKeyFromInstant, formatDateKey } from '@/lib/time'

import { AppointmentListItem } from '../appointments/AppointmentListItem'

export function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const client = useClient(id)
  usePageTitle(client.data?.client.name ?? 'Klijent')

  if (client.isPending) {
    return (
      <div className="space-y-5">
        <BackLink to="/klijenti">Klijenti</BackLink>
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    )
  }

  if (client.isError || !client.data) {
    return (
      <div>
        <BackLink to="/klijenti">Klijenti</BackLink>
        <div className="mt-4">
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
  const completed = appointments.filter((appointment) => appointment.status === 'completed')
  const lastVisit = completed[0]
  const totalValue = appointments
    .filter((appointment) => appointment.status !== 'cancelled')
    .reduce((sum, appointment) => sum + (appointment.priceMinorSnapshot ?? 0), 0)
  const callHref = `tel:${person.phoneOriginal.replace(/\s+/g, '')}`

  return (
    <div>
      <BackLink to="/klijenti">Klijenti</BackLink>

      <div className="mt-2">
        <PageHeader
          title={person.name}
          description={
            <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
              <a
                href={callHref}
                className="inline-flex items-center gap-1.5 font-medium text-ink underline decoration-line-strong underline-offset-4 hover:text-pine"
              >
                <Phone aria-hidden="true" className="h-3.5 w-3.5" />
                {person.phoneOriginal}
              </a>
              <span>Klijent od {formatDateKey(dateKeyFromInstant(person.createdAt))}</span>
            </span>
          }
          className="pb-6"
        />
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-start">
        <div className="space-y-8">
          <dl className="grid grid-cols-3 gap-4 rounded-lg bg-surface px-5 py-4">
            <div>
              <dt className="text-xs text-muted">Termini</dt>
              <dd className="tabular mt-1 text-lg font-semibold text-ink">{appointments.length}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Zadnji dolazak</dt>
              <dd className="tabular mt-1 text-lg font-semibold text-ink">
                {lastVisit ? formatDateKey(dateKeyFromInstant(lastVisit.startsAt)) : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Vrijednost termina</dt>
              <dd className="tabular mt-1 text-lg font-semibold text-ink">
                {formatKM(totalValue)}
              </dd>
            </div>
          </dl>

          <section aria-labelledby="client-history">
            <div className="mb-1 flex items-baseline justify-between gap-3">
              <h2 id="client-history" className="text-base font-semibold text-ink">
                Historija termina
              </h2>
              <span className="text-xs text-muted">{formatTerminCount(appointments.length)}</span>
            </div>
            {appointments.length === 0 ? (
              <Panel>
                <p className="text-sm text-muted">Ovaj klijent još nema termina.</p>
              </Panel>
            ) : (
              <Panel className="py-1">
                {appointments.map((appointment) => (
                  <AppointmentListItem key={appointment.id} appointment={appointment} showPrice />
                ))}
              </Panel>
            )}
          </section>
        </div>

        <aside className="space-y-7 lg:sticky lg:top-6">
          <section>
            <h2 className="text-base font-semibold text-ink">Napomena</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink">
              {person.notes ?? 'Nema napomene.'}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Samo poslovne napomene. Ne unosite zdravstvene ni druge osjetljive podatke.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-ink">Kontakt</h2>
            <a
              href={callHref}
              className="tabular mt-2 inline-flex min-h-11 items-center gap-2 rounded-md bg-surface px-4 text-sm font-medium text-ink transition-colors hover:bg-pine-soft"
            >
              <Phone aria-hidden="true" className="h-4 w-4 text-pine" />
              {person.phoneOriginal}
            </a>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Broj nije verifikovan; prikaz je iz demo podataka.
            </p>
          </section>
        </aside>
      </div>

      <p className="mt-9 max-w-[70ch] text-xs leading-relaxed text-muted">
        Historija je vidljiva samo salonu. Nikada se ne prikazuje na javnoj stranici ni preko
        privatnog linka za upravljanje terminom.
      </p>
    </div>
  )
}
