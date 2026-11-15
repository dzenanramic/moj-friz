import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Check, ChevronRight, Clock3, MapPin, Phone } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type RefCallback } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router'

import { SalonMark } from '@/app/AppShell'
import { Avatar, Panel, Skeleton } from '@/components/ui/Layout'
import { Button, ButtonLink } from '@/components/ui/Button'
import { CheckboxField, FormError, TextField } from '@/components/ui/form'
import { gatewayErrorMessage, isGatewayError } from '@/data/gateway'
import { useCreatePublicBooking, usePublicAvailability, usePublicCatalog } from '@/data/queries'
import type {
  PublicAvailabilityQuery,
  PublicHairdresserView,
  PublicSalonCatalog,
  PublicServiceView,
} from '@/data/types'
import { formatDuration, formatKM } from '@/lib/format'
import { usePageTitle } from '@/lib/hooks'
import {
  capitalizeFirst,
  dateKeyFromInstant,
  formatDateLong,
  formatTime,
  todayDateKey,
} from '@/lib/time'
import { publicBookingFormSchema, type PublicBookingFormValues } from '@/lib/validation'
import { confirmationPath } from '@/demo/token'
import { publicDateWindow } from '@/lib/scheduling'

import { DateStrip } from './DateStrip'
import { MobileSelectionBar } from './MobileSelectionBar'
import { SlotPicker } from './SlotPicker'
import { StepTracker } from './StepTracker'
import { useStripAvailability } from './useStripAvailability'

/**
 * The guest flow, in four steps over one page. Every step stays mounted so a guest who
 * taps back never loses a choice, and the step they are on is always visible in the tracker.
 */
export function PublicBookingPage() {
  usePageTitle('Rezervacija termina')
  const { slug = '' } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const catalog = usePublicCatalog(slug)
  const [step, setStep] = useState(0)
  const [serviceId, setServiceId] = useState('')
  const [hairdresserId, setHairdresserId] = useState('')
  /**
   * null until the guest taps a day: while it is null the first day with a free slot is
   * shown, derived during render so no effect has to correct it after the fact.
   */
  const [pickedDateKey, setPickedDateKey] = useState<string | null>(null)
  const [startsAt, setStartsAt] = useState<string | null>(null)
  const [bookingError, setBookingError] = useState<string | null>(null)
  // One ref per step: the steps all stay mounted, so a shared ref would focus the first
  // step's heading and unhide it instead of the step the guest is on.
  const headingRefs = useRef<Array<HTMLHeadingElement | null>>([])
  const createBooking = useCreatePublicBooking()

  const form = useForm<PublicBookingFormValues>({
    resolver: zodResolver(publicBookingFormSchema),
    defaultValues: { name: '', phone: '', consent: false, website: '' },
  })

  const consent = useWatch({ control: form.control, name: 'consent' })
  const salon = catalog.data?.salon
  const dates = useMemo(
    () => (salon ? publicDateWindow(todayDateKey(), salon.bookingHorizonDays) : []),
    [salon],
  )
  const stripBase = useMemo(
    () => (serviceId && hairdresserId ? { slug, serviceId, hairdresserId } : null),
    [slug, serviceId, hairdresserId],
  )

  // Every day in the strip is checked so the guest can see which days have openings.
  // Kept on past the time step: the details step shows the chosen day, so the strip must
  // keep the day's free count (and the derived fallback day) available there too.
  const strip = useStripAvailability(stripBase, dates, Boolean(stripBase))

  /**
   * Until the guest taps a day, the day shown is the first one that has a free slot, so
   * nobody lands on a closed Monday. It is derived during render, not set by an effect:
   * the moment the guest picks a day, their choice takes over for good.
   */
  const autoDateKey = useMemo(() => {
    const known = dates.filter((day) => strip[day])
    if (known.length === 0 || known.length < dates.length) return null
    return known.find((day) => (strip[day]?.free ?? 0) > 0) ?? known[known.length - 1] ?? null
  }, [dates, strip])

  const effectiveDateKey = pickedDateKey ?? autoDateKey ?? todayDateKey()

  const availabilityQuery: PublicAvailabilityQuery | null =
    serviceId && hairdresserId && effectiveDateKey
      ? { slug, serviceId, hairdresserId, dateKey: effectiveDateKey }
      : null
  const availability = usePublicAvailability(availabilityQuery)

  useEffect(() => {
    if (step > 0) headingRefs.current[step]?.focus({ preventScroll: true })
  }, [step])

  const services = catalog.data?.services ?? []
  const hairdressers = catalog.data?.hairdressers ?? []
  const selectedService = services.find((service) => service.id === serviceId)
  const eligibleHairdressers = hairdressers.filter((member) =>
    member.serviceIds.includes(serviceId),
  )
  const selectedHairdresser = hairdressers.find((member) => member.id === hairdresserId)
  const selectedSlot = availability.data?.slots.find((slot) => slot.startsAt === startsAt)

  /** The next day after the shown one that still has openings, for the empty-day action. */
  const nextOpenDate = useMemo(() => {
    const from = dates.indexOf(effectiveDateKey)
    if (from < 0) return undefined
    return dates.slice(from + 1).find((day) => (strip[day]?.free ?? 0) > 0)
  }, [dates, effectiveDateKey, strip])

  const dayInfo = useMemo(() => {
    const info: Record<string, { free?: number; closed?: boolean }> = {}
    for (const day of dates) {
      const entry = strip[day]
      info[day] = { free: entry?.free, closed: entry?.closed }
    }
    return info
  }, [dates, strip])

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

  const goToStep = (next: number) => {
    setBookingError(null)
    setStep(Math.min(3, Math.max(0, next)))
  }

  const goBack = () => goToStep(step - 1)

  /** Back to the first step to change anything; the earlier choices stay filled in. */
  const editSelection = () => goToStep(0)

  const chooseService = (service: PublicServiceView) => {
    setServiceId(service.id)
    setHairdresserId('')
    setStartsAt(null)
    setPickedDateKey(null)
    setBookingError(null)
    setStep(1)
  }

  const chooseHairdresser = (member: PublicHairdresserView) => {
    const sameHairdresser = member.id === hairdresserId
    setHairdresserId(member.id)
    setStartsAt(null)
    // A guest coming back to confirm the same hairdresser keeps the day they chose.
    if (!sameHairdresser) setPickedDateKey(null)
    setBookingError(null)
    setStep(2)
  }

  const chooseDate = (nextDateKey: string) => {
    setPickedDateKey(nextDateKey)
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

  const selectionSummary = {
    service: selectedService?.name,
    hairdresser: selectedHairdresser?.displayName,
    when:
      selectedSlot && selectedService
        ? `${capitalizeFirst(formatDateLong(dateKeyFromInstant(selectedSlot.startsAt)).replace(/,.*$/, ''))}, ${formatTime(selectedSlot.startsAt)}`
        : undefined,
  }

  return (
    <div className="pb-20 lg:pb-0">
      <header className="border-b border-line pb-6">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
          <div>
            {/* The guest has no owner navigation: the mark, then the salon's name. */}
            <div className="mb-3 flex items-center gap-2.5">
              <SalonMark name={salon.name} size="sm" tone="ink" />
              <span className="text-xs font-medium tracking-wide text-muted uppercase">
                Rezervacija
              </span>
            </div>
            <h1 className="text-ink">{salon.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
              <span className="inline-flex items-center gap-1.5">
                <MapPin aria-hidden="true" className="h-4 w-4 text-muted" />
                {salon.address}, {salon.city}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Phone aria-hidden="true" className="h-4 w-4 text-muted" />
                {salon.phone}
              </span>
            </div>
          </div>
          <p className="text-sm text-muted">Rezervacija bez korisničkog naloga</p>
        </div>
      </header>

      <div className="mt-7 grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        <div className="min-w-0">
          <StepTracker step={step} onGoTo={goToStep} />

          <Panel className="mt-6 min-w-0 px-4 py-5 sm:px-7 sm:py-7">
            <section hidden={step !== 0} aria-labelledby="booking-service-title">
              <StepTitle
                id="booking-service-title"
                headingRef={(node) => {
                  headingRefs.current[0] = node
                }}
                title="Izaberite uslugu"
                description="Cijena i trajanje su isti kod svih frizera."
              />
              <ul className="mt-2">
                {services.map((service) => (
                  <li key={service.id} className="border-b border-line last:border-b-0">
                    <button
                      type="button"
                      onClick={() => chooseService(service)}
                      aria-pressed={service.id === serviceId}
                      className="group flex min-h-[64px] w-full items-center justify-between gap-4 rounded-sm px-3 py-3 text-left transition-colors hover:bg-paper active:bg-paper"
                    >
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-ink">{service.name}</span>
                        <span className="mt-0.5 block text-xs text-muted">
                          {formatDuration(service.durationMinutes)} ·{' '}
                          {countHairdressers(service, hairdressers)}
                        </span>
                      </span>
                      <span className="flex items-center gap-3">
                        <span className="tabular text-sm font-semibold text-ink">
                          {formatKM(service.priceMinor)}
                        </span>
                        <ChevronRight
                          aria-hidden="true"
                          className="h-4 w-4 text-muted transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-primary"
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

            <section hidden={step !== 1} aria-labelledby="booking-hairdresser-title">
              <StepTitle
                id="booking-hairdresser-title"
                headingRef={(node) => {
                  headingRefs.current[1] = node
                }}
                title="Izaberite frizera"
                description={`Za uslugu ${selectedService?.name ?? ''}.`}
              />
              <ul className="mt-2">
                {eligibleHairdressers.map((member) => (
                  <li key={member.id} className="border-b border-line last:border-b-0">
                    <button
                      type="button"
                      onClick={() => chooseHairdresser(member)}
                      aria-pressed={member.id === hairdresserId}
                      className="group flex min-h-[64px] w-full items-center gap-3 rounded-sm px-3 py-3 text-left transition-colors hover:bg-paper active:bg-paper"
                    >
                      <Avatar name={member.displayName} size="lg" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-ink">
                          {member.displayName}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted">
                          Slobodni termini po rasporedu
                        </span>
                      </span>
                      <ChevronRight
                        aria-hidden="true"
                        className="h-4 w-4 text-muted transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-primary"
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

            <section hidden={step !== 2} aria-labelledby="booking-time-title">
              <StepTitle
                id="booking-time-title"
                headingRef={(node) => {
                  headingRefs.current[2] = node
                }}
                title="Izaberite termin"
                description={`${selectedService?.name ?? ''} kod ${selectedHairdresser?.displayName ?? ''}.`}
              />
              <div className="mt-5">
                <p className="mb-2 text-sm font-medium text-ink">Datum</p>
                <DateStrip
                  dates={dates}
                  selected={effectiveDateKey}
                  onSelect={chooseDate}
                  dayInfo={dayInfo}
                />
                <p className="mt-2 text-xs leading-relaxed text-muted">
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
                  dateKey={effectiveDateKey}
                  nextOpenDate={nextOpenDate}
                  onPickNextOpen={chooseDate}
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

            <section hidden={step !== 3} aria-labelledby="booking-details-title">
              <StepTitle
                id="booking-details-title"
                headingRef={(node) => {
                  headingRefs.current[3] = node
                }}
                title="Vaši podaci"
                description="Termin se potvrđuje odmah. Potvrdu ne šaljemo SMS-om ni e-mailom."
              />

              <dl className="mt-5 overflow-hidden rounded-md bg-paper">
                <SummaryLine label="Usluga" value={selectedService?.name} />
                <SummaryLine label="Frizer" value={selectedHairdresser?.displayName} />
                <SummaryLine
                  label="Datum"
                  value={
                    selectedSlot
                      ? capitalizeFirst(formatDateLong(effectiveDateKey))
                      : 'Nije izabran'
                  }
                />
                <SummaryLine
                  label="Vrijeme"
                  value={
                    selectedSlot
                      ? `${formatTime(selectedSlot.startsAt)}–${formatTime(selectedSlot.endsAt)}`
                      : '—'
                  }
                />
                {selectedService ? (
                  <SummaryLine
                    label="Cijena"
                    value={`${formatDuration(selectedService.durationMinutes)} · ${formatKM(selectedService.priceMinor)}`}
                  />
                ) : null}
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
                  placeholder="npr. 06X XXX XXX"
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
                        className="font-medium text-primary underline underline-offset-4"
                      >
                        obavještenje o privatnosti
                      </a>
                      .
                    </>
                  }
                />

                <p className="text-xs leading-relaxed text-muted">
                  Nakon potvrde dobićete privatan link za izmjenu ili otkazivanje termina. Sačuvajte
                  ga — bez njega ne možete upravljati terminom. Link nije dokaz vlasništva broja
                  telefona.
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
                  {/* The one copper action in the booking flow. */}
                  <Button
                    type="submit"
                    size="lg"
                    variant="accent"
                    loading={createBooking.isPending}
                    disabled={!selectedSlot}
                  >
                    Potvrdi termin
                  </Button>
                </div>
              </form>
            </section>
          </Panel>
        </div>

        <aside className="hidden lg:block">
          <BookingSummary
            salon={salon}
            service={selectedService}
            hairdresser={selectedHairdresser}
            dateKey={effectiveDateKey}
            slot={selectedSlot}
          />
        </aside>
      </div>
      <p className="mt-4 text-xs leading-relaxed text-muted">
        Demo prikaz — ne unosite stvarne podatke. Rezervacija ne šalje poruke niti naplaćuje uslugu.
      </p>

      <MobileSelectionBar
        summary={selectionSummary}
        visible={step > 0 && step < 3}
        onEdit={editSelection}
      />
    </div>
  )
}

function countHairdressers(
  service: PublicServiceView,
  hairdressers: PublicHairdresserView[],
): string {
  const count = hairdressers.filter((member) => member.serviceIds.includes(service.id)).length
  if (count === 0) return 'trenutno nedostupna'
  if (count === 1) return '1 frizer'
  return `${count} frizera`
}

function SummaryLine({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 border-b border-line px-4 py-2.5 text-sm last:border-b-0">
      <dt className="text-muted">{label}</dt>
      <dd className="tabular font-medium text-ink">{value ?? '—'}</dd>
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
  headingRef: RefCallback<HTMLHeadingElement>
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
      <div className="mt-5 border-t border-line pt-4 text-xs leading-relaxed text-muted">
        <p className="flex items-start gap-1.5">
          <Clock3 aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Rezervacija najkasnije {formatLead(salon.bookingLeadMinutes)} prije termina, najviše{' '}
          {salon.bookingHorizonDays} dana unaprijed.
        </p>
        <p className="mt-2">
          Otkazivanje ili promjena do {salon.rescheduleCutoffMinutes / 60} sata prije termina.
        </p>
      </div>
      <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-primary-hover">
        <Check aria-hidden="true" className="h-3.5 w-3.5" />
        Bez prijave i bez plaćanja unaprijed
      </p>
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
