import { UsersRound } from 'lucide-react'

import { ActiveState } from '@/components/ui/Badges'
import { Avatar, EmptyState, ErrorState, Skeleton } from '@/components/ui/Layout'
import { useHairdressers, useServices, useWorkingHours } from '@/data/queries'
import { cn } from '@/lib/cn'
import { formatDuration } from '@/lib/format'
import { isoWeekdayLabel } from '@/lib/time'

export function HairdressersPage() {
  const hairdressers = useHairdressers()
  const services = useServices()
  const workingHours = useWorkingHours()

  if (hairdressers.isError || services.isError || workingHours.isError) {
    return (
      <ErrorState
        title="Frizeri se nisu učitali"
        onRetry={() => {
          void hairdressers.refetch()
          void services.refetch()
          void workingHours.refetch()
        }}
      />
    )
  }

  if (hairdressers.isPending || services.isPending || workingHours.isPending) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    )
  }

  const staff = hairdressers.data ?? []
  const serviceList = services.data ?? []
  const hours = workingHours.data ?? []
  const activeCount = staff.filter((member) => member.isActive).length

  return (
    <div>
      <div className="max-w-[62ch]">
        <h2 className="text-xl font-semibold text-ink">Frizeri</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">
          {activeCount} aktivnih u timu. Svaki frizer ima svoje radno vrijeme i usluge koje radi.
        </p>
      </div>

      {staff.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon={UsersRound}
          title="Nema frizera"
          description="Dodajte frizere u pilot verziji."
        />
      ) : (
        <ul className="mt-6 space-y-3">
          {staff.map((member) => {
            const memberServices = serviceList.filter((service) =>
              member.serviceIds.includes(service.id),
            )
            const memberHours = hours.filter((interval) => interval.hairdresserId === member.id)
            const workingDays = new Set<number>(memberHours.map((interval) => interval.weekday))
            return (
              <li key={member.id} className="rounded-lg bg-surface px-5 py-5 sm:px-6">
                <div className="flex flex-wrap items-start gap-3">
                  <Avatar name={member.displayName} colorKey={member.colorKey} size="lg" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-base font-semibold text-ink">{member.displayName}</h3>
                      <ActiveState
                        active={member.isActive}
                        labelOn="Aktivan"
                        labelOff="Neaktivan"
                      />
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      {workingDays.size} radnih dana · {memberServices.length} usluga
                    </p>
                  </div>
                </div>

                <dl className="mt-5 grid gap-x-8 gap-y-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs text-muted">Usluge</dt>
                    <dd className="mt-1.5 text-sm leading-relaxed text-ink">
                      {memberServices.length > 0
                        ? memberServices
                            .map(
                              (service) =>
                                `${service.name} (${formatDuration(service.durationMinutes)})`,
                            )
                            .join(', ')
                        : 'Nema dodijeljenih usluga.'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">Radni dani</dt>
                    <dd className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-sm">
                      {Array.from({ length: 7 }).map((_, weekday) => {
                        const works = workingDays.has(weekday)
                        return (
                          <span
                            key={weekday}
                            className={cn(
                              'inline-flex items-center gap-1.5',
                              works ? 'text-ink' : 'text-muted',
                            )}
                          >
                            <span
                              aria-hidden="true"
                              className={cn(
                                'h-1.5 w-1.5 rounded-full',
                                works ? 'bg-primary' : 'bg-line',
                              )}
                            />
                            {isoWeekdayLabel(weekday, true)}
                          </span>
                        )
                      })}
                    </dd>
                  </div>
                </dl>
              </li>
            )
          })}
        </ul>
      )}

      <p className="mt-6 max-w-[70ch] text-xs leading-relaxed text-muted">
        Frizeri su u demou prikaz. Dodavanje, deaktivacija i promjena dodijeljenih usluga dolaze uz
        pilot.
      </p>
    </div>
  )
}
