import { Check, ExternalLink, Info, UsersRound } from 'lucide-react'
import { toast } from 'sonner'

import { LevelBadge } from '@/components/ui/Badges'
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
    description: 'Sve iz Paketa 1 + online rezervacije',
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
        title="Podaci o paketu se nisu učitali."
        onRetry={() => {
          void packageInfo.refetch()
          void salon.refetch()
        }}
      />
    )
  }

  return (
    <div className="space-y-8">
      <section aria-labelledby="package-summary">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              id="package-summary"
              className="font-display text-2xl font-semibold tracking-tight text-ink"
            >
              Pretplata i paket
            </h2>
            <p className="mt-1 text-sm text-muted">
              Cijena je po aktivnom frizeru mjesečno. Prikaz je informativan; naplata se u pilotu
              obavlja ručno.
            </p>
          </div>
          <LevelBadge level={level} />
        </div>

        <Panel className="mt-4 p-4 sm:p-5">
          {packageInfo.isPending ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-10 w-64" />
            </div>
          ) : packageInfo.data ? (
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium text-muted">Trenutni demo prikaz</p>
                <p className="mt-1 font-display text-3xl font-semibold tracking-tight text-ink">
                  {level === 'level_1' ? 'Paket 1' : 'Paket 2'}
                </p>
                <p className="mt-2 text-sm text-muted">
                  {level === 'level_1'
                    ? 'Digitalna knjiga termina bez javne stranice.'
                    : 'Digitalna knjiga termina sa online rezervacijama.'}
                </p>
              </div>
              <dl className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted">Cijena po frizeru</dt>
                  <dd className="font-semibold text-ink">
                    {formatKM(packageInfo.data.pricePerHairdresserMinor)} / mjesec
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted">Aktivni frizeri</dt>
                  <dd className="font-semibold text-ink">{activeCount}</dd>
                </div>
                <div className="flex items-center justify-between gap-4 border-t border-line pt-2.5">
                  <dt className="text-muted">Procjena mjesečno</dt>
                  <dd className="font-semibold text-ink">
                    {formatKM(packageInfo.data.monthlyTotalMinor)}
                  </dd>
                </div>
              </dl>
            </div>
          ) : null}
        </Panel>
      </section>

      <section aria-labelledby="package-trial">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 id="package-trial" className="text-base font-semibold text-ink">
              Probni period
            </h2>
            <p className="mt-1 text-sm text-muted">
              {packageInfo.data?.subscriptionStatus === 'trial'
                ? 'Probni period je aktivan.'
                : 'Pretplata je trenutno van probnog perioda.'}
            </p>
          </div>
          {packageInfo.data?.trialEndsAt ? (
            <p className="text-sm text-muted">
              Završava{' '}
              <span className="font-medium text-ink">
                {formatDateKey(dateKeyFromInstant(packageInfo.data.trialEndsAt))}
              </span>
              {remainingDays !== null
                ? ` · još ${remainingDays} ${terminology(remainingDays, 'dan', 'dana', 'dana')}`
                : ''}
            </p>
          ) : null}
        </div>
        <div className="mt-3 flex items-start gap-2.5 rounded-md border border-amber/25 bg-amber-soft/70 px-4 py-3 text-sm leading-relaxed text-amber-ink">
          <Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Kad probni period istekne, prikazuje se obavještenje. Pristup se ne blokira automatski;
            produženje se radi ručno. Nema automatske naplate ni kartice.
          </p>
        </div>
      </section>

      <section aria-labelledby="package-options">
        <h2 id="package-options" className="text-base font-semibold text-ink">
          Uporedi pakete
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {PACKAGES.map((item) => {
            const active = item.level === level
            return (
              <div
                key={item.level}
                className={cn(
                  'flex flex-col rounded-lg border bg-surface p-5',
                  active ? 'border-pine shadow-[inset_0_0_0_1px_var(--color-pine)]' : 'border-line',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-2xl font-semibold tracking-tight text-ink">
                      {item.name}
                    </p>
                    <p className="mt-0.5 text-sm text-muted">{item.description}</p>
                  </div>
                  {active ? (
                    <span className="rounded-full bg-pine-soft px-2.5 py-1 text-xs font-semibold text-pine">
                      Prikazuje se
                    </span>
                  ) : null}
                </div>
                <p className="mt-4 font-display text-3xl font-semibold tracking-tight text-ink">
                  {formatKM(item.priceMinor)}
                  <span className="ml-1 font-sans text-xs font-normal text-muted">
                    / frizer / mj.
                  </span>
                </p>
                <ul className="mt-5 space-y-2">
                  {item.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm leading-relaxed text-ink"
                    >
                      <Check aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-pine" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 border-t border-line pt-4">
                  {active ? (
                    <p className="text-sm font-medium text-pine">Trenutni demo prikaz</p>
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
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface px-4 py-4">
          <div>
            <h2 id="package-public" className="text-sm font-semibold text-ink">
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
              className="inline-flex min-h-11 items-center gap-2 rounded-md border border-line-strong bg-surface px-4 text-sm font-medium text-ink transition-colors hover:bg-paper"
            >
              Otvori javnu stranicu
              <ExternalLink aria-hidden="true" className="h-4 w-4 text-muted" />
            </a>
          ) : (
            <span className="inline-flex min-h-11 items-center rounded-md border border-line bg-paper px-4 text-sm text-muted">
              Dostupno u Paketu 2
            </span>
          )}
        </div>
      </section>

      <section aria-labelledby="salon-details">
        <h2
          id="salon-details"
          className="font-display text-2xl font-semibold tracking-tight text-ink"
        >
          Salon
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          Osnovni podaci salona. U demou su samo prikaz; uređivanje profila dolazi uz pilot.
        </p>
        <Panel className="mt-4 p-4 sm:p-5">
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
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
              <dd className="mt-0.5 font-medium text-ink">{salon.data?.phone ?? '051 000 000'}</dd>
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

      <p className="flex items-start gap-2 text-xs leading-relaxed text-muted">
        <UsersRound aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
        Promjena paketa u stvarnoj pilot verziji obavlja se ručno, kroz administrativni alat. Demo
        prekidač služi samo za prikaz.
      </p>
    </div>
  )
}
