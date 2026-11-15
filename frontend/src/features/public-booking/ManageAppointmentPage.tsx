import { CalendarClock, Phone } from 'lucide-react'
import { useState } from 'react'
import { useLocation } from 'react-router'
import { toast } from 'sonner'

import { StatusPill } from '@/components/ui/Badges'
import { Button, buttonClassName } from '@/components/ui/Button'
import { Skeleton, Surface } from '@/components/ui/Layout'
import { FormError } from '@/components/ui/form'
import { ConfirmDialog } from '@/components/ui/Modal'
import { gatewayErrorMessage } from '@/data/gateway'
import {
  useCancelManaged,
  useManagementAppointment,
  usePublicAvailability,
  useRescheduleManaged,
} from '@/data/queries'
import { readTokenFromFragment } from '@/demo/token'
import { formatKM } from '@/lib/format'
import { usePageTitle } from '@/lib/hooks'
import { publicDateWindow } from '@/lib/scheduling'
import {
  dateKeyFromInstant,
  formatDateKey,
  formatDateLong,
  formatTime,
  formatTimeRange,
  todayDateKey,
} from '@/lib/time'

import { DateStrip } from './DateStrip'
import { SlotPicker } from './SlotPicker'

const DEMO_SALON_PHONE = '051 000 000'

export function ManageAppointmentPage() {
  usePageTitle('Upravljanje terminom')
  const location = useLocation()
  const token = readTokenFromFragment(location.hash)
  const appointment = useManagementAppointment(token)
  const reschedule = useRescheduleManaged(token ?? '')
  const cancel = useCancelManaged(token ?? '')
  const [editing, setEditing] = useState(false)
  const [dateKey, setDateKey] = useState(todayDateKey())
  const [newStartsAt, setNewStartsAt] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [confirmCancel, setConfirmCancel] = useState(false)

  const availabilityQuery =
    editing && appointment.data
      ? {
          slug: appointment.data.salonSlug,
          serviceId: appointment.data.serviceId,
          hairdresserId: appointment.data.hairdresserId,
          dateKey,
        }
      : null
  const availability = usePublicAvailability(availabilityQuery)

  if (!token) return <ManagementLinkError />

  if (appointment.isPending) {
    return (
      <div className="mx-auto max-w-2xl space-y-3">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[300px] w-full rounded-xl" />
      </div>
    )
  }

  if (appointment.isError || !appointment.data) {
    return <ManagementLinkError expired phone={appointment.data?.salonPhone} />
  }

  const data = appointment.data
  const dates = publicDateWindow(todayDateKey(), data.bookingHorizonDays)
  const isCancelled = data.status === 'cancelled'
  const isClosed = data.status === 'completed' || data.status === 'no_show'
  const hasActions = data.canCancel || data.canReschedule
  const callHref = `tel:${data.salonPhone.replace(/\s+/g, '')}`

  const startEditing = () => {
    setDateKey(dateKeyFromInstant(data.startsAt))
    setNewStartsAt(null)
    setActionError(null)
    setEditing(true)
  }

  const closeEditing = () => {
    setEditing(false)
    setNewStartsAt(null)
    setActionError(null)
  }

  const submitReschedule = () => {
    if (!newStartsAt) return
    setActionError(null)
    reschedule.mutate(newStartsAt, {
      onSuccess: () => {
        toast.success('Termin je pomjeren.')
        setEditing(false)
        setNewStartsAt(null)
      },
      onError: (error) => {
        setActionError(gatewayErrorMessage(error))
      },
    })
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-ink">Upravljanje terminom</h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
        Ovo je jedini termin na koji ovaj link daje pristup. Ne prikazujemo podatke drugih klijenata
        niti interne napomene salona.
      </p>

      <Surface className="mt-7 overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-3 px-6 py-6 sm:px-8">
          <div>
            <p className="text-lg font-semibold text-ink">{data.salonName}</p>
            <p className="mt-0.5 text-sm text-muted">
              {data.salonAddress}, {data.salonCity}
            </p>
          </div>
          <StatusPill status={data.status} />
        </div>

        <dl className="grid gap-x-8 gap-y-4 px-6 pb-6 text-sm sm:grid-cols-2 sm:px-8">
          <div>
            <dt className="text-xs text-muted">Datum</dt>
            <dd className="mt-0.5 font-medium text-ink">
              {formatDateLong(dateKeyFromInstant(data.startsAt))}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Vrijeme</dt>
            <dd className="tabular mt-0.5 text-base font-semibold text-ink">
              {formatTimeRange(data.startsAt, data.endsAt)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Usluga</dt>
            <dd className="mt-0.5 font-medium text-ink">{data.serviceName}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Frizer</dt>
            <dd className="mt-0.5 font-medium text-ink">{data.hairdresserName}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Cijena</dt>
            <dd className="tabular mt-0.5 font-medium text-ink">{formatKM(data.priceMinor)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Salon</dt>
            <dd className="mt-0.5 font-medium text-ink">
              <a
                href={callHref}
                className="inline-flex min-h-11 items-center gap-1.5 underline decoration-line underline-offset-4 hover:text-primary"
              >
                <Phone aria-hidden="true" className="h-3.5 w-3.5" />
                {data.salonPhone}
              </a>
            </dd>
          </div>
        </dl>

        {isCancelled ? (
          <p className="bg-paper px-6 py-4 text-sm leading-relaxed text-muted sm:px-8">
            Termin je otkazan. Ako želite novi termin, otvorite javnu stranicu salona.
          </p>
        ) : isClosed ? (
          <p className="bg-paper px-6 py-4 text-sm leading-relaxed text-muted sm:px-8">
            Ovaj termin je završen i više se ne može mijenjati.
          </p>
        ) : hasActions ? (
          <div className="bg-paper px-6 py-5 sm:px-8">
            {!editing ? (
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  leftIcon={<CalendarClock aria-hidden="true" className="h-4 w-4" />}
                  onClick={startEditing}
                >
                  Promijeni termin
                </Button>
                <Button variant="danger-ghost" onClick={() => setConfirmCancel(true)}>
                  Otkaži termin
                </Button>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-ink">Izaberite novi termin</h2>
                    <p className="mt-1 text-sm text-muted">
                      Promjena je moguća do {data.rescheduleCutoffMinutes / 60} sata prije termina.
                    </p>
                  </div>
                  <Button variant="quiet" size="sm" onClick={closeEditing}>
                    Odustani
                  </Button>
                </div>

                <DateStrip
                  dates={dates}
                  selected={dateKey}
                  onSelect={(nextDateKey) => {
                    setDateKey(nextDateKey)
                    setNewStartsAt(null)
                    setActionError(null)
                  }}
                />

                {actionError ? <FormError>{actionError}</FormError> : null}

                <SlotPicker
                  availability={availability.data}
                  selected={newStartsAt ?? undefined}
                  onSelect={setNewStartsAt}
                  dateKey={dateKey}
                  isPending={availability.isPending}
                  error={availability.error}
                />

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <Button
                    variant="accent"
                    onClick={submitReschedule}
                    disabled={!newStartsAt}
                    loading={reschedule.isPending}
                  >
                    Potvrdi promjenu
                  </Button>
                  {newStartsAt ? (
                    <span className="tabular text-xs text-muted">
                      Novo: {formatDateKey(dateKey)} u {formatTime(newStartsAt)}
                    </span>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="bg-paper px-6 py-4 text-sm leading-relaxed text-muted sm:px-8">
            Izmjene su zatvorene {data.cancellationCutoffMinutes / 60} sata prije termina. Za hitne
            promjene pozovite salon na{' '}
            <a
              href={callHref}
              className="inline-flex min-h-11 items-center gap-1.5 font-medium text-primary underline underline-offset-4"
            >
              <Phone aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
              {data.salonPhone}
            </a>
            .
          </p>
        )}
      </Surface>

      <p className="mt-4 text-xs leading-relaxed text-muted">
        Privatni link važi do {formatDateKey(dateKeyFromInstant(data.managementExpiresAt))}. Nismo
        poslali SMS ni e-mail. Link ne dokazuje vlasništvo broja telefona; čuvajte ga kao privatni
        podatak.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        <a href={`/rezervacija/${data.salonSlug}`} className={buttonClassName('secondary')}>
          Javna stranica salona
        </a>
        <a href="/" className={buttonClassName('quiet')}>
          Demo početna
        </a>
      </div>

      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title="Otkazati termin?"
        description={`Termin ${formatDateKey(dateKeyFromInstant(data.startsAt))} u ${formatTimeRange(
          data.startsAt,
          data.endsAt,
        )} biće otkazan. Ovo se ne može poništiti.`}
        confirmLabel="Da, otkaži termin"
        cancelLabel="Zadrži termin"
        pending={cancel.isPending}
        onConfirm={() => {
          cancel.mutate(undefined, {
            onSuccess: () => toast.success('Termin je otkazan.'),
            onError: (error) => toast.error(gatewayErrorMessage(error)),
          })
        }}
      />
    </div>
  )
}

function ManagementLinkError({ expired = false, phone }: { expired?: boolean; phone?: string }) {
  return (
    <div className="mx-auto max-w-xl py-8">
      <h1 className="text-ink">
        {expired ? 'Link nije važeći ili je istekao' : 'Nedostaje privatni link'}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Ako ste rezervisali termin, koristite link koji ste sačuvali nakon potvrde. Za novi link ili
        izmjenu kontaktirajte salon telefonom.
      </p>
      <div className="mt-4">
        <SalonCallLink phone={phone} />
      </div>
      <div className="mt-4">
        <a href="/" className={buttonClassName('primary')}>
          Demo početna
        </a>
      </div>
    </div>
  )
}

function SalonCallLink({ phone }: { phone?: string }) {
  const number = phone?.trim() || DEMO_SALON_PHONE

  return (
    <a
      href={`tel:${number.replace(/\s+/g, '')}`}
      className="inline-flex min-h-11 items-center gap-1.5 font-medium text-primary underline underline-offset-4 hover:text-primary-hover"
    >
      <Phone aria-hidden="true" className="h-4 w-4 shrink-0" />
      Pozovi salon <span className="tabular whitespace-nowrap">{number}</span>
    </a>
  )
}
