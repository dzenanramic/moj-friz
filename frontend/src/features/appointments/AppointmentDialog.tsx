import { zodResolver } from '@hookform/resolvers/zod'
import { Check, CircleSlash, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'

import { DateSelectField } from '@/components/date-strip/DateSelectField'
import { Skeleton } from '@/components/ui/Layout'
import { Button } from '@/components/ui/Button'
import { StatusPill } from '@/components/ui/Badges'
import { FormError, SelectField, TextField, TextareaField } from '@/components/ui/form'
import { ConfirmDialog, Modal } from '@/components/ui/Modal'
import { gatewayErrorMessage } from '@/data/gateway'
import {
  useCancelAppointment,
  useCreateAppointment,
  useHairdressers,
  useOwnerAvailability,
  useServices,
  useSetAppointmentStatus,
  useUpdateAppointment,
} from '@/data/queries'
import type { AppointmentDraft, AppointmentView } from '@/data/types'
import { cn } from '@/lib/cn'
import { formatDuration, formatKM } from '@/lib/format'
import {
  dateKeyFromInstant,
  formatDateKey,
  formatTime,
  formatTimeRange,
  todayDateKey,
} from '@/lib/time'
import { appointmentFormSchema, type AppointmentFormValues } from '@/lib/validation'

interface AppointmentDefaults {
  dateKey?: string
  time?: string
  hairdresserId?: string
}

interface AppointmentDialogProps {
  mode: 'create' | 'edit'
  appointment?: AppointmentView
  defaults?: AppointmentDefaults
  onClose: () => void
}

function timeValueFromInstant(instant: string): string {
  return formatTime(instant)
}

export function AppointmentDialog({
  mode,
  appointment,
  defaults,
  onClose,
}: AppointmentDialogProps) {
  const hairdressers = useHairdressers()
  const services = useServices()
  const createAppointment = useCreateAppointment()
  const updateAppointment = useUpdateAppointment()
  const cancelAppointment = useCancelAppointment()
  const setStatus = useSetAppointmentStatus()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [confirmCancel, setConfirmCancel] = useState(false)
  // Editing keeps the appointment's client unless the owner deliberately types a new name.
  const [keepCurrentClient, setKeepCurrentClient] = useState(Boolean(appointment))

  const firstHairdresserId =
    defaults?.hairdresserId ??
    appointment?.hairdresserId ??
    hairdressers.data?.find((hairdresser) => hairdresser.isActive)?.id ??
    ''

  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      hairdresserId: firstHairdresserId,
      serviceId: appointment?.serviceId ?? '',
      clientId: appointment?.clientId,
      newClientName: appointment?.clientName ?? '',
      newClientPhone: appointment?.clientPhone ?? '',
      dateKey: appointment
        ? dateKeyFromInstant(appointment.startsAt)
        : (defaults?.dateKey ?? todayDateKey()),
      time: appointment ? timeValueFromInstant(appointment.startsAt) : (defaults?.time ?? ''),
      internalNote: appointment?.internalNote ?? '',
    },
  })

  const { getValues, setValue, clearErrors, register, formState } = form
  const errors = formState.errors
  const hairdresserId = useWatch({ control: form.control, name: 'hairdresserId' })
  const serviceId = useWatch({ control: form.control, name: 'serviceId' })
  const dateKey = useWatch({ control: form.control, name: 'dateKey' })
  const time = useWatch({ control: form.control, name: 'time' })

  const activeHairdressers = useMemo(
    () => (hairdressers.data ?? []).filter((hairdresser) => hairdresser.isActive),
    [hairdressers.data],
  )
  const selectedHairdresser = hairdressers.data?.find(
    (hairdresser) => hairdresser.id === hairdresserId,
  )
  const offeredServices = useMemo(
    () =>
      (services.data ?? []).filter(
        (service) => service.isActive && selectedHairdresser?.serviceIds.includes(service.id),
      ),
    [services.data, selectedHairdresser],
  )
  const selectedService = offeredServices.find((service) => service.id === serviceId)

  useEffect(() => {
    if (!getValues('hairdresserId') && activeHairdressers[0]) {
      setValue('hairdresserId', activeHairdressers[0].id)
    }
  }, [activeHairdressers, getValues, setValue])

  useEffect(() => {
    if (!selectedHairdresser) return
    const offered = (services.data ?? []).filter(
      (service) => service.isActive && selectedHairdresser.serviceIds.includes(service.id),
    )
    if (offered.length === 0) return
    const current = getValues('serviceId')
    if (!offered.some((service) => service.id === current)) {
      setValue('serviceId', offered[0]!.id)
    }
  }, [selectedHairdresser, services.data, getValues, setValue])

  const today = todayDateKey()
  const availabilityQuery =
    hairdresserId && serviceId && dateKey
      ? {
          hairdresserId,
          serviceId,
          dateKey,
          excludeAppointmentId: appointment?.id,
        }
      : null
  const availability = useOwnerAvailability(availabilityQuery)

  const availableTimes = useMemo(
    () => (availability.data?.slots ?? []).map((slot) => timeValueFromInstant(slot.startsAt)),
    [availability.data],
  )

  // The times belong to the day they were fetched for. A slow answer for a day the owner has
  // already left must not overwrite the time of the day now on screen.
  useEffect(() => {
    if (mode !== 'create' || !availability.data) return
    if (availability.data.dateKey !== getValues('dateKey')) return
    const current = getValues('time')
    if (current && availableTimes.includes(current)) return
    setValue('time', availableTimes[0] ?? '', { shouldValidate: false })
  }, [availableTimes, availability.data, mode, getValues, setValue])

  const close = () => {
    if (mode === 'edit' && appointment) {
      setSubmitError(null)
    }
    onClose()
  }

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null)
    const clientTyped =
      values.newClientName !== (appointment?.clientName ?? '') ||
      values.newClientPhone !== (appointment?.clientPhone ?? '')
    const clientId = keepCurrentClient && !clientTyped ? values.clientId : undefined
    const draft: AppointmentDraft = {
      hairdresserId: values.hairdresserId,
      serviceId: values.serviceId,
      clientId,
      newClientName: clientId ? undefined : values.newClientName,
      newClientPhone: clientId ? undefined : values.newClientPhone,
      dateKey: values.dateKey,
      time: values.time,
      internalNote: values.internalNote,
    }

    try {
      if (mode === 'edit' && appointment) {
        await updateAppointment.mutateAsync({ id: appointment.id, draft })
        toast.success('Termin je sačuvan.')
        onClose()
      } else {
        await createAppointment.mutateAsync(draft)
        toast.success('Termin je dodan.')
        onClose()
      }
    } catch (error) {
      setSubmitError(gatewayErrorMessage(error))
    }
  })

  const pending = createAppointment.isPending || updateAppointment.isPending
  const actionPending = cancelAppointment.isPending || setStatus.isPending
  const timeIsAvailable = availableTimes.includes(time)
  const showTimeWarning = Boolean(time) && availability.isSuccess && !timeIsAvailable

  const complete = () => {
    if (!appointment) return
    setStatus.mutate(
      { id: appointment.id, status: 'completed' },
      {
        onSuccess: () => {
          toast.success('Termin je označen kao završen.')
          onClose()
        },
        onError: (error) => toast.error(gatewayErrorMessage(error)),
      },
    )
  }

  const noShow = () => {
    if (!appointment) return
    setStatus.mutate(
      { id: appointment.id, status: 'no_show' },
      {
        onSuccess: () => {
          toast.success('Termin je označen kao nedolazak.')
          onClose()
        },
        onError: (error) => toast.error(gatewayErrorMessage(error)),
      },
    )
  }

  if (mode === 'edit' && appointment && appointment.status !== 'confirmed') {
    return <ReadOnlyAppointmentDialog appointment={appointment} onClose={onClose} />
  }

  return (
    <>
      <Modal
        open
        onOpenChange={(open) => {
          if (!open) close()
        }}
        title={mode === 'edit' ? 'Uredi termin' : 'Novi termin'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={close} disabled={pending}>
              Odustani
            </Button>
            {/* The one copper action on the screen: add or save, then the sheet closes. */}
            <Button
              variant="accent"
              type="submit"
              form="appointment-form"
              loading={pending}
              disabled={!hairdresserId || !serviceId}
            >
              {mode === 'edit' ? 'Sačuvaj izmjene' : 'Dodaj termin'}
            </Button>
          </>
        }
      >
        <form id="appointment-form" onSubmit={onSubmit} className="space-y-5" noValidate>
          {submitError ? <FormError>{submitError}</FormError> : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Ime i prezime"
              id="appointment-client-name"
              autoComplete="off"
              placeholder="npr. Ana Marković"
              error={errors.newClientName?.message}
              {...register('newClientName', {
                onChange: () => {
                  setKeepCurrentClient(false)
                  clearErrors('clientId')
                },
              })}
            />
            <TextField
              label="Broj telefona"
              id="appointment-client-phone"
              type="tel"
              inputMode="tel"
              autoComplete="off"
              placeholder="npr. 061 000 001"
              error={errors.newClientPhone?.message}
              {...register('newClientPhone', {
                onChange: () => {
                  setKeepCurrentClient(false)
                  clearErrors('clientId')
                },
              })}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Frizer"
              id="appointment-hairdresser"
              value={hairdresserId}
              error={errors.hairdresserId?.message}
              {...register('hairdresserId')}
            >
              <option value="">Izaberite frizera</option>
              {activeHairdressers.map((hairdresser) => (
                <option key={hairdresser.id} value={hairdresser.id}>
                  {hairdresser.displayName}
                </option>
              ))}
            </SelectField>

            <SelectField
              label="Usluga"
              id="appointment-service"
              value={serviceId}
              error={errors.serviceId?.message}
              {...register('serviceId')}
            >
              <option value="">Izaberite uslugu</option>
              {offeredServices.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name} · {formatDuration(service.durationMinutes)} ·{' '}
                  {formatKM(service.priceMinor)}
                </option>
              ))}
            </SelectField>
          </div>

          <DateSelectField
            label="Datum"
            id="appointment-date"
            value={dateKey ?? ''}
            onChange={(next) => setValue('dateKey', next, { shouldValidate: true })}
            startDateKey={today}
            error={errors.dateKey?.message}
            hint={
              selectedService
                ? `Trajanje usluge: ${formatDuration(selectedService.durationMinutes)}`
                : undefined
            }
          />

          <fieldset>
            <legend className="text-sm font-medium text-ink">Vrijeme</legend>
            <div className="mt-2 rounded-md bg-paper p-3">
              {!hairdresserId || !serviceId || !dateKey ? (
                <p className="text-sm text-muted">Izaberite frizera, uslugu i datum.</p>
              ) : availability.isPending ? (
                <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <Skeleton key={index} className="h-9 w-full" />
                  ))}
                </div>
              ) : availability.isError ? (
                <p className="text-sm text-danger">{gatewayErrorMessage(availability.error)}</p>
              ) : availability.data?.isClosed ? (
                <p className="text-sm text-muted">
                  Izabrani frizer ne radi tog dana. Izaberite drugi datum.
                </p>
              ) : availability.data && availability.data.slots.length > 0 ? (
                <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6">
                  {availability.data.slots.map((slot) => {
                    const slotTime = timeValueFromInstant(slot.startsAt)
                    const active = slotTime === time
                    return (
                      <button
                        key={slot.startsAt}
                        type="button"
                        aria-pressed={active}
                        onClick={() => {
                          setValue('time', slotTime, { shouldValidate: true })
                        }}
                        className={cn(
                          'tabular min-h-9 rounded-sm px-1 text-sm font-medium transition-colors',
                          active
                            ? 'bg-primary text-on-primary'
                            : 'bg-surface text-ink hover:bg-primary-tint',
                        )}
                      >
                        {slotTime}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted">
                  Nema slobodnih termina za izabrani dan. Izaberite drugi datum ili pauzu.
                </p>
              )}
              {showTimeWarning ? (
                <p className="mt-2 text-xs font-medium text-accent-ui">
                  Izabrano vrijeme nije među slobodnim terminima. Provjerite raspored.
                </p>
              ) : null}
              {errors.time?.message ? (
                <p className="mt-2 text-sm font-medium text-danger">{errors.time.message}</p>
              ) : null}
            </div>
          </fieldset>

          <TextareaField
            label="Interna napomena"
            id="appointment-note"
            optional
            placeholder="Npr. dolazi s djetetom, preferira tiši dio salona…"
            error={errors.internalNote?.message}
            {...register('internalNote')}
          />

          {mode === 'edit' && appointment ? (
            <div>
              <p className="text-sm font-medium text-ink">Brze radnje</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  leftIcon={<Check aria-hidden="true" className="h-3.5 w-3.5" />}
                  onClick={complete}
                  disabled={actionPending}
                >
                  Označi završen
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  leftIcon={<CircleSlash aria-hidden="true" className="h-3.5 w-3.5" />}
                  onClick={noShow}
                  disabled={actionPending}
                >
                  Nedolazak
                </Button>
                <Button
                  type="button"
                  variant="danger-ghost"
                  size="sm"
                  leftIcon={<X aria-hidden="true" className="h-3.5 w-3.5" />}
                  onClick={() => setConfirmCancel(true)}
                  disabled={actionPending}
                >
                  Otkaži termin
                </Button>
              </div>
            </div>
          ) : null}
        </form>
      </Modal>

      {mode === 'edit' && appointment ? (
        <ConfirmDialog
          open={confirmCancel}
          onOpenChange={setConfirmCancel}
          title="Otkazati termin?"
          description={`Termin ${appointment.clientName} (${formatTime(appointment.startsAt)}) biće otkazan, a vrijeme ponovo slobodno. Radnja se ne može poništiti.`}
          confirmLabel="Otkaži termin"
          pending={cancelAppointment.isPending}
          onConfirm={() => {
            cancelAppointment.mutate(appointment.id, {
              onSuccess: () => {
                toast.success('Termin je otkazan.')
                onClose()
              },
              onError: (error) => toast.error(gatewayErrorMessage(error)),
            })
          }}
        />
      ) : null}
    </>
  )
}

function ReadOnlyAppointmentDialog({
  appointment,
  onClose,
}: {
  appointment: AppointmentView
  onClose: () => void
}) {
  const title =
    appointment.status === 'cancelled'
      ? 'Otkazani termin'
      : appointment.status === 'no_show'
        ? 'Nedolazak'
        : 'Završen termin'

  return (
    <Modal
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      title={title}
      description="Ovaj termin je zaključen i više se ne može uređivati."
      size="md"
      footer={
        <Button variant="secondary" onClick={onClose}>
          Zatvori
        </Button>
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
        <div>
          <p className="text-sm font-semibold text-ink">{appointment.clientName}</p>
          <p className="mt-0.5 text-xs text-muted">{appointment.clientPhone}</p>
        </div>
        <StatusPill status={appointment.status} />
      </div>
      <dl className="mt-1 grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-xs text-muted">Datum</dt>
          <dd className="mt-0.5 text-sm font-medium text-ink">
            {formatDateKey(dateKeyFromInstant(appointment.startsAt))}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Vrijeme</dt>
          <dd className="mt-0.5 text-sm font-medium text-ink">
            {formatTimeRange(appointment.startsAt, appointment.endsAt)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Usluga</dt>
          <dd className="mt-0.5 text-sm font-medium text-ink">
            {appointment.serviceName} · {formatDuration(appointment.durationMinutesSnapshot)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Frizer</dt>
          <dd className="mt-0.5 text-sm font-medium text-ink">{appointment.hairdresserName}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Cijena</dt>
          <dd className="mt-0.5 text-sm font-medium text-ink">
            {formatKM(appointment.priceMinorSnapshot)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Izvor</dt>
          <dd className="mt-0.5 text-sm font-medium text-ink">
            {appointment.source === 'online' ? 'Online rezervacija' : 'Ručni unos'}
          </dd>
        </div>
      </dl>
      {appointment.internalNote ? (
        <div className="mt-4 rounded-md bg-paper p-3">
          <p className="text-xs text-muted">Interna napomena</p>
          <p className="mt-1 text-sm leading-relaxed text-ink">{appointment.internalNote}</p>
        </div>
      ) : null}
    </Modal>
  )
}
