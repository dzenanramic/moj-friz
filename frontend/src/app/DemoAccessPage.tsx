import { ArrowUpRight, CalendarDays, Clock3, ShieldCheck } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router'

import { StatusPill } from '@/components/ui/Badges'
import { Avatar, Skeleton, Surface } from '@/components/ui/Layout'
import { useAppointments, useSalon, useServices } from '@/data/queries'
import { formatTerminCount } from '@/lib/format'
import { usePageTitle } from '@/lib/hooks'
import { dayRange, formatDateKey, formatTime, formatWeekday, todayDateKey } from '@/lib/time'

import type { AppointmentView } from '@/data/types'

import { DemoBanner } from './DemoBanner'

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
    <Surface className="overflow-hidden">
      <div className="flex items-baseline justify-between gap-4 px-6 pt-6 pb-4">
        <div>
          <p className="text-sm text-muted">{formatWeekday(today)}</p>
          <p className="tabular mt-1 text-5xl leading-none font-semibold text-ink">
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

      <ul className="px-6 pb-5">
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

      <p className="bg-paper px-6 py-3 text-xs leading-relaxed text-muted">
        Primjer rasporeda, izmišljeni podaci.
        {/* Never print a count that has not loaded yet: "0 usluga" reads as a broken salon. */}
        {services.data ? ` Ukupno ${services.data.length} usluga u katalogu.` : null}
      </p>
    </Surface>
  )
}

function PreviewRow({ appointment }: { appointment: AppointmentView }) {
  return (
    <li className="flex items-center gap-3 py-3">
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
      <main className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-12 sm:px-8 sm:py-16 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.82fr)] lg:items-center lg:gap-20 lg:py-24">
        <div className="hero-enter max-w-xl">
          <p className="flex items-center gap-2.5 text-sm font-medium text-ink">
            <span
              aria-hidden="true"
              className="flex h-7 w-7 items-center justify-center rounded-sm bg-primary text-xs font-semibold text-on-primary"
            >
              SL
            </span>
            Studio Lana, Banja Luka
          </p>

          <h1 className="hero-enter-2 mt-7 text-ink">Digitalna knjiga termina</h1>
          <p className="mt-5 max-w-[50ch] text-base leading-relaxed text-muted sm:text-lg">
            Raspored za tri frizera, ručni termini, pauze i online rezervacije sa privatnim linkom
            za klijenta.
          </p>

          <div className="hero-enter-3 mt-8 flex flex-col gap-2.5 sm:flex-row">
            <Link
              to="/danas"
              className="inline-flex min-h-12 items-center justify-center rounded-md bg-accent px-6 text-base font-medium text-on-accent transition-[background-color,transform] duration-150 ease-[cubic-bezier(.2,.8,.2,1)] hover:-translate-y-px hover:brightness-90 active:translate-y-0 active:scale-[0.985]"
            >
              Uđi u demo
            </Link>
            {isLevelTwo ? (
              <a
                href={`/rezervacija/${salon.data?.slug ?? 'studio-lana'}`}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-surface px-6 text-base font-medium text-ink transition-[background-color,transform] duration-150 ease-[cubic-bezier(.2,.8,.2,1)] hover:-translate-y-px hover:bg-primary-tint active:translate-y-0 active:scale-[0.985]"
              >
                Otvori javnu stranicu
                <ArrowUpRight aria-hidden="true" className="h-4 w-4 text-muted" />
              </a>
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

          <dl className="mt-12 grid gap-8 sm:grid-cols-2">
            <div>
              <dt className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Clock3 aria-hidden="true" className="h-4 w-4 text-primary" />
                Za vlasnicu
              </dt>
              <dd className="mt-2 text-sm leading-relaxed text-muted">
                Danas, kalendar, brzi unos termina, klijenti i pauze.
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
            Paket 1 prikazuje osnovni raspored; Paket 2 otključava javnu stranicu. Prekidač je u
            traci iznad.
          </p>

          <ol className="mt-10 grid gap-px overflow-hidden rounded-md bg-line sm:grid-cols-3">
            {JOURNEY.map((item, index) => (
              <li key={item.title} className="bg-paper px-4 py-4">
                <p className="tabular text-xs font-semibold text-primary">0{index + 1}</p>
                <p className="mt-1.5 text-sm font-semibold text-ink">{item.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">{item.detail}</p>
              </li>
            ))}
          </ol>
        </div>

        <DayPreview />
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
