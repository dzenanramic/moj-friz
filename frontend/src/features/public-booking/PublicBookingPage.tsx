import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, ChevronRight, Clock3, MapPin, Phone } from 'lucide-react'
import { useEffect, useRef, useState, type RefObject } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router'

import { Avatar, Panel, Skeleton } from '@/components/ui/Layout'
import { Button, ButtonLink } from '@/components/ui/Button'
import { CheckboxField, FormError, TextField } from '@/components/ui/form'
import { gatewayErrorMessage, isGatewayError } from '@/data/gateway'
import { useCreatePublicBooking, usePublicAvailability, usePublicCatalog } from '@/data/queries'
import type { PublicHairdresserView, PublicSalonCatalog, PublicServiceView } from '@/data/types'
import { formatDuration, formatKM } from '@/lib/format'
import { usePageTitle } from '@/lib/hooks'
import { capitalizeFirst, formatDateLong, formatTime, todayDateKey } from '@/lib/time'
import { publicBookingFormSchema, type PublicBookingFormValues } from '@/lib/validation'
import { confirmationPath } from '@/demo/token'
import { publicDateWindow } from '@/lib/scheduling'

import { DateStrip } from './DateStrip'
import { SlotPicker } from './SlotPicker'

const STEPS = ['Usluga', 'Frizer', 'Termin', 'Podaci'] as const

export function PublicBookingPage() {
  usePageTitle('Rezervacija termina')
  const { slug = '' } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const catalog = usePublicCatalog(slug)
  const [step, setStep] = useState(0)
  const [serviceId, setServiceId] = useState('')
  const [hairdresserId, setHairdresserId] = useState('')
  const [dateKey, setDateKey] = useState(todayDateKey())
  const [startsAt, setStartsAt] = useState<string | null>(null)
  const [bookingError, setBookingError] = useState<string | null>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const createBooking = useCreatePublicBooking()

  const form = useForm<PublicBookingFormValues>({
    resolver: zodResolver(publicBookingFormSchema),
    defaultValues: { name: '', phone: '', consent: false, website: '' },
  })

  const consent = useWatch({ control: form.control, name: 'consent' })
  const availabilityQuery =
    serviceId && hairdresserId && dateKey ? { slug, serviceId, hairdresserId, dateKey } : null
  const availability = usePublicAvailability(availabilityQuery)

  useEffect(() => {
    if (step > 0) headingRef.current?.focus({ preventScroll: true })
  }, [step])

  const services = catalog.data?.services ?? []
  const hairdressers = catalog.data?.hairdressers ?? []
  const selectedService = services.find((service) => service.id === serviceId)
  const eligibleHairdressers = hairdressers.filter((member) =>
    member.serviceIds.includes(serviceId),
  )
  const selectedHairdresser = hairdressers.find((member) => member.id === hairdresserId)
  const selectedSlot = availability.data?.slots.find((slot) => slot.startsAt === startsAt)
  const salon = catalog.data?.salon
  const dates = salon ? publicDateWindow(todayDateKey(), salon.bookingHorizonDays) : []

  if (catalog.isPending) {
    return <BookingSkeleton />
  }

  if (catalog.isError) {
    if (isGatewayError(catalog.error) && catalog.error.code === 'LEVEL_REQUIRED') {
      return <PublicLockedState />
    }
    if (isGatewayError(catalog.error) && catalog.error.code === 'NOT_FOUND') {
      return <PublicUnavailableState />
    }
    return (
      <div className="mx-auto max-w-xl">
        <h1 className="text-ink">Rezervacija trenutno nije dostupna</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {gatewayErrorMessage(catalog.error)}
        </p>
        <div className="mt-5 flex gap-2">
          <Button onClick={() => void catalog.refetch()}>Pokušaj ponovo</Button>
          <ButtonLink to="/" variant="secondary">
            Demo početna
          </ButtonLink>
        </div>
      </div>
    )
  }

  if (!catalog.data || !salon) return null

  const goBack = () => {
    setBookingError(null)
    setStep((current) => Math.max(0, current - 1))
  }

  const chooseService = (service: PublicServiceView) => {
    setServiceId(service.id)
    setHairdresserId('')
    setStartsAt(null)
    setBookingError(null)
    setStep(1)
  }

  const chooseHairdresser = (member: PublicHairdresserView) => {
    setHairdresserId(member.id)
    setStartsAt(null)
    setBookingError(null)
    setStep(2)
  }

  const chooseDate = (nextDateKey: string) => {
    setDateKey(nextDateKey)
    setStartsAt(null)
    setBookingError(null)
  }

  const chooseSlot = (nextStartsAt: string) => {
    setStartsAt(nextStartsAt)
    setBookingError(null)
    setStep(3)
  }

  const onSubmit = form.handleSubmit(async (values) => {
    if (!selectedService || !selectedHairdresser || !startsAt) {
      setBookingError('Izaberite uslugu, frizera i termin.')
      return
    }

    setBookingError(null)
    try {
      const result = await createBooking.mutateAsync({
        slug,
        serviceId: selectedService.id,
        hairdresserId: selectedHairdresser.id,
        startsAt,
        name: values.name,
        phone: values.phone,
        consent: values.consent,
        website: values.website,
      })
      navigate(confirmationPath(slug, result.managementToken))
    } catch (error) {
      const message = gatewayErrorMessage(error)
      setBookingError(message)
      if (
        isGatewayError(error) &&
        (error.code === 'SLOT_UNAVAILABLE' || error.code === 'CUTOFF_PASSED')
      ) {
        setStartsAt(null)
        setStep(2)
      }
    }
  })

  return (
    <div>
      <header className="pb-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-ink">{salon.name}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
              <span className="inline-flex items-center gap-1.5">
                <MapPin aria-hidden="true" className="h-4 w-4" />
                {salon.address}, {salon.city}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Phone aria-hidden="true" className="h-4 w-4" />
                {salon.phone}
              </span>
            </div>
          </div>
          <p className="text-sm text-muted">Rezervacija bez korisničkog naloga</p>
        </div>
      </header>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        <div className="min-w-0">
          <Stepper step={step} />

          <Panel className="mt-7 min-w-0 px-4 py-5 sm:px-7 sm:py-7">
            {step === 0 ? (
              <section aria-labelledby="booking-step-title">
                <StepTitle
                  id="booking-step-title"
                  headingRef={headingRef}
                  title="Izaberite uslugu"
                  description="Cijena i trajanje su isti za sve frizere."
                />
                <ul className="mt-3">
                  {services.map((service) => (
                    <li key={service.id}>
                      <button
                        type="button"
                        onClick={() => chooseService(service)}
                        className="group flex min-h-[60px] w-full items-center justify-between gap-4 rounded-sm px-3 py-3 text-left transition-colors hover:bg-paper"
                      >
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-ink">
                            {service.name}
                          </span>
                          <span className="tabular mt-0.5 block text-xs text-muted">
                            {formatDuration(service.durationMinutes)}
                          </span>
                        </span>
                        <span className="flex items-center gap-3">
                          <span className="tabular text-sm font-semibold text-ink">
                            {formatKM(service.priceMinor)}
                          </span>
                          <ChevronRight
                            aria-hidden="true"
                            className="h-4 w-4 text-line-strong transition-colors group-hover:text-pine"
                          />
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
                {services.length === 0 ? (
                  <p className="text-sm text-muted">Salon trenutno nema aktivnih usluga.</p>
                ) : null}
              </section>
            ) : null}

            {step === 1 ? (
              <section aria-labelledby="booking-step-title">
                <StepTitle
                  id="booking-step-title"
                  headingRef={headingRef}
                  title="Izaberite frizera"
                  description={`Usluga ${selectedService?.name ?? ''}`}
                />
                <ul className="mt-3">
                  {eligibleHairdressers.map((member) => (
                    <li key={member.id}>
                      <button
                        type="button"
                        onClick={() => chooseHairdresser(member)}
                        className="group flex min-h-[60px] w-full items-center gap-3 rounded-sm px-3 py-3 text-left transition-colors hover:bg-paper"
                      >
                        <Avatar name={member.displayName} colorKey={member.colorKey} />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-ink">
                            {member.displayName}
                          </span>
                          <span className="block text-xs text-muted">
                            Slobodni termini po rasporedu
                          </span>
                        </span>
                        <ChevronRight
                          aria-hidden="true"
                          className="h-4 w-4 text-line-strong transition-colors group-hover:text-pine"
                        />
                      </button>
                    </li>
                  ))}
                </ul>
                {eligibleHairdressers.length === 0 ? (
                  <p className="text-sm text-muted">
                    Nijedan aktivni frizer trenutno ne radi ovu uslugu. Vratite se i izaberite drugu
                    uslugu.
                  </p>
                ) : null}
                <div className="mt-5">
                  <Button
                    variant="quiet"
                    onClick={goBack}
                    leftIcon={<ArrowLeft className="h-4 w-4" />}
                  >
                    Nazad na usluge
                  </Button>
                </div>
              </section>
            ) : null}

            {step === 2 ? (
              <section aria-labelledby="booking-step-title">
                <StepTitle
                  id="booking-step-title"
                  headingRef={headingRef}
                  title="Izaberite termin"
                  description={`${selectedService?.name ?? ''} i ${selectedHairdresser?.displayName ?? ''}`}
                />
                <div className="mt-4">
                  <p className="mb-2 text-sm font-medium text-ink">Datum</p>
                  <DateStrip dates={dates} selected={dateKey} onSelect={chooseDate} />
                  <p className="mt-3 text-xs leading-relaxed text-muted">
                    Rezervacija je moguća najkasnije {formatLead(salon.bookingLeadMinutes)} prije
                    termina i najviše {salon.bookingHorizonDays} dana unaprijed.
                  </p>
                </div>

                {bookingError ? (
                  <div className="mt-4">
                    <FormError>{bookingError}</FormError>
                  </div>
                ) : null}

                <div className="mt-5">
                  <p className="mb-2 text-sm font-medium text-ink">Slobodni termini</p>
                  <SlotPicker
                    availability={availability.data}
                    selected={startsAt ?? undefined}
                    onSelect={chooseSlot}
                    dateKey={dateKey}
                    isPending={availability.isPending}
                    error={availability.error}
                  />
                </div>

                <div className="mt-5">
                  <Button
                    variant="quiet"
                    onClick={goBack}
                    leftIcon={<ArrowLeft className="h-4 w-4" />}
                  >
                    Nazad na frizere
                  </Button>
                </div>
              </section>
            ) : null}

            {step === 3 ? (
              <section aria-labelledby="booking-step-title">
                <StepTitle
                  id="booking-step-title"
                  headingRef={headingRef}
                  title="Vaši podaci"
                  description="Termin se potvrđuje odmah. Potvrdu ne šaljemo SMS-om ni e-mailom."
                />

                <dl className="mt-5 rounded-md bg-paper px-4 py-3 text-sm">
                  <div className="flex flex-wrap justify-between gap-x-4">
                    <dt className="text-muted">{selectedService?.name}</dt>
                    <dd className="tabular font-medium text-ink">
                      {selectedService
                        ? `${formatDuration(selectedService.durationMinutes)} · ${formatKM(selectedService.priceMinor)}`
                        : null}
                    </dd>
                  </div>
                  <div className="mt-1 flex flex-wrap justify-between gap-x-4">
                    <dt className="text-muted">{selectedHairdresser?.displayName}</dt>
                    <dd className="tabular font-medium text-ink">
                      {selectedSlot
                        ? `${capitalizeFirst(formatDateLong(dateKey))}, ${formatTime(selectedSlot.startsAt)}–${formatTime(selectedSlot.endsAt)}`
                        : 'Termin nije izabran'}
                    </dd>
                  </div>
                </dl>

                <form onSubmit={onSubmit} className="mt-5 space-y-4" noValidate>
                  {bookingError ? <FormError>{bookingError}</FormError> : null}
                  <TextField
                    label="Ime i prezime"
                    id="booking-name"
                    autoComplete="name"
                    placeholder="npr. Ana Marković"
                    error={form.formState.errors.name?.message}
                    {...form.register('name')}
                  />
                  <TextField
                    label="Broj telefona"
                    id="booking-phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="npr. 061 123 456"
                    hint="Broj koristimo samo za kontakt u vezi termina."
                    error={form.formState.errors.phone?.message}
                    {...form.register('phone')}
                  />

                  <div
                    className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden"
                    aria-hidden="true"
                  >
                    <label htmlFor="booking-website">Website</label>
                    <input
                      id="booking-website"
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      {...form.register('website')}
                    />
                  </div>

                  <CheckboxField
                    id="booking-consent"
                    checked={consent}
                    onCheckedChange={(checked) =>
                      form.setValue('consent', checked, { shouldValidate: true })
                    }
                    error={form.formState.errors.consent?.message}
                    label={
                      <>
                        Slažem se da salon koristi moje ime i broj telefona radi zakazivanja i
                        kontakta u vezi termina. Pročitajte{' '}
                        <a
                          href="/privatnost"
                          target="_blank"
                          rel="noreferrer"
                          onClick={(event) => event.stopPropagation()}
                          className="font-medium text-pine underline underline-offset-4"
                        >
                          obavještenje o privatnosti
                        </a>
                        .
                      </>
                    }
                  />

                  <p className="text-xs leading-relaxed text-muted">
                    Nakon potvrde dobićete privatan link za izmjenu ili otkazivanje termina.
                    Sačuvajte ga — bez njega ne možete upravljati terminom. Link nije dokaz
                    vlasništva broja telefona.
                  </p>

                  <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-between">
                    <Button
                      variant="quiet"
                      onClick={goBack}
                      leftIcon={<ArrowLeft className="h-4 w-4" />}
                      type="button"
                    >
                      Nazad na termin
                    </Button>
                    <Button
                      type="submit"
                      size="lg"
                      loading={createBooking.isPending}
                      disabled={!selectedSlot}
                    >
                      Potvrdi termin
                    </Button>
                  </div>
                </form>
              </section>
            ) : null}
          </Panel>
        </div>

        <aside className="hidden lg:block">
          <BookingSummary
            salon={salon}
            service={selectedService}
            hairdresser={selectedHairdresser}
            dateKey={dateKey}
            slot={selectedSlot}
          />
        </aside>
      </div>
      <p className="mt-4 text-xs leading-relaxed text-muted">
        Demo prikaz — ne unosite stvarne podatke. Rezervacija ne šalje poruke niti naplaćuje uslugu.
      </p>
    </div>
  )
}

function StepTitle({
  id,
  title,
  description,
  headingRef,
}: {
  id: string
  title: string
  description?: string
  headingRef: RefObject<HTMLHeadingElement | null>
}) {
  return (
    <div>
      <h2
        id={id}
        ref={headingRef}
        tabIndex={-1}
        className="text-xl font-semibold text-ink outline-none"
      >
        {title}
      </h2>
      {description ? (
        <p className="mt-1 text-sm leading-relaxed text-muted">{description}</p>
      ) : null}
    </div>
  )
}

function Stepper({ step }: { step: number }) {
  return (
    <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
      <span className="text-muted">
        Korak {step + 1} od {STEPS.length}
      </span>
      <span aria-hidden="true" className="text-line-strong">
        ·
      </span>
      <span aria-current="step" className="font-medium text-ink">
        {STEPS[step]}
      </span>
    </p>
  )
}

function BookingSummary({
  salon,
  service,
  hairdresser,
  dateKey,
  slot,
}: {
  salon: NonNullable<PublicSalonCatalog['salon']>
  service?: PublicServiceView
  hairdresser?: PublicHairdresserView
  dateKey: string
  slot?: { startsAt: string; endsAt: string }
}) {
  return (
    <div className="sticky top-6 rounded-lg bg-surface px-5 py-5">
      <p className="text-sm text-muted">Vaš termin</p>
      <p className="mt-0.5 text-xl font-semibold text-ink">{salon.name}</p>
      <dl className="mt-4 space-y-3 text-sm">
        <SummaryRow label="Usluga" value={service?.name ?? 'Nije izabrana'} />
        <SummaryRow label="Frizer" value={hairdresser?.displayName ?? 'Nije izabran'} />
        <SummaryRow label="Datum" value={slot ? formatDateLong(dateKey) : 'Nije izabran'} />
        <SummaryRow
          label="Vrijeme"
          value={slot ? `${formatTime(slot.startsAt)}–${formatTime(slot.endsAt)}` : '—'}
        />
        {service ? (
          <>
            <SummaryRow label="Trajanje" value={formatDuration(service.durationMinutes)} />
            <SummaryRow label="Cijena" value={formatKM(service.priceMinor)} />
          </>
        ) : null}
      </dl>
      <div className="mt-5 text-xs leading-relaxed text-muted">
        <p className="flex items-start gap-1.5">
          <Clock3 aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Rezervacija najkasnije {formatLead(salon.bookingLeadMinutes)} prije termina, najviše{' '}
          {salon.bookingHorizonDays} dana unaprijed.
        </p>
        <p className="mt-2">
          Otkazivanje ili promjena do {salon.rescheduleCutoffMinutes / 60} sata prije termina.
        </p>
      </div>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-ink">{value}</dd>
    </div>
  )
}

function formatLead(minutes: number): string {
  if (minutes < 60) return `${minutes} minuta`
  const hours = minutes / 60
  return hours === 1 ? '1 sat' : `${hours} sata`
}

function BookingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-16 w-64" />
      <Skeleton className="h-10 w-full" />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Skeleton className="h-[430px] w-full rounded-lg" />
        <Skeleton className="hidden h-[360px] w-full rounded-lg lg:block" />
      </div>
    </div>
  )
}

function PublicLockedState() {
  return (
    <div className="mx-auto max-w-xl py-8">
      <h1 className="text-ink">Online rezervacije su isključene u ovom prikazu</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Javna stranica salona dio je Paketa 2. U demou možete prebaciti prikaz paketa na početnoj
        strani i zatim otvoriti online rezervacije.
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        <ButtonLink to="/">Demo početna</ButtonLink>
        <ButtonLink to="/danas" variant="secondary">
          Otvori salonski prikaz
        </ButtonLink>
      </div>
    </div>
  )
}

function PublicUnavailableState() {
  return (
    <div className="mx-auto max-w-xl py-8">
      <h1 className="text-ink">Salonska stranica nije dostupna</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Provjerite link ili se vratite na demo početnu. Ovo je demo i linkovi se resetuju zajedno sa
        podacima.
      </p>
      <div className="mt-6">
        <ButtonLink to="/">Demo početna</ButtonLink>
      </div>
    </div>
  )
}
