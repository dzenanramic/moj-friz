import type {
  AppointmentDraft,
  AppointmentView,
  AvailabilityDay,
  AvailabilityQuery,
  BlockDraft,
  ClientDetail,
  DateRange,
  PackageInfo,
  Paginated,
  Client,
  PublicAppointmentView,
  PublicAvailabilityQuery,
  PublicBookingInput,
  PublicBookingResult,
  PublicSalonCatalog,
  SalonProfile,
  SalonService,
  TimeBlock,
  WorkingHoursInterval,
  Hairdresser,
} from './types'

export type GatewayErrorCode =
  | 'SLOT_UNAVAILABLE'
  | 'OUTSIDE_WORKING_HOURS'
  | 'NOT_FOUND'
  | 'INVALID_INPUT'
  | 'LEVEL_REQUIRED'
  | 'MANAGEMENT_TOKEN_INVALID'
  | 'CUTOFF_PASSED'
  | 'APPOINTMENT_NOT_EDITABLE'
  | 'UNKNOWN'

const DEFAULT_MESSAGES: Record<GatewayErrorCode, string> = {
  SLOT_UNAVAILABLE: 'Termin se preklapa sa drugim terminom. Izaberite drugo vrijeme.',
  OUTSIDE_WORKING_HOURS: 'Termin ne staje u radno vrijeme izabranog frizera.',
  NOT_FOUND: 'Traženi podatak nije pronađen.',
  INVALID_INPUT: 'Provjerite unesene podatke.',
  LEVEL_REQUIRED: 'Online rezervacije su dostupne u Paketu 2.',
  MANAGEMENT_TOKEN_INVALID: 'Link za upravljanje terminom nije važeći ili je istekao.',
  CUTOFF_PASSED: 'Termin se više ne može mijenjati. Kontaktirajte salon telefonom.',
  APPOINTMENT_NOT_EDITABLE: 'Ovaj termin se više ne može mijenjati.',
  UNKNOWN: 'Došlo je do neočekivane greške. Pokušajte ponovo.',
}

export class GatewayError extends Error {
  readonly code: GatewayErrorCode

  constructor(code: GatewayErrorCode, message?: string) {
    super(message ?? DEFAULT_MESSAGES[code])
    this.name = 'GatewayError'
    this.code = code
  }
}

export function isGatewayError(error: unknown): error is GatewayError {
  return error instanceof GatewayError
}

export function gatewayErrorMessage(error: unknown): string {
  if (isGatewayError(error)) return error.message
  if (error instanceof Error && error.message) return error.message
  return DEFAULT_MESSAGES.UNKNOWN
}

export interface SalonGateway {
  getCurrentSalon(): Promise<SalonProfile>
  getPackageInfo(): Promise<PackageInfo>
  setLevel(level: 'level_1' | 'level_2'): Promise<void>
  resetDemo(): Promise<void>

  listHairdressers(): Promise<Hairdresser[]>
  listServices(): Promise<SalonService[]>
  listWorkingHours(): Promise<WorkingHoursInterval[]>

  listAppointments(range: DateRange, hairdresserId?: string): Promise<AppointmentView[]>
  getAppointment(id: string): Promise<AppointmentView>
  createAppointment(draft: AppointmentDraft): Promise<AppointmentView>
  updateAppointment(id: string, draft: AppointmentDraft): Promise<AppointmentView>
  cancelAppointment(id: string): Promise<AppointmentView>
  setAppointmentStatus(id: string, status: 'completed' | 'no_show'): Promise<AppointmentView>
  getOwnerAvailability(query: AvailabilityQuery): Promise<AvailabilityDay>

  listTimeBlocks(range: DateRange): Promise<TimeBlock[]>
  createTimeBlock(draft: BlockDraft): Promise<TimeBlock>
  deleteTimeBlock(id: string): Promise<void>

  listClients(search: string, page: number, pageSize: number): Promise<Paginated<Client>>
  getClient(id: string): Promise<ClientDetail>

  getPublicSalon(slug: string): Promise<PublicSalonCatalog>
  getPublicAvailability(query: PublicAvailabilityQuery): Promise<AvailabilityDay>
  createPublicBooking(input: PublicBookingInput): Promise<PublicBookingResult>
  lookupManagement(token: string): Promise<PublicAppointmentView>
  rescheduleManaged(token: string, startsAt: string): Promise<PublicAppointmentView>
  cancelManaged(token: string): Promise<PublicAppointmentView>
}
