import { Scissors } from 'lucide-react'

import { ActiveState, StaffName } from '@/components/ui/Badges'
import { EmptyState, ErrorState, Panel, Skeleton } from '@/components/ui/Layout'
import { useHairdressers, useServices } from '@/data/queries'
import { formatDuration, formatKM } from '@/lib/format'

export function ServicesPage() {
  const services = useServices()
  const hairdressers = useHairdressers()

  if (services.isError || hairdressers.isError) {
    return (
      <ErrorState
        title="Usluge se nisu učitale"
        onRetry={() => {
          void services.refetch()
          void hairdressers.refetch()
        }}
      />
    )
  }

  if (services.isPending || hairdressers.isPending) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-20 w-full rounded-lg" />
      </div>
    )
  }

  const items = services.data ?? []
  const staff = hairdressers.data ?? []

  return (
    <div>
      <div className="max-w-[62ch]">
        <h2 className="text-xl font-semibold text-ink">Usluge</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">
          Trajanje i cijena su isti za sve frizere. U demou su usluge samo prikaz; dodavanje i
          uređivanje dolazi uz pilot.
        </p>
      </div>

      {items.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon={Scissors}
          title="Nema usluga"
          description="Dodajte usluge u pilot verziji."
        />
      ) : (
        <Panel className="mt-6 py-2">
          <ul>
            {items.map((service) => {
              const assigned = staff.filter((member) => member.serviceIds.includes(service.id))
              return (
                <li
                  key={service.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-3 py-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_120px] sm:gap-x-6 sm:px-4"
                >
                  <div>
                    <p className="text-sm font-semibold text-ink">{service.name}</p>
                    <p className="tabular mt-0.5 text-sm text-muted">
                      {formatDuration(service.durationMinutes)} · {formatKM(service.priceMinor)}
                    </p>
                  </div>
                  <div className="col-span-2 row-start-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 sm:col-span-1 sm:col-start-2 sm:row-start-1">
                    {assigned.length > 0 ? (
                      assigned.map((member) => (
                        <StaffName
                          key={member.id}
                          name={member.displayName}
                          colorKey={member.colorKey}
                        />
                      ))
                    ) : (
                      <span className="text-xs text-muted">Nijedan frizer ne radi ovu uslugu</span>
                    )}
                  </div>
                  <ActiveState
                    active={service.isActive}
                    labelOn="Aktivna"
                    labelOff="Neaktivna"
                    className="col-start-2 row-start-1 justify-self-end font-semibold text-ink sm:col-start-3 sm:justify-self-start"
                  />
                </li>
              )
            })}
          </ul>
        </Panel>
      )}

      <p className="mt-6 max-w-[70ch] text-xs leading-relaxed text-muted">
        Promjena trajanja ili cijene ne mijenja već zakazane termine; oni čuvaju svoje tadašnje
        podatke. Demo trenutno ne nudi izmjenu usluga.
      </p>
    </div>
  )
}
