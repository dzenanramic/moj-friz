import { zodResolver } from '@hookform/resolvers/zod'
import { Check, CircleSlash, Search, UserPlus, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'

import { Avatar, Skeleton } from '@/components/ui/Layout'
import { Button } from '@/components/ui/Button'
import { StatusPill } from '@/components/ui/Badges'
import { FormError, Input, SelectField, TextField, TextareaField } from '@/components/ui/form'
import { ConfirmDialog, Modal } from '@/components/ui/Modal'
import { gatewayErrorMessage } from '@/data/gateway'
import {
  useCancelAppointment,
  useClients,
  useCreateAppointment,
  useHairdressers,
  useOwnerAvailability,
  useServices,
  useSetAppointmentStatus,
  useUpdateAppointment,
} from '@/data/queries'
import type { AppointmentDraft, AppointmentView, Client } from '@/data/types'
import { cn } from '@/lib/cn'
import { formatDuration, formatKM } from '@/lib/format'
import { useDebouncedValue } from '@/lib/hooks'
import {
  addDaysToDateKey,
  dateKeyFromInstant,
  capitalizeFirst,
  formatDateKey,
  formatTime,
  formatTimeRange,
  formatWeekday,
  rangeDateKeys,
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

interface SelectedClient {
  id: string
  name: string
  phone: string
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
  const [selectedClient, setSelectedClient] = useState<SelectedClient | null>(
    appointment
      ? {
          id: appointment.clientId,
          name: appointment.clientName,
          phone: appointment.clientPhone,
        }
      : null,
  )
  const [isNewClient, setIsNewClient] = useState(false)
  const [clientSearch, setClientSearch] = useState('')
  /** 'create' adds a term; 'close' only checks and closes while the owner keeps booking. */
  const [submitIntent, setSubmitIntent] = useState<'create' | 'close'>('create')
  const debouncedSearch = useDebouncedValue(clientSearch, 180)
  const clients = useClients(debouncedSearch, 1, 6)

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
      newClientName: '',
      newClientPhone: '',
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
  const dateOptions = useMemo(() => rangeDateKeys(today, addDaysToDateKey(today, 90)), [today])
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

  useEffect(() => {
    if (mode !== 'create' || !availability.data) return
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
    const draft: AppointmentDraft = {
      hairdresserId: values.hairdresserId,
      serviceId: values.serviceId,
      clientId: values.clientId,
      newClientName: values.clientId ? undefined : values.newClientName,
      newClientPhone: values.clientId ? undefined : values.newClientPhone,
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
        if (submitIntent === 'close') {
          onClose()
          return
        }
        // Adding booking after booking: the client and time reset, the schedule stays put.
        setSelectedClient(null)
        setIsNewClient(false)
        setClientSearch('')
        setValue('clientId', undefined)
        setValue('newClientName', '')
        setValue('newClientPhone', '')
        setValue('internalNote', '')
        setSubmitError(null)
      }
    } catch (error) {
      setSubmitError(gatewayErrorMessage(error))
    }
  })

  const chooseClient = (client: Client) => {
    setSelectedClient({ id: client.id, name: client.name, phone: client.phoneOriginal })
    setIsNewClient(false)
    setClientSearch('')
    setValue('clientId', client.id, { shouldValidate: true })
    setValue('newClientName', '')
    setValue('newClientPhone', '')
    clearErrors(['newClientName', 'newClientPhone'])
  }

  const startNewClient = () => {
    setSelectedClient(null)
    setIsNewClient(true)
    setValue('clientId', undefined)
    clearErrors(['clientId', 'newClientName', 'newClientPhone'])
  }

  const chooseExisting = () => {
    setIsNewClient(false)
    setValue('clientId', undefined)
    setValue('newClientName', '')
    setValue('newClientPhone', '')
    setSelectedClient(null)
    clearErrors(['newClientName', 'newClientPhone'])
  }

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
        description={
          mode === 'edit' && appointment ? (
            <span className="inline-flex flex-wrap items-center gap-2">
              <StatusPill status={appointment.status} />
              <span>
                {appointment.clientName} · {formatDateKey(dateKeyFromInstant(appointment.startsAt))}
              </span>
            </span>
          ) : (
            'Brzi unos termina za salonski raspored.'
          )
        }
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={close} disabled={pending}>
              Odustani
            </Button>
            {mode === 'create' ? (
              <Button
                type="submit"
                form="appointment-form"
                variant="secondary"
                loading={pending}
                disabled={!hairdresserId || !serviceId}
                onClick={() => setSubmitIntent('close')}
              >
                Dodaj i zatvori
              </Button>
            ) : null}
            {/* The one copper action on the screen: the commit. */}
            <Button
              variant="accent"
              type="submit"
              form="appointment-form"
              loading={pending}
              disabled={!hairdresserId || !serviceId}
              onClick={() => setSubmitIntent('create')}
            >
              {mode === 'edit' ? 'Sačuvaj izmjene' : 'Dodaj termin'}
            </Button>
          </>
        }
      >
        <form id="appointment-form" onSubmit={onSubmit} className="space-y-5" noValidate>
          {submitError ? <FormError>{submitError}</FormError> : null}

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-ink">Klijent</p>
              <span className="text-xs text-muted">Pretražite po imenu ili telefonu</span>
            </div>

            {selectedClient ? (
              <div className="flex flex-wrap items-center gap-3 rounded-md bg-paper px-3 py-2.5">
                <Avatar name={selectedClient.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{selectedClient.name}</p>
                  <p className="mt-0.5 text-xs text-muted">{selectedClient.phone}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedClient(null)
                    setValue('clientId', undefined)
                    clearErrors('newClientName')
                  }}
                >
                  Promijeni
                </Button>
              </div>
            ) : isNewClient ? (
              <div className="space-y-3 rounded-md bg-paper p-3.5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <TextField
                    label="Ime i prezime"
                    id="new-client-name"
                    autoComplete="off"
                    placeholder="npr. Ana Marković"
                    error={errors.newClientName?.message}
                    {...register('newClientName')}
                  />
                  <TextField
                    label="Telefon"
                    id="new-client-phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="off"
                    placeholder="npr. 061 000 001"
                    error={errors.newClientPhone?.message}
                    {...register('newClientPhone')}
                  />
                </div>
                <Button type="button" variant="quiet" size="sm" onClick={chooseExisting}>
                  Izaberi postojećeg klijenta
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                  />
                  <Input
                    type="search"
                    className="pl-9"
                    placeholder="Ime ili telefon klijenta"
                    aria-label="Pretraži klijente"
                    value={clientSearch}
                    onChange={(event) => setClientSearch(event.target.value)}
                  />
                </div>
                <div className="rounded-md bg-paper p-1.5">
                  {clients.isPending ? (
                    <div className="space-y-1.5 p-2">
                      <Skeleton className="h-9 w-full" />
                      <Skeleton className="h-9 w-full" />
                    </div>
                  ) : clients.data && clients.data.items.length > 0 ? (
                    <ul className="max-h-44 space-y-0.5 overflow-y-auto">
                      {clients.data.items.map((client) => (
                        <li key={client.id}>
                          <button
                            type="button"
                            onClick={() => chooseClient(client)}
                            className="flex min-h-10 w-full items-center gap-2.5 rounded-sm px-2.5 py-1.5 text-left transition-colors hover:bg-surface"
                          >
                            <Avatar name={client.name} size="sm" />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium text-ink">
                                {client.name}
                              </span>
                              <span className="block text-xs text-muted">
                                {client.phoneOriginal}
                              </span>
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="px-2.5 py-2 text-sm text-muted">
                      Nema rezultata za „{debouncedSearch}“.
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={startNewClient}
                    className="flex min-h-10 w-full items-center gap-2 rounded-sm px-2.5 py-2 text-sm font-medium text-primary transition-colors hover:bg-surface"
                  >
                    <UserPlus aria-hidden="true" className="h-4 w-4" />
                    Novi klijent
                  </button>
                </div>
              </div>
            )}
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

          <SelectField
            label="Datum"
            id="appointment-date"
            error={errors.dateKey?.message}
            hint={
              selectedService
                ? `Trajanje usluge: ${formatDuration(selectedService.durationMinutes)}`
                : undefined
            }
            {...register('dateKey')}
          >
            {dateOptions.map((option) => (
              <option key={option} value={option}>
                {dateOptionLabel(option, today)}
              </option>
            ))}
          </SelectField>

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
            hint="Vidljivo samo salonu. Ne unosite zdravstvene ili druge osjetljive podatke."
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

function dateOptionLabel(dateKey: string, today: string): string {
  if (dateKey === today) return `Danas — ${formatDateKey(dateKey)}`
  if (dateKey === addDaysToDateKey(today, 1)) return `Sutra — ${formatDateKey(dateKey)}`
  return `${capitalizeFirst(formatWeekday(dateKey))}, ${formatDateKey(dateKey)}`
}
