import { Check, Clipboard, ExternalLink, Link2 } from 'lucide-react'
import { useLocation } from 'react-router'
import { toast } from 'sonner'

import { StatusBadge } from '@/components/ui/Badges'
import { Button, buttonClassName } from '@/components/ui/Button'
import { ErrorState, Skeleton } from '@/components/ui/Layout'
import { useManagementAppointment } from '@/data/queries'
import { managementPath, readTokenFromFragment } from '@/demo/token'
import { formatKM } from '@/lib/format'
import { useCopyToClipboard, usePageTitle } from '@/lib/hooks'
import {
  dateKeyFromInstant,
  formatDateKey,
  formatDayNumber,
  formatMonth,
  formatTimeRange,
  formatWeekday,
  capitalizeFirst,
} from '@/lib/time'

export function ConfirmationPage() {
  usePageTitle('Termin je potvrđen')
  const location = useLocation()
  const token = readTokenFromFragment(location.hash)
  const appointment = useManagementAppointment(token)
  const { copied, copy } = useCopyToClipboard()

  if (!token) return <InvalidManagementLink />

  if (appointment.isPending) {
    return (
      <div className="mx-auto max-w-2xl space-y-3">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-[420px] w-full rounded-xl" />
      </div>
    )
  }

  if (appointment.isError || !appointment.data) {
    return (
      <div className="mx-auto max-w-2xl">
        <ErrorState
          title="Potvrda nije dostupna."
          message="Link je nevažeći ili je istekao. Ako ste upravo rezervisali, pokušajte ponovo."
        />
        <div className="mt-4 flex gap-2">
          <a href="/" className={buttonClassName('primary')}>
            Demo početna
          </a>
        </div>
      </div>
    )
  }

  const data = appointment.data
  const managementUrl = `${window.location.origin}${managementPath(token)}`
  const dateKey = dateKeyFromInstant(data.startsAt)
  const isCancelled = data.status === 'cancelled'

  return (
    <div className="mx-auto max-w-2xl">
      <div className="max-w-xl">
        <p className="text-sm font-medium text-pine">
          {isCancelled ? 'Termin je otkazan' : 'Termin je potvrđen'}
        </p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          {isCancelled ? 'Otkazano.' : 'Vidimo se u salonu.'}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          {isCancelled
            ? 'Ovaj termin više nije aktivan. Možete otvoriti početnu stranu salona i rezervisati novi termin.'
            : 'Sačuvajte privatni link ispod. On je jedini način da promijenite ili otkažete termin bez poziva salonu.'}
        </p>
      </div>

      <article className="ticket mt-7 rounded-xl">
        <div className="p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-muted">Potvrda termina</p>
              <p className="mt-1 font-display text-2xl font-semibold tracking-tight text-ink">
                {data.salonName}
              </p>
            </div>
            <StatusBadge status={data.status} />
          </div>

          <div className="mt-6 grid grid-cols-[92px_minmax(0,1fr)] gap-5 sm:grid-cols-[110px_minmax(0,1fr)]">
            <div className="border-r border-line pr-4">
              <p className="text-[0.65rem] font-medium text-muted">
                {capitalizeFirst(formatWeekday(dateKey))}
              </p>
              <p className="mt-1 font-display text-5xl leading-none font-semibold tracking-[-0.04em] text-ink sm:text-6xl">
                {formatDayNumber(dateKey)}
              </p>
              <p className="mt-1 text-xs text-muted">
                {formatMonth(dateKey)} {dateKey.slice(0, 4)}.
              </p>
              <p className="mt-3 text-xs font-medium text-ink">{formatDateKey(dateKey)}</p>
            </div>

            <div>
              <p className="time-gutter-label font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                {formatTimeRange(data.startsAt, data.endsAt)}
              </p>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex flex-wrap gap-x-2">
                  <dt className="text-muted">Usluga:</dt>
                  <dd className="font-medium text-ink">{data.serviceName}</dd>
                </div>
                <div className="flex flex-wrap gap-x-2">
                  <dt className="text-muted">Frizer:</dt>
                  <dd className="font-medium text-ink">{data.hairdresserName}</dd>
                </div>
                <div className="flex flex-wrap gap-x-2">
                  <dt className="text-muted">Cijena:</dt>
                  <dd className="font-medium text-ink">{formatKM(data.priceMinor)}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        <div className="ticket-divider" />

        <div className="p-5 sm:p-7">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Link2 aria-hidden="true" className="h-4 w-4 text-pine" />
            Privatni link za upravljanje
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Nismo poslali SMS ni e-mail. Link ostaje važeći do{' '}
            {formatDateKey(dateKeyFromInstant(data.managementExpiresAt))}. Ako ga izgubite,
            kontaktirajte salon telefonom.
          </p>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              readOnly
              value={managementUrl}
              aria-label="Privatni link za upravljanje terminom"
              onFocus={(event) => event.currentTarget.select()}
              className="min-h-11 w-full flex-1 rounded-md border border-line bg-paper/70 px-3 py-2 font-sans text-xs text-muted"
            />
            <Button
              variant="secondary"
              leftIcon={
                copied ? (
                  <Check aria-hidden="true" className="h-4 w-4 text-pine" />
                ) : (
                  <Clipboard aria-hidden="true" className="h-4 w-4" />
                )
              }
              onClick={() =>
                void copy(managementUrl).then((success) => {
                  if (!success) toast.error('Kopiranje nije uspjelo. Označite link ručno.')
                })
              }
            >
              {copied ? 'Kopirano' : 'Kopiraj link'}
            </Button>
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <a href={managementUrl} className={buttonClassName('primary', 'md')}>
              Upravljaj terminom
              <ExternalLink aria-hidden="true" className="h-4 w-4" />
            </a>
            <a
              href={`/rezervacija/${data.salonSlug}`}
              className={buttonClassName('secondary', 'md')}
            >
              Nova rezervacija
            </a>
          </div>
        </div>

        <div className="border-t border-line bg-paper/70 px-5 py-4 text-xs leading-relaxed text-muted sm:px-7">
          <p>
            {data.salonName} · {data.salonAddress}, {data.salonCity} · {data.salonPhone}
          </p>
          <p className="mt-1">
            Ovo je demo potvrda. Podaci su izmišljeni i ne predstavljaju stvarnu rezervaciju.
          </p>
        </div>
      </article>

      <div className="mt-6 flex flex-wrap gap-2">
        <a href="/" className={buttonClassName('secondary')}>
          Demo početna
        </a>
      </div>
    </div>
  )
}

function InvalidManagementLink() {
  return (
    <div className="mx-auto max-w-xl py-8">
      <p className="text-sm font-medium text-danger">Link nije važeći</p>
      <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-ink">
        Nedostaje privatni link.
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Za upravljanje terminom potreban je privatni link koji ste dobili nakon rezervacije. Ako ste
        ga izgubili, kontaktirajte salon.
      </p>
      <div className="mt-6">
        <a href="/" className={buttonClassName('primary')}>
          Demo početna
        </a>
      </div>
    </div>
  )
}
