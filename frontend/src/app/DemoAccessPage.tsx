import { ArrowUpRight, CalendarDays, Clock3, ShieldCheck } from 'lucide-react'
import { useMemo } from 'react'

import { StatusPill } from '@/components/ui/Badges'
import { ButtonLink } from '@/components/ui/Button'
import { AppMark } from '@/components/ui/SalonMark'
import { Avatar, Skeleton, Surface } from '@/components/ui/Layout'
import { useAppointments, useSalon, useServices } from '@/data/queries'
import { formatTerminCount } from '@/lib/format'
import { APP_NAME, usePageTitle } from '@/lib/hooks'
import { dayRange, formatDateKey, formatTime, formatWeekday, todayDateKey } from '@/lib/time'

import type { AppointmentView } from '@/data/types'

import { DemoBanner } from './DemoBanner'

/**
 * The live day: the copy promises a book of appointments, so the page shows one rather than
 * describing it. Every number here is read from the demo data, and the strip under it says so.
 */
function DayPreview() {
  const today = todayDateKey()
  const range = useMemo(() => dayRange(today), [today])
  const appointments = useAppointments(range)
  const services = useServices()
  const active = (appointments.data ?? []).filter(
    (appointment) => appointment.status !== 'cancelled',
  )
  const nextConfirmed = active.find((appointment) => appointment.status === 'confirmed')

  return (
    <Surface as="section" aria-labelledby="preview-heading" className="overflow-hidden">
      <div className="flex items-end justify-between gap-4 border-b border-line px-6 pt-6 pb-4">
        <div>
          <h2 id="preview-heading" className="text-sm font-normal text-muted">
            {formatWeekday(today)}
          </h2>
          <p className="tabular mt-1 text-[2.5rem] leading-none font-medium text-ink">
            {formatDateKey(today).slice(0, 5)}
          </p>
        </div>
        <p className="text-right text-sm text-muted">
          {appointments.isPending ? 'Učitavanje…' : formatTerminCount(active.length)}
          {nextConfirmed ? (
            <>
              <br />
              sljedeće u {formatTime(nextConfirmed.startsAt)}
            </>
          ) : null}
        </p>
      </div>

      <ul className="px-6 py-2">
        {appointments.isPending ? (
          <li className="space-y-3 py-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </li>
        ) : active.length > 0 ? (
          active
            .slice(0, 4)
            .map((appointment) => <PreviewRow key={appointment.id} appointment={appointment} />)
        ) : (
          <li className="py-4 text-sm leading-relaxed text-muted">
            Danas nema termina u prikazu. Otvorite kalendar i izaberite drugi dan.
          </li>
        )}
      </ul>

      <p className="border-t border-line bg-paper px-6 py-3 text-xs leading-relaxed text-muted">
        Primjer rasporeda, izmišljeni podaci.
        {/* Never print a count that has not loaded yet: "0 usluga" reads as a broken salon. */}
        {services.data ? ` Ukupno ${services.data.length} usluga u katalogu.` : null}
      </p>
    </Surface>
  )
}

function PreviewRow({ appointment }: { appointment: AppointmentView }) {
  return (
    <li className="flex items-center gap-3 border-b border-line py-3 last:border-b-0">
      <span className="tabular w-11 shrink-0 text-sm font-semibold text-ink">
        {formatTime(appointment.startsAt)}
      </span>
      <span
        data-staff={appointment.hairdresserColorKey}
        aria-hidden="true"
        className="staff-bar h-8 w-[3px] shrink-0 rounded-xs"
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-ink">
          {appointment.clientName}
        </span>
        <span className="mt-0.5 block truncate text-xs text-muted">
          {appointment.serviceName} · {appointment.hairdresserName}
        </span>
      </span>
      <StatusPill status={appointment.status} className="hidden sm:inline-flex" />
      <Avatar name={appointment.clientName} size="sm" />
    </li>
  )
}

export function DemoAccessPage() {
  usePageTitle('Digitalna knjiga termina')
  const salon = useSalon()
  const isLevelTwo = (salon.data?.plan ?? 'level_2') === 'level_2'

  return (
    <div className="min-h-dvh bg-paper">
      <DemoBanner />
      <main className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-12 sm:px-8 sm:py-16 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.82fr)] lg:items-center lg:gap-x-20 lg:py-24">
        <div className="hero-enter max-w-xl lg:col-start-1 lg:row-start-1">
          {/* The product signs this page; the salon it opens into is named inside the demo. */}
          <p className="flex items-center gap-3">
            <AppMark size="sm" />
            <span className="display text-[1.15rem] text-ink">{APP_NAME}</span>
            <span className="text-[0.8rem] text-muted">demo</span>
          </p>

          {/*
           * The hero: the headline, hung off a copper margin rule the way a page is hung off the
           * edge of the sheet. It is the only large display type above the fold.
           */}
          <div className="mt-8 border-l-2 border-accent-ui pl-5 sm:pl-6">
            <h1 className="display text-[2.75rem] leading-[1.02] text-ink sm:text-[3.75rem]">
              Digitalna knjiga termina
            </h1>
          </div>
          <p className="hero-enter-2 mt-6 max-w-[48ch] text-base leading-relaxed text-muted sm:text-lg">
            Raspored za tri frizera, ručni termini, pauze i online rezervacije sa privatnim linkom
            za klijenta.
          </p>

          <div className="hero-enter-3 mt-8 flex flex-col gap-2.5 sm:flex-row">
            <ButtonLink to="/kalendar" variant="accent" size="lg">
              Uđi u demo
            </ButtonLink>
            {isLevelTwo ? (
              <ButtonLink
                to={`/rezervacija/${salon.data?.slug ?? 'studio-lana'}`}
                variant="secondary"
                size="lg"
              >
                Otvori javnu stranicu
                <ArrowUpRight aria-hidden="true" className="h-4 w-4 text-muted" />
              </ButtonLink>
            ) : (
              <span className="inline-flex min-h-12 items-center justify-center px-1 text-sm text-muted">
                Online rezervacije su u Paketu 2
              </span>
            )}

          </div>

          <p className="mt-5 flex items-start gap-2 text-sm leading-relaxed text-muted">
            <ShieldCheck aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            Bez prijave. Podaci su izmišljeni, ostaju u ovom pregledniku i nisu stvarna rezervacija.
          </p>
        </div>

        <div className="lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:self-center">
          <DayPreview />
              </div>

        <div className="hero-enter max-w-xl lg:col-start-1 lg:row-start-2">
          <dl className="grid gap-6 sm:grid-cols-2">
            <div>
              <dt className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Clock3 aria-hidden="true" className="h-4 w-4 text-primary" />
                Za vlasnicu
              </dt>
              <dd className="mt-2 text-sm leading-relaxed text-muted">
                Danas, kalendar, brzi unos termina i pauze.
              </dd>
            </div>
            <div>
              <dt className="flex items-center gap-2 text-sm font-semibold text-ink">
                <CalendarDays aria-hidden="true" className="h-4 w-4 text-primary" />
                Za klijenta
              </dt>
              <dd className="mt-2 text-sm leading-relaxed text-muted">
                Usluga, frizer i slobodan termin. Potvrda odmah, bez SMS-a i e-maila.
              </dd>
            </div>
          </dl>

          <p className="mt-8 text-sm leading-relaxed text-muted">
            Prikaz paketa je u Postavkama: Paket 1 je osnovni raspored, Paket 2 otključava javnu
            stranicu.
          </p>

          {/*
           * A ruled margin, not three outlined boxes: this really is a sequence, so it keeps its
           * numbers, but the numbers sit in their own column like a list of steps in a manual.
           */}
          <ol className="mt-8 border-t border-line">
            {JOURNEY.map((item, index) => (
              <li key={item.title} className="flex gap-4 border-b border-line py-4">
                <span className="tabular w-6 shrink-0 pt-0.5 text-xs font-medium text-accent-ui">
                  0{index + 1}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-ink">{item.title}</span>
                  <span className="mt-1 block text-xs leading-relaxed text-muted">
                    {item.detail}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </main>
      <footer className="mx-auto w-full max-w-6xl px-4 py-6 text-xs text-muted sm:px-8">
        Demo okruženje. Ne predstavlja stvarnu uslugu ni obračun.
      </footer>
    </div>
  )
}

const JOURNEY = [
  {
    title: 'Salon unosi termin',
    detail: 'Ručno, klikanjem na slobodno vrijeme u kalendaru.',
  },
  {
    title: 'Klijent bira sam',
    detail: 'Usluga, frizer i slobodan termin, bez poziva i bez naloga.',
  },
  {
    title: 'Potvrda odmah',
    detail: 'Privatni link za promjenu ili otkazivanje, bez SMS-a.',
  },
]
