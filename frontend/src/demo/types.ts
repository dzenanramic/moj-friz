import type {
  Appointment,
  Client,
  Hairdresser,
  PlanLevel,
  SalonProfile,
  SalonService,
  TimeBlock,
  WorkingHoursInterval,
} from '@/data/types'

export interface ManagementTokenRecord {
  appointmentId: string
  tokenHash: string
  expiresAt: string
  revokedAt: string | null
  createdAt: string
}

export interface DemoState {
  version: 1
  level: PlanLevel
  seededAt: string
  salon: SalonProfile
  hairdressers: Hairdresser[]
  services: SalonService[]
  workingHours: WorkingHoursInterval[]
  clients: Client[]
  appointments: Appointment[]
  blocks: TimeBlock[]
  managementTokens: ManagementTokenRecord[]
}
