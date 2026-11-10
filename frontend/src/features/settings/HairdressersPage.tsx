import { UsersRound } from 'lucide-react'

import { Avatar, EmptyState, ErrorState, Panel, Skeleton } from '@/components/ui/Layout'
import { useHairdressers, useServices, useWorkingHours } from '@/data/queries'
import { formatDuration } from '@/lib/format'
import { isoWeekdayLabel } from '@/lib/time'

export function HairdressersPage() {
  const hairdressers = useHairdressers()
  const services = useServices()
  const workingHours = useWorkingHours()

  if (hairdressers.isError || services.isError || workingHours.isError) {
    return (
      <ErrorState
        title="Frizeri se nisu učitali."
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
      <div className="space-y-2">
        <Skeleton className="h-28 w-full rounded-lg" />
        <Skeleton className="h-28 w-full rounded-lg" />
        <Skeleton className="h-28 w-full rounded-lg" />
      </div>
    )
  }

  const staff = hairdressers.data ?? []
  const serviceList = services.data ?? []
  const hours = workingHours.data ?? []
  const activeStaff = staff.filter((member) => member.isActive)

  return (
    <div className="space-y-5">
      <div className="max-w-2xl">
        <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">Frizeri</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          Jedan salon, više frizera. Svaki frizer ima svoje radno vrijeme i usluge koje radi.
        </p>
      </div>

      {staff.length === 0 ? (
        <EmptyState
          icon={UsersRound}
          title="Nema frizera."
          description="Dodajte frizere u pilot verziji."
        />
      ) : (
        <div className="space-y-3">
          {staff.map((member) => {
            const memberServices = serviceList.filter((service) =>
              member.serviceIds.includes(service.id),
            )
            const memberHours = hours.filter((interval) => interval.hairdresserId === member.id)
            const workingDays = new Set<number>(memberHours.map((interval) => interval.weekday))
            return (
              <Panel key={member.id} as="article" className="p-4 sm:p-5">
                <div className="flex flex-wrap items-start gap-3">
                  <Avatar name={member.displayName} colorKey={member.colorKey} size="lg" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-ink">{member.displayName}</h3>
                      <span
                        className={
                          member.isActive
                            ? 'inline-flex items-center gap-1.5 rounded-full bg-pine-soft px-2 py-0.5 text-[0.65rem] font-medium text-pine'
                            : 'inline-flex items-center gap-1.5 rounded-full bg-paper px-2 py-0.5 text-[0.65rem] font-medium text-muted'
                        }
                      >
                        <span
                          aria-hidden="true"
                          className={`h-1.5 w-1.5 rounded-full ${member.isActive ? 'bg-pine' : 'bg-line-strong'}`}
                        />
                        {member.isActive ? 'Aktivan' : 'Neaktivan'}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      {workingDays.size} radnih dana · {memberServices.length} usluga
                    </p>
                  </div>
                  {member.isActive ? (
                    <span className="rounded-full border border-line px-2.5 py-1 text-[0.65rem] font-medium text-muted">
                      {activeStaff.length} aktivnih u timu
                    </span>
                  ) : null}
                </div>

                <div className="mt-4 grid gap-4 border-t border-line pt-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium text-muted">Usluge</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {memberServices.map((service) => (
                        <span
                          key={service.id}
                          className="rounded-full border border-line bg-paper/60 px-2.5 py-1 text-xs text-ink"
                        >
                          {service.name}
                          <span className="ml-1 text-muted">
                            {formatDuration(service.durationMinutes)}
                          </span>
                        </span>
                      ))}
                      {memberServices.length === 0 ? (
                        <span className="text-xs text-muted">Nema dodijeljenih usluga.</span>
                      ) : null}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted">Radni dani</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {Array.from({ length: 7 }).map((_, weekday) => {
                        const works = workingDays.has(weekday)
                        return (
                          <span
                            key={weekday}
                            className={
                              works
                                ? 'rounded-sm bg-pine-soft px-2 py-1 text-[0.68rem] font-medium text-pine'
                                : 'rounded-sm bg-paper px-2 py-1 text-[0.68rem] text-muted'
                            }
                          >
                            {isoWeekdayLabel(weekday, true)}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </Panel>
            )
          })}
        </div>
      )}

      <p className="text-xs leading-relaxed text-muted">
        Frizeri su u demou prikaz. Dodavanje, deaktivacija i promjena dodijeljenih usluga dolaze uz
        pilot.
      </p>
    </div>
  )
}
