import { Check, ExternalLink, Info } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/Button'
import { ErrorState, Panel, Skeleton } from '@/components/ui/Layout'
import { gatewayErrorMessage } from '@/data/gateway'
import { useHairdressers, usePackageInfo, useSalon, useSetDemoLevel } from '@/data/queries'
import type { PlanLevel } from '@/data/types'
import { cn } from '@/lib/cn'
import { formatKM, terminology } from '@/lib/format'
import { dateKeyFromInstant, formatDateKey } from '@/lib/time'

const PACKAGES: Array<{
  level: PlanLevel
  name: string
  priceMinor: number
  description: string
  features: string[]
}> = [
  {
    level: 'level_1',
    name: 'Paket 1',
    priceMinor: 1900,
    description: 'Digitalna knjiga termina',
    features: [
      'Kalendar i dnevni raspored',
      'Ručni termini, izmjene i otkazivanja',
      'Frizeri, usluge i radno vrijeme',
      'Pauze i odsustva',
      'Osnovni podaci o klijentima',
    ],
  },
  {
    level: 'level_2',
    name: 'Paket 2',
    priceMinor: 2900,
    description: 'Sve iz Paketa 1 i online rezervacije',
    features: [
      'Javna stranica salona',
      'Klijent bira uslugu, frizera i termin',
      'Potvrda odmah na ekranu',
      'Privatni link za izmjenu ili otkazivanje',
      'Bez SMS-a i e-maila',
    ],
  },
]

function daysUntil(iso: string | null): number | null {
  if (!iso) return null
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000))
}

export function PackagePage() {
  const salon = useSalon()
  const packageInfo = usePackageInfo()
  const hairdressers = useHairdressers()
  const setLevel = useSetDemoLevel()

  const level = packageInfo.data?.level ?? salon.data?.plan ?? 'level_2'
  const remainingDays = daysUntil(packageInfo.data?.trialEndsAt ?? salon.data?.trialEndsAt ?? null)
  const activeCount = hairdressers.data?.filter((item) => item.isActive).length ?? 0

  const switchLevel = (next: PlanLevel) => {
    if (next === level) return
    setLevel.mutate(next, {
      onSuccess: () =>
        toast.success(`Demo prikaz je prebačen na ${next === 'level_1' ? 'Paket 1' : 'Paket 2'}.`),
      onError: (error) => toast.error(gatewayErrorMessage(error)),
    })
  }

  if (packageInfo.isError || salon.isError) {
    return (
      <ErrorState
        title="Podaci o paketu se nisu učitali"
        onRetry={() => {
          void packageInfo.refetch()
          void salon.refetch()
        }}
      />
    )
  }

  return (
    <div className="space-y-12">
      <section aria-labelledby="package-summary">
        <h2 id="package-summary" className="text-xl font-semibold text-ink">
          Pretplata i paket
        </h2>
        <p className="mt-1.5 max-w-[62ch] text-sm leading-relaxed text-muted">
          {level === 'level_1'
            ? 'Knjiga termina bez javne stranice.'
            : 'Knjiga termina sa online rezervacijama.'}{' '}
          Cijena je po aktivnom frizeru mjesečno; naplata se u pilotu obavlja ručno.
        </p>

        {packageInfo.isPending ? (
          <div className="mt-5 grid gap-6 sm:grid-cols-2">
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
        ) : packageInfo.data ? (
          <div className="mt-6 grid items-end gap-8 sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-16">
            <div>
              <p className="text-sm text-muted">
                {level === 'level_1' ? 'Paket 1' : 'Paket 2'} u demou
              </p>
              <p className="mt-1 text-5xl font-semibold text-ink">
                {formatKM(packageInfo.data.pricePerHairdresserMinor)}
                <span className="ml-1.5 text-sm font-normal text-muted">/ frizer / mj.</span>
              </p>
            </div>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div>
                <dt className="text-muted">Aktivni frizeri</dt>
                <dd className="mt-0.5 font-medium text-ink">{activeCount}</dd>
              </div>
              <div>
                <dt className="text-muted">Procjena mjesečno</dt>
                <dd className="tabular mt-0.5 font-medium text-ink">
                  {formatKM(packageInfo.data.monthlyTotalMinor)}
                </dd>
              </div>
            </dl>
          </div>
        ) : null}
      </section>

      <section aria-labelledby="package-trial">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <h2 id="package-trial" className="text-xl font-semibold text-ink">
            Probni period
          </h2>
          {packageInfo.data?.trialEndsAt ? (
            <p className="text-sm text-muted">
              Završava{' '}
              <span className="font-medium text-ink">
                {formatDateKey(dateKeyFromInstant(packageInfo.data.trialEndsAt))}
              </span>
              {remainingDays !== null
                ? `, još ${remainingDays} ${terminology(remainingDays, 'dan', 'dana', 'dana')}`
                : ''}
            </p>
          ) : null}
        </div>
        <div className="mt-4 flex items-start gap-3 rounded-lg bg-accent-tint px-4 py-3.5 text-sm leading-relaxed text-accent-ui ring-1 ring-inset ring-accent-ui/40">
          <Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Kad probni period istekne, prikazuje se obavještenje. Pristup se ne blokira automatski;
            produženje se radi ručno. Nema automatske naplate ni kartice.
          </p>
        </div>
      </section>

      <section aria-labelledby="package-options">
        <h2 id="package-options" className="text-xl font-semibold text-ink">
          Uporedi pakete
        </h2>
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {PACKAGES.map((item) => {
            const active = item.level === level
            return (
              <div
                key={item.level}
                className={cn(
                  'flex flex-col rounded-lg px-5 py-6 sm:px-7',
                  active ? 'bg-primary-tint ring-1 ring-inset ring-primary/25' : 'bg-surface',
                )}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-ink">{item.name}</h3>
                    <p className="mt-0.5 text-sm text-muted">{item.description}</p>
                  </div>
                  {active ? (
                    <span className="shrink-0 text-xs font-medium text-primary-hover">
                      Prikazuje se
                    </span>
                  ) : null}
                </div>
                <p className="mt-5 text-3xl font-semibold text-ink">
                  {formatKM(item.priceMinor)}
                  <span className="ml-1.5 align-baseline text-sm font-normal text-muted">
                    / frizer / mj.
                  </span>
                </p>
                <ul className="mt-5 space-y-2">
                  {item.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2.5 text-sm leading-relaxed text-ink"
                    >
                      <Check
                        aria-hidden="true"
                        className={cn(
                          'mt-0.5 h-4 w-4 shrink-0',
                          active ? 'text-primary-hover' : 'text-primary',
                        )}
                      />
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto pt-6">
                  {active ? (
                    <p className="text-sm text-muted">Ovo je trenutni demo prikaz.</p>
                  ) : (
                    <Button
                      variant="secondary"
                      onClick={() => switchLevel(item.level)}
                      loading={setLevel.isPending}
                    >
                      Prikaži {item.name} u demou
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section aria-labelledby="package-public">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-surface px-5 py-4">
          <div>
            <h2 id="package-public" className="text-base font-semibold text-ink">
              Javna stranica
            </h2>
            <p className="mt-1 text-sm text-muted">
              {level === 'level_2'
                ? 'Online rezervacije su uključene u demo prikaz.'
                : 'Online rezervacije su dostupne u Paketu 2. Prebacite demo paket iznad.'}
            </p>
          </div>
          {level === 'level_2' ? (
            <a
              href={`/rezervacija/${salon.data?.slug ?? 'studio-lana'}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center gap-2 rounded-md px-1 text-sm font-medium text-primary transition-colors hover:text-primary-hover"
            >
              Otvori javnu stranicu
              <ExternalLink aria-hidden="true" className="h-4 w-4" />
            </a>
          ) : (
            <span className="text-sm text-muted">Dostupno u Paketu 2</span>
          )}
        </div>
      </section>

      <section aria-labelledby="salon-details">
        <h2 id="salon-details" className="text-xl font-semibold text-ink">
          Salon
        </h2>
        <p className="mt-1.5 max-w-[62ch] text-sm leading-relaxed text-muted">
          Osnovni podaci salona. U demou su samo prikaz; uređivanje profila dolazi uz pilot.
        </p>
        <Panel className="mt-4">
          <dl className="grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted">Naziv</dt>
              <dd className="mt-0.5 font-medium text-ink">{salon.data?.name ?? 'Studio Lana'}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Adresa</dt>
              <dd className="mt-0.5 font-medium text-ink">
                {salon.data?.address ?? 'Veselina Masleše 8'}, {salon.data?.city ?? 'Banja Luka'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Telefon</dt>
              <dd className="tabular mt-0.5 font-medium text-ink">
                {salon.data?.phone ?? '051 000 000'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Vremenska zona</dt>
              <dd className="mt-0.5 font-medium text-ink">
                {salon.data?.timezone ?? 'Europe/Sarajevo'}
              </dd>
            </div>
          </dl>
        </Panel>
      </section>

      <p className="max-w-[70ch] text-xs leading-relaxed text-muted">
        Promjena paketa u stvarnoj pilot verziji obavlja se ručno, kroz administrativni alat. Demo
        prekidač služi samo za prikaz.
      </p>
    </div>
  )
}
