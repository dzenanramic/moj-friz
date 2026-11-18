import { BarChart3 } from 'lucide-react'
import { useState, type ReactNode } from 'react'

import {
  Avatar,
  EmptyState,
  ErrorState,
  Panel,
  SectionHeading,
  Skeleton,
} from '@/components/ui/Layout'
import { useStatistics } from '@/data/queries'
import type { SalonStatistics, StatisticsPeriod } from '@/data/types'
import { cn } from '@/lib/cn'
import { formatDuration, formatKM, formatPercent, formatTerminCount } from '@/lib/format'
import { useNow } from '@/lib/hooks'
import { capitalizeFirst, formatDateKey, isoWeekdayLabel, todayDateKey } from '@/lib/time'

const PERIOD_OPTIONS: Array<{ value: StatisticsPeriod; label: string; rangeLabel: string }> = [
  { value: 'last_7_days', label: '7 dana', rangeLabel: 'Proteklih 7 punih dana' },
  { value: 'last_30_days', label: '30 dana', rangeLabel: 'Proteklih 30 punih dana' },
]

export function StatisticsPage() {
  const now = useNow()
  const today = todayDateKey(now)
  const [period, setPeriod] = useState<StatisticsPeriod>('last_7_days')
  const statistics = useStatistics(period, today)
  const data = statistics.data
  const rangeLabel =
    PERIOD_OPTIONS.find((option) => option.value === period)?.rangeLabel ?? 'Izabrani period'

  return (
    <div>
      <div className="max-w-[62ch]">
        <h2 className="text-xl font-semibold text-ink">Statistika</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">
          Prihod, termini i iskorištenost iz termina zabilježenih u ovom pregledniku. Računaju se
          samo puni protekli dani; današnji dan se ne broji dok se ne završi.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div
          role="group"
          aria-label="Period statistike"
          className="inline-flex rounded-full bg-[color-mix(in_srgb,var(--color-ink)_10%,var(--color-paper))] p-0.5 ring-1 ring-line ring-inset"
        >
          {PERIOD_OPTIONS.map((option) => {
            const selected = option.value === period
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={selected}
                onClick={() => setPeriod(option.value)}
                className={cn(
                  'inline-flex min-h-10 items-center rounded-full px-3.5 text-sm transition-[background-color,color,box-shadow] duration-150',
                  selected
                    ? 'bg-surface font-semibold text-ink shadow-card ring-1 ring-line ring-inset'
                    : 'font-medium text-muted hover:text-ink',
                )}
              >
                {option.label}
              </button>
            )
          })}
        </div>
        {data ? (
          <p className="tabular text-xs text-muted">
            {rangeLabel} · {formatDateKey(data.period.from)} – {formatDateKey(data.period.to)}
          </p>
        ) : null}
      </div>

      {statistics.isError ? (
        <ErrorState
          title="Statistika se nije učitala"
          message="Pokušajte ponovo. Demo podaci su i dalje u ovom pregledniku."
          onRetry={() => void statistics.refetch()}
        />
      ) : !data ? (
        <StatisticsSkeleton />
      ) : data.summary.appointments === 0 ? (
        <EmptyState
          className="mt-8"
          icon={BarChart3}
          title="Nema termina u ovom periodu"
          description="Izaberite duži period ili provjerite kalendar. Statistika se računa iz završenih termina i nedolazaka."
        />
      ) : (
        <StatisticsReport data={data} />
      )}
    </div>
  )
}

function StatisticsSkeleton() {
  return (
    <div role="status" className="mt-8 space-y-8">
      <span className="sr-only">Učitavanje statistike…</span>
      <div className="grid grid-cols-2 gap-6 border-t border-line pt-6 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-3 w-28" />
          </div>
        ))}
      </div>
      <Skeleton className="h-52 w-full rounded-lg" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-64 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    </div>
  )
}

function StatisticsReport({ data }: { data: SalonStatistics }) {
  return (
    <>
      <SummaryMetrics data={data} />
      <ArrivalsSection data={data} />
      <StaffSection rows={data.staff} />
      <ServicesSection rows={data.services} totalAppointments={data.summary.appointments} />
      <WhenSection data={data} />

      <p className="mt-12 max-w-[70ch] text-xs leading-relaxed text-muted">
        Prihod se računa samo iz završenih termina, po cijeni sačuvanoj u terminu. Nedolasci se
        prikazuju kao izgubljena vrijednost, a otkazani termini ne ulaze u prihod. Iskorištenost je
        odnos odrađenih minuta i radnog vremena aktivnih frizera, umanjenog za pauze i odsustva.
        Demo računa iz podataka u ovom pregledniku i ne šalje ih nigdje.
      </p>
    </>
  )
}

function SummaryMetrics({ data }: { data: SalonStatistics }) {
  const { summary, rates } = data

  return (
    <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-7 border-t border-line pt-6 sm:grid-cols-4">
      <Metric
        label="Prihod"
        value={formatKM(summary.revenueMinor)}
        hint={
          summary.averageTicketMinor === null
            ? 'Nema završenih termina'
            : `Prosječan račun ${formatKM(summary.averageTicketMinor)}`
        }
      />
      <Metric
        label="Termini"
        value={summary.appointments}
        hint={`${summary.completed} završenih · ${summary.noShow} nedolazaka`}
      />
      <Metric
        label="Iskorištenost"
        value={formatPercent(rates.occupancy)}
        hint={`${formatDuration(summary.bookedMinutes)} od ${formatDuration(summary.availableMinutes)} rada`}
      />
      <Metric
        label="Nedolasci"
        value={formatPercent(rates.noShowRate)}
        hint={`${summary.noShow} termina · ${formatKM(summary.lostRevenueMinor)} izgubljeno`}
      />
    </dl>
  )
}

function Metric({ label, value, hint }: { label: string; value: ReactNode; hint: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd>
        <span className="tabular mt-1 block text-2xl font-semibold text-ink">{value}</span>
        <span className="mt-1 block text-xs leading-relaxed text-muted">{hint}</span>
      </dd>
    </div>
  )
}

function ArrivalsSection({ data }: { data: SalonStatistics }) {
  const { summary, rates } = data
  return (
    <section aria-labelledby="statistics-arrivals" className="mt-12">
      <SectionHeading
        id="statistics-arrivals"
        title="Dolasci i klijenti"
        description="Kako su termini završili, odakle su došli i koliko je klijenata bilo. Nedolasci se ne naplaćuju."
      />
      <Panel as="div" className="mt-5">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
          <SmallMetric
            label="Završeni"
            value={summary.completed}
            hint={formatPercent(share(summary.completed, summary.appointments))}
          />
          <SmallMetric
            label="Otkazani"
            value={summary.cancelled}
            hint={formatPercent(rates.cancellationRate)}
          />
          <SmallMetric
            label="Online"
            value={summary.onlineAppointments}
            hint={`${formatPercent(rates.onlineShare)} · ${summary.manualAppointments} ručno`}
          />
          <SmallMetric
            label="Klijenti"
            value={summary.uniqueClients}
            hint="jedinstvenih u periodu"
          />
        </dl>
      </Panel>
    </section>
  )
}

function SmallMetric({ label, value, hint }: { label: string; value: ReactNode; hint: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-1">
        <span className="tabular block text-xl font-semibold text-ink">{value}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-muted">{hint}</span>
      </dd>
    </div>
  )
}

function StaffSection({ rows }: { rows: SalonStatistics['staff'] }) {
  return (
    <section aria-labelledby="statistics-staff" className="mt-12">
      <SectionHeading
        id="statistics-staff"
        title="Frizeri"
        description="Prihod, broj termina i iskorištenost radnog vremena po frizeru."
      />
      {rows.length === 0 ? (
        <p className="mt-5 text-sm text-muted">Nema podataka za izabrani period.</p>
      ) : (
        <Panel as="div" className="mt-5 px-3 py-2 sm:px-4">
          <ul className="divide-y divide-line">
            {rows.map((row) => (
              <StaffStatRow key={row.hairdresserId} row={row} />
            ))}
          </ul>
        </Panel>
      )}
    </section>
  )
}

function StaffStatRow({ row }: { row: SalonStatistics['staff'][number] }) {
  const hasAvailability = row.availableMinutes > 0
  return (
    <li className="py-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="inline-flex min-w-0 items-center gap-2.5">
          <Avatar name={row.name} colorKey={row.colorKey} size="sm" />
          <span className="truncate text-sm font-semibold text-ink">{row.name}</span>
        </span>
        <span className="tabular text-sm font-semibold text-ink">{formatKM(row.revenueMinor)}</span>
      </div>
      <div className="mt-2.5 flex items-center gap-3">
        <Bar value={row.occupancy} max={1} />
        <span className="tabular w-11 shrink-0 text-right text-xs text-muted">
          {hasAvailability ? formatPercent(row.occupancy) : '—'}
        </span>
      </div>
      <p className="mt-1 text-xs text-muted">
        {formatTerminCount(row.appointments)} · {formatDuration(row.bookedMinutes)} rada
        {hasAvailability ? ` · ${formatDuration(row.availableMinutes)} raspoloživo` : ''}
      </p>
    </li>
  )
}

function ServicesSection({
  rows,
  totalAppointments,
}: {
  rows: SalonStatistics['services']
  totalAppointments: number
}) {
  return (
    <section aria-labelledby="statistics-services" className="mt-12">
      <SectionHeading
        id="statistics-services"
        title="Usluge"
        description="Najtraženije usluge u periodu, sa prihodom od završenih termina."
      />
      {rows.length === 0 ? (
        <p className="mt-5 text-sm text-muted">Nema podataka za izabrani period.</p>
      ) : (
        <Panel as="div" className="mt-5 px-3 py-2 sm:px-4">
          <ul className="divide-y divide-line">
            {rows.map((row) => (
              <li key={row.serviceId} className="py-4">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="min-w-0 truncate text-sm font-semibold text-ink">
                    {row.name}
                  </span>
                  <span className="tabular shrink-0 text-sm font-semibold text-ink">
                    {formatKM(row.revenueMinor)}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <Bar value={share(row.appointments, totalAppointments)} max={1} />
                  <span className="tabular shrink-0 text-right text-xs text-muted">
                    {formatTerminCount(row.appointments)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </section>
  )
}

function WhenSection({ data }: { data: SalonStatistics }) {
  const maxWeekday = Math.max(1, ...data.weekdays.map((row) => row.appointments))
  const maxHour = Math.max(1, ...data.hours.map((row) => row.appointments))
  const topHours = data.hours.slice(0, 6)

  return (
    <section aria-labelledby="statistics-when" className="mt-12">
      <SectionHeading
        id="statistics-when"
        title="Kada se radi"
        description="Raspored termina po danu u sedmici i po satu početka."
      />
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <Panel as="div">
          <h3 className="text-sm font-semibold text-ink">Po danu u sedmici</h3>
          <ul className="mt-4 space-y-2.5">
            {data.weekdays.map((row) => (
              <li
                key={row.weekday}
                className="grid grid-cols-[2.5rem_minmax(0,1fr)_2rem] items-center gap-3"
              >
                <span className="text-xs text-muted">
                  {capitalizeFirst(isoWeekdayLabel(row.weekday, true))}
                </span>
                <Bar value={row.appointments} max={maxWeekday} />
                <span className="tabular text-right text-xs text-muted">{row.appointments}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel as="div">
          <h3 className="text-sm font-semibold text-ink">Najprometniji sati</h3>
          {topHours.length === 0 ? (
            <p className="mt-3 text-sm text-muted">Nema termina u ovom periodu.</p>
          ) : (
            <ul className="mt-4 space-y-2.5">
              {topHours.map((row) => (
                <li
                  key={row.hour}
                  className="grid grid-cols-[3.5rem_minmax(0,1fr)_2rem] items-center gap-3"
                >
                  <span className="tabular text-xs text-muted">
                    {String(row.hour).padStart(2, '0')}:00
                  </span>
                  <Bar value={row.appointments} max={maxHour} />
                  <span className="tabular text-right text-xs text-muted">{row.appointments}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </section>
  )
}

/** A decorative proportion bar; every row states its number in text beside it. */
function Bar({ value, max }: { value: number; max: number }) {
  const width = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div aria-hidden="true" className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-line">
      <div className="h-full rounded-full bg-primary" style={{ width: `${width}%` }} />
    </div>
  )
}

function share(part: number, whole: number): number {
  return whole > 0 ? part / whole : 0
}
