export type PlanLevel = 'level_1' | 'level_2'
export type SubscriptionStatus = 'trial' | 'active' | 'cancelled' | 'past_due'
/** Hairdressers 1–6. The colour belongs to the seat, not to the person, so it can be reassigned. */
export type StaffColor = '1' | '2' | '3' | '4' | '5' | '6'

/** 0 = ponedjeljak, 6 = nedjelja (ISO-ish, but zero-based). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

export type AppointmentStatus = 'confirmed' | 'completed' | 'cancelled' | 'no_show'
export type AppointmentSource = 'manual' | 'online'

export interface SalonProfile {
  id: string
  name: string
  slug: string
  phone: string
  address: string | null
  city: string
  timezone: string
  plan: PlanLevel
  subscriptionStatus: SubscriptionStatus
  trialStartedAt: string | null
  trialEndsAt: string | null
  publicBookingEnabled: boolean
  bookingLeadMinutes: number
  bookingHorizonDays: number
  cancellationCutoffMinutes: number
  rescheduleCutoffMinutes: number
}

export interface Hairdresser {
  id: string
  displayName: string
  isActive: boolean
  colorKey: StaffColor
  serviceIds: string[]
}

export interface SalonService {
  id: string
  name: string
  durationMinutes: number
  priceMinor: number | null
  currency: 'BAM'
  isActive: boolean
}

export interface WorkingHoursInterval {
  id: string
  hairdresserId: string
  weekday: Weekday
  start: string
  end: string
}

export interface TimeBlock {
  id: string
  hairdresserId: string
  startsAt: string
  endsAt: string
  reason: string
}

export interface Client {
  id: string
  name: string
  phoneOriginal: string
  phoneNormalized: string
  notes: string | null
  createdAt: string
}

export interface Appointment {
  id: string
  hairdresserId: string
  serviceId: string
  clientId: string
  serviceNameSnapshot: string
  durationMinutesSnapshot: number
  priceMinorSnapshot: number | null
  startsAt: string
  endsAt: string
  status: AppointmentStatus
  source: AppointmentSource
  internalNote: string | null
  createdAt: string
  updatedAt: string
}

export interface AppointmentView extends Appointment {
  hairdresserName: string
  hairdresserColorKey: StaffColor
  serviceName: string
  clientName: string
  clientPhone: string
}

export interface ClientAppointmentView extends AppointmentView {
  hairdresserName: string
}

export interface Paginated<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface ClientDetail {
  client: Client
  appointments: ClientAppointmentView[]
}

export interface DateRange {
  from: string
  to: string
}

export interface AvailabilityQuery {
  hairdresserId: string
  serviceId: string
  dateKey: string
  excludeAppointmentId?: string
}

export interface PublicAvailabilityQuery {
  slug: string
  hairdresserId: string
  serviceId: string
  dateKey: string
}

export interface AvailabilitySlot {
  startsAt: string
  endsAt: string
}

export interface AvailabilityDay {
  dateKey: string
  slots: AvailabilitySlot[]
  isClosed: boolean
  isFull: boolean
}

export interface AppointmentDraft {
  hairdresserId: string
  serviceId: string
  clientId?: string
  newClientName?: string
  newClientPhone?: string
  dateKey: string
  time: string
  internalNote?: string
}

export interface BlockDraft {
  hairdresserId: string
  dateKey: string
  startTime: string
  endTime: string
  reason: string
}

export interface PublicSalonView {
  salon: Pick<
    SalonProfile,
    | 'name'
    | 'slug'
    | 'phone'
    | 'address'
    | 'city'
    | 'timezone'
    | 'bookingLeadMinutes'
    | 'bookingHorizonDays'
    | 'cancellationCutoffMinutes'
    | 'rescheduleCutoffMinutes'
  >
  services: SalonService[]
  hairdressers: Array<Pick<Hairdresser, 'id' | 'displayName' | 'colorKey' | 'serviceIds'>>
}

export interface PublicServiceView {
  id: string
  name: string
  durationMinutes: number
  priceMinor: number | null
  currency: 'BAM'
}

export interface PublicHairdresserView {
  id: string
  displayName: string
  /** The public booking flow does not colour hairdressers: a guest picks a person, not a seat. */
  colorKey?: StaffColor
  serviceIds: string[]
}

export interface PublicSalonCatalog {
  salon: PublicSalonView['salon']
  services: PublicServiceView[]
  hairdressers: PublicHairdresserView[]
}

export interface PublicAppointmentView {
  id: string
  salonName: string
  salonSlug: string
  salonPhone: string
  salonAddress: string | null
  salonCity: string
  serviceId: string
  serviceName: string
  priceMinor: number | null
  hairdresserId: string
  hairdresserName: string
  startsAt: string
  endsAt: string
  status: AppointmentStatus
  canCancel: boolean
  canReschedule: boolean
  bookingLeadMinutes: number
  bookingHorizonDays: number
  cancellationCutoffMinutes: number
  rescheduleCutoffMinutes: number
  managementExpiresAt: string
}

export interface PublicBookingInput {
  slug: string
  serviceId: string
  hairdresserId: string
  startsAt: string
  name: string
  phone: string
  consent: boolean
  website?: string
}

export interface PublicBookingResult {
  appointment: PublicAppointmentView
  managementToken: string
}

export interface PackageInfo {
  level: PlanLevel
  pricePerHairdresserMinor: number
  activeHairdressers: number
  monthlyTotalMinor: number
  subscriptionStatus: SubscriptionStatus
  trialEndsAt: string | null
}

export interface DemoSalonSnapshot {
  profile: SalonProfile
  hairdressers: Hairdresser[]
  services: SalonService[]
  workingHours: WorkingHoursInterval[]
}
