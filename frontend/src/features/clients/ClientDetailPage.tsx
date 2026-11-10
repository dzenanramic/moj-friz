import { Phone, StickyNote } from 'lucide-react'
import { useParams } from 'react-router'

import { Avatar, BackLink, ErrorState, PageHeader, Panel, Skeleton } from '@/components/ui/Layout'
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
      <div className="space-y-4">
        <BackLink to="/klijenti">Klijenti</BackLink>
        <Skeleton className="h-24 w-full rounded-lg" />
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
            title="Klijent nije pronađen."
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

  return (
    <div>
      <BackLink to="/klijenti">Klijenti</BackLink>

      <div className="mt-3">
        <PageHeader
          title={person.name}
          description={
            <span className="inline-flex items-center gap-2">
              <Phone aria-hidden="true" className="h-3.5 w-3.5" />
              <a
                href={`tel:${person.phoneOriginal.replace(/\s+/g, '')}`}
                className="underline decoration-line-strong underline-offset-4 hover:text-ink"
              >
                {person.phoneOriginal}
              </a>
              <span aria-hidden="true" className="text-line-strong">
                /
              </span>
              Klijent od {formatDateKey(dateKeyFromInstant(person.createdAt))}
            </span>
          }
          className="pb-4"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        <div className="space-y-4">
          <Panel className="p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <Avatar name={person.name} size="lg" />
              <div>
                <p className="text-sm font-semibold text-ink">{person.name}</p>
                <p className="text-xs text-muted">Osnovni podaci i historija termina</p>
              </div>
            </div>
            <dl className="mt-4 grid gap-3 border-t border-line pt-4 sm:grid-cols-3">
              <div>
                <dt className="text-xs text-muted">Termini ukupno</dt>
                <dd className="mt-0.5 text-sm font-semibold text-ink">{appointments.length}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Zadnji dolazak</dt>
                <dd className="mt-0.5 text-sm font-semibold text-ink">
                  {lastVisit ? formatDateKey(dateKeyFromInstant(lastVisit.startsAt)) : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Vrijednost termina</dt>
                <dd className="mt-0.5 text-sm font-semibold text-ink">{formatKM(totalValue)}</dd>
              </div>
            </dl>
          </Panel>

          <section aria-labelledby="client-history">
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <h2 id="client-history" className="text-sm font-semibold text-ink">
                Historija termina
              </h2>
              <span className="text-xs text-muted">{formatTerminCount(appointments.length)}</span>
            </div>
            {appointments.length === 0 ? (
              <p className="rounded-lg border border-dashed border-line-strong px-4 py-6 text-sm text-muted">
                Ovaj klijent još nema termina.
              </p>
            ) : (
              <Panel className="px-1 sm:px-2">
                {appointments.map((appointment) => (
                  <AppointmentListItem key={appointment.id} appointment={appointment} showPrice />
                ))}
              </Panel>
            )}
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-6">
          <Panel className="p-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
              <StickyNote aria-hidden="true" className="h-4 w-4 text-muted" />
              Napomena
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {person.notes ?? 'Nema napomene.'}
            </p>
            <p className="mt-3 border-t border-line pt-3 text-[0.7rem] leading-relaxed text-muted">
              Samo osnovne poslovne napomene. Ne unosite zdravstvene ili druge osjetljive podatke.
            </p>
          </Panel>

          <Panel className="p-4">
            <h2 className="text-sm font-semibold text-ink">Kontakt</h2>
            <a
              href={`tel:${person.phoneOriginal.replace(/\s+/g, '')}`}
              className="mt-3 flex min-h-11 items-center gap-2 rounded-md border border-line bg-paper/60 px-3 text-sm font-medium text-ink transition-colors hover:border-line-strong"
            >
              <Phone aria-hidden="true" className="h-4 w-4 text-pine" />
              {person.phoneOriginal}
            </a>
            <p className="mt-2 text-[0.7rem] leading-relaxed text-muted">
              Broj nije verifikovan; prikaz je iz demo podataka.
            </p>
          </Panel>
        </aside>
      </div>

      <p className="mt-6 text-xs leading-relaxed text-muted">
        Historija je vidljiva samo salonu. Nikada se ne prikazuje na javnoj stranici ni preko
        privatnog linka za upravljanje terminom.
      </p>
    </div>
  )
}
