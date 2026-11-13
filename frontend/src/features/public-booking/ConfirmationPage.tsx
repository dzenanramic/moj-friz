import { Check, Clipboard, ExternalLink } from 'lucide-react'
import { useLocation } from 'react-router'
import { toast } from 'sonner'

import { StatusIndicator } from '@/components/ui/Badges'
import { Button, buttonClassName } from '@/components/ui/Button'
import { ErrorState, Skeleton, Surface } from '@/components/ui/Layout'
import { useManagementAppointment } from '@/data/queries'
import { managementPath, readTokenFromFragment } from '@/demo/token'
import { formatKM } from '@/lib/format'
import { useCopyToClipboard, usePageTitle } from '@/lib/hooks'
import {
  capitalizeFirst,
  dateKeyFromInstant,
  formatDateKey,
  formatTimeRange,
  formatWeekday,
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
          title="Potvrda nije dostupna"
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
        <h1 className="text-ink">{isCancelled ? 'Termin je otkazan' : 'Vidimo se u salonu'}</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          {isCancelled
            ? 'Ovaj termin više nije aktivan. Možete otvoriti početnu stranu salona i rezervisati novi termin.'
            : 'Sačuvajte privatni link ispod. On je jedini način da promijenite ili otkažete termin bez poziva salonu.'}
        </p>
      </div>

      <Surface className="mt-8 overflow-hidden">
        <div className="px-6 py-6 sm:px-8 sm:py-7">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <p className="text-sm text-muted">{data.salonName}</p>
            <StatusIndicator status={data.status} />
          </div>

          <div className="mt-6 grid gap-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <div>
              <p className="text-sm text-muted">{capitalizeFirst(formatWeekday(dateKey))}</p>
              <p className="tabular mt-1 text-4xl leading-none font-semibold text-ink sm:text-5xl">
                {formatDateKey(dateKey)}
              </p>
              <p className="tabular mt-3 text-2xl font-semibold text-pine-strong">
                {formatTimeRange(data.startsAt, data.endsAt)}
              </p>
            </div>
            <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-1.5 text-sm sm:text-right">
              <dt className="text-muted">Usluga</dt>
              <dd className="font-medium text-ink">{data.serviceName}</dd>
              <dt className="text-muted">Frizer</dt>
              <dd className="font-medium text-ink">{data.hairdresserName}</dd>
              <dt className="text-muted">Cijena</dt>
              <dd className="tabular font-medium text-ink">{formatKM(data.priceMinor)}</dd>
            </dl>
          </div>
        </div>

        <div className="bg-pine-soft px-6 py-6 sm:px-8">
          <h2 className="text-base font-semibold text-pine-strong">Privatni link</h2>
          <p className="mt-2 max-w-[58ch] text-sm leading-relaxed text-ink">
            Nismo poslali SMS ni e-mail. Link važi do{' '}
            {formatDateKey(dateKeyFromInstant(data.managementExpiresAt))}. Ako ga izgubite,
            kontaktirajte salon telefonom.
          </p>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input
              readOnly
              value={managementUrl}
              aria-label="Privatni link za upravljanje terminom"
              onFocus={(event) => event.currentTarget.select()}
              className="min-h-11 w-full flex-1 rounded-md bg-surface px-3 py-2 text-xs text-muted"
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

        <div className="px-6 py-4 text-xs leading-relaxed text-muted sm:px-8">
          <p>
            {data.salonName} · {data.salonAddress}, {data.salonCity} · {data.salonPhone}
          </p>
          <p className="mt-1">
            Ovo je demo potvrda. Podaci su izmišljeni i ne predstavljaju stvarnu rezervaciju.
          </p>
        </div>
      </Surface>

      <div className="mt-6 flex flex-wrap gap-2">
        <a href="/" className={buttonClassName('quiet')}>
          Demo početna
        </a>
      </div>
    </div>
  )
}

function InvalidManagementLink() {
  return (
    <div className="mx-auto max-w-xl py-8">
      <h1 className="text-ink">Nedostaje privatni link</h1>
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
