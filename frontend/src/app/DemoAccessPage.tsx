import { ArrowUpRight, CalendarDays, Clock3, ShieldCheck } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router'

import { Avatar, Skeleton } from '@/components/ui/Layout'
import { StatusBadge } from '@/components/ui/Badges'
import { useAppointments, useSalon } from '@/data/queries'
import { formatTerminCount } from '@/lib/format'
import { usePageTitle } from '@/lib/hooks'
import { dayRange, formatDateKey, formatTime, formatWeekday, todayDateKey } from '@/lib/time'

import type { AppointmentView } from '@/data/types'

import { DemoBanner } from './DemoBanner'

function MiniSchedule() {
  const today = todayDateKey()
  const range = useMemo(() => dayRange(today), [today])
  const appointments = useAppointments(range)
  const items = (appointments.data ?? [])
    .filter((appointment) => appointment.status !== 'cancelled')
    .slice(0, 4)

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className="flex items-end justify-between gap-4 border-b border-line px-5 py-4">
        <div>
          <p className="text-xs font-medium text-muted">{formatWeekday(today)}</p>
          <p className="mt-0.5 font-display text-[2.6rem] leading-none font-semibold tracking-[-0.03em] text-ink">
            {formatDateKey(today).slice(0, 5)}
          </p>
        </div>
        <p className="pb-1 text-right text-xs leading-relaxed text-muted">
          {formatDateKey(today)}
          <br />
          {appointments.isPending ? 'Učitavanje…' : formatTerminCount(items.length)}
        </p>
      </div>

      <div className="divide-y divide-line">
        {appointments.isPending ? (
          <div className="space-y-3 p-5">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : items.length > 0 ? (
          items.map((appointment) => (
            <MiniAppointment key={appointment.id} appointment={appointment} />
          ))
        ) : (
          <div className="p-6 text-sm leading-relaxed text-muted">
            Danas nema termina u prikazu. Otvorite kalendar i izaberite drugi dan.
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-line bg-paper/60 px-5 py-3 text-xs text-muted">
        <CalendarDays aria-hidden="true" className="h-3.5 w-3.5" />
        Kalendar, klijenti, pauze i online rezervacije
      </div>
    </div>
  )
}

function MiniAppointment({ appointment }: { appointment: AppointmentView }) {
  return (
    <div className="flex items-stretch gap-3 px-4 py-3 sm:px-5">
      <div className="w-12 shrink-0 pt-0.5 text-right">
        <p className="time-gutter-label text-sm font-semibold text-ink">
          {formatTime(appointment.startsAt)}
        </p>
        <p className="mt-0.5 text-[0.65rem] text-muted">{formatTime(appointment.endsAt)}</p>
      </div>
      <div
        data-staff={appointment.hairdresserColorKey}
        className="w-[3px] shrink-0 rounded-full"
        style={{ backgroundColor: 'var(--staff)' }}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-semibold text-ink">{appointment.clientName}</p>
          <StatusBadge status={appointment.status} />
        </div>
        <p className="mt-0.5 truncate text-xs text-muted">
          {appointment.serviceName} · {appointment.hairdresserName}
        </p>
      </div>
      <Avatar name={appointment.clientName} size="sm" />
    </div>
  )
}

export function DemoAccessPage() {
  usePageTitle('Digitalna knjiga termina')
  const salon = useSalon()
  const isLevelTwo = (salon.data?.plan ?? 'level_2') === 'level_2'

  return (
    <div className="min-h-dvh bg-paper">
      <DemoBanner />
      <main className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[minmax(0,1fr)_minmax(380px,0.85fr)] lg:items-center lg:gap-14 lg:py-20">
        <div className="max-w-xl">
          <p className="flex items-center gap-2 text-sm font-medium text-pine">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-pine text-paper">
              <span className="font-display text-[0.7rem] font-semibold">SL</span>
            </span>
            Studio Lana · Banja Luka
          </p>

          <h1 className="mt-6 text-balance font-display text-[2.7rem] leading-[0.98] font-semibold tracking-[-0.035em] text-ink sm:text-6xl">
            Digitalna knjiga termina.
          </h1>
          <p className="mt-5 max-w-[54ch] text-base leading-relaxed text-muted sm:text-[1.05rem]">
            Demo prikaz za razgovor sa salonima: raspored za tri frizera, ručni termini, pauze i
            online rezervacije sa privatnim linkom za klijenta.
          </p>

          <div className="mt-8 flex flex-col gap-2.5 sm:flex-row">
            <Link
              to="/danas"
              className="inline-flex min-h-12 items-center justify-center rounded-md bg-pine px-5 text-base font-medium text-white transition-colors hover:bg-pine-strong"
            >
              Uđi u demo
            </Link>
            {isLevelTwo ? (
              <a
                href={`/rezervacija/${salon.data?.slug ?? 'studio-lana'}`}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-line-strong bg-surface px-5 text-base font-medium text-ink transition-colors hover:bg-paper"
              >
                Otvori javnu stranicu
                <ArrowUpRight aria-hidden="true" className="h-4 w-4 text-muted" />
              </a>
            ) : (
              <span className="inline-flex min-h-12 items-center justify-center rounded-md border border-line bg-paper px-5 text-sm text-muted">
                Online rezervacije su u Paketu 2
              </span>
            )}
          </div>

          <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-muted">
            <ShieldCheck aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-pine" />
            Demo ne zahtijeva prijavu. Svi podaci su izmišljeni, ostaju u ovom pregledniku i nisu
            stvarna rezervacija.
          </p>

          <div className="mt-10 grid gap-4 border-t border-line pt-6 sm:grid-cols-2">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Clock3 aria-hidden="true" className="h-4 w-4 text-pine" />
                Za vlasnicu
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                Danas, kalendar, brzi unos termina, klijenti i pauze.
              </p>
            </div>
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                <CalendarDays aria-hidden="true" className="h-4 w-4 text-pine" />
                Za klijenta
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                Usluga, frizer i slobodan termin. Potvrda odmah, bez SMS-a i e-maila.
              </p>
            </div>
          </div>

          <p className="mt-5 text-xs text-muted">
            Prebacite prikaz paketa u traci iznad. Paket 1 prikazuje osnovni raspored; Paket 2
            otključava javnu stranicu.
          </p>
        </div>

        <div className="relative">
          <div aria-hidden="true" className="absolute -inset-4 -z-10 rounded-[2rem] bg-pine/5" />
          <MiniSchedule />
          <p className="mt-3 px-1 text-right text-xs text-muted">
            Primjer rasporeda · izmišljeni podaci
          </p>
        </div>
      </main>
      <footer className="mx-auto w-full max-w-6xl border-t border-line px-4 py-5 text-xs text-muted sm:px-6">
        Demo okruženje. Ne predstavlja stvarnu uslugu ni obračun.
      </footer>
    </div>
  )
}
