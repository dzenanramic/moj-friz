import { Scissors } from 'lucide-react'

import { Avatar, EmptyState, ErrorState, Panel, Skeleton } from '@/components/ui/Layout'
import { useHairdressers, useServices } from '@/data/queries'
import { formatDuration, formatKM } from '@/lib/format'

export function ServicesPage() {
  const services = useServices()
  const hairdressers = useHairdressers()

  if (services.isError || hairdressers.isError) {
    return (
      <ErrorState
        title="Usluge se nisu učitale."
        onRetry={() => {
          void services.refetch()
          void hairdressers.refetch()
        }}
      />
    )
  }

  if (services.isPending || hairdressers.isPending) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
    )
  }

  const items = services.data ?? []
  const staff = hairdressers.data ?? []

  return (
    <div className="space-y-5">
      <div className="max-w-2xl">
        <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">Usluge</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          Trajanje i cijena usluge isti su za sve frizere. U demou su usluge prikaz; dodavanje i
          uređivanje dolazi uz pilot.
        </p>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Scissors}
          title="Nema usluga."
          description="Dodajte usluge u pilot verziji."
        />
      ) : (
        <Panel className="overflow-hidden">
          <ul className="divide-y divide-line">
            {items.map((service) => {
              const assigned = staff.filter((member) => member.serviceIds.includes(service.id))
              return (
                <li key={service.id} className="px-4 py-4 sm:px-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-ink">{service.name}</p>
                        <span
                          className={
                            service.isActive
                              ? 'inline-flex items-center gap-1.5 rounded-full bg-pine-soft px-2 py-0.5 text-[0.65rem] font-medium text-pine'
                              : 'inline-flex items-center gap-1.5 rounded-full bg-paper px-2 py-0.5 text-[0.65rem] font-medium text-muted'
                          }
                        >
                          <span
                            aria-hidden="true"
                            className={`h-1.5 w-1.5 rounded-full ${service.isActive ? 'bg-pine' : 'bg-line-strong'}`}
                          />
                          {service.isActive ? 'Aktivna' : 'Neaktivna'}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted">
                        {formatDuration(service.durationMinutes)} · {formatKM(service.priceMinor)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {assigned.length > 0 ? (
                        assigned.map((member) => (
                          <span
                            key={member.id}
                            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper/60 py-0.5 pr-2.5 pl-1 text-xs text-muted"
                          >
                            <Avatar
                              name={member.displayName}
                              colorKey={member.colorKey}
                              size="sm"
                            />
                            {member.displayName}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-muted">
                          Nije dodijeljena nijednom frizeru
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </Panel>
      )}

      <p className="text-xs leading-relaxed text-muted">
        Promjena trajanja ili cijene ne mijenja već zakazane termine — oni čuvaju svoje tadašnje
        podatke. Demo trenutno ne nudi izmjenu usluga.
      </p>
    </div>
  )
}
