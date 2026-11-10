import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'

import type {
  AppointmentDraft,
  AvailabilityQuery,
  BlockDraft,
  DateRange,
  PlanLevel,
  PublicAvailabilityQuery,
  PublicBookingInput,
} from './types'

import { useGateway } from './DataProvider'

export const queryKeys = {
  salon: ['salon'] as const,
  packageInfo: ['package-info'] as const,
  hairdressers: ['hairdressers'] as const,
  services: ['services'] as const,
  workingHours: ['working-hours'] as const,
  appointments: ['appointments'] as const,
  blocks: ['blocks'] as const,
  clients: ['clients'] as const,
  client: ['client'] as const,
  ownerAvailability: ['owner-availability'] as const,
  publicCatalog: ['public-catalog'] as const,
  publicAvailability: ['public-availability'] as const,
  management: ['management'] as const,
}

function invalidateSchedule(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: queryKeys.appointments })
  void queryClient.invalidateQueries({ queryKey: queryKeys.blocks })
  void queryClient.invalidateQueries({ queryKey: queryKeys.clients })
  void queryClient.invalidateQueries({ queryKey: queryKeys.client })
  void queryClient.invalidateQueries({ queryKey: queryKeys.ownerAvailability })
  void queryClient.invalidateQueries({ queryKey: queryKeys.publicAvailability })
  void queryClient.invalidateQueries({ queryKey: queryKeys.management })
}

export function useSalon() {
  const gateway = useGateway()
  return useQuery({ queryKey: queryKeys.salon, queryFn: () => gateway.getCurrentSalon() })
}

export function usePackageInfo() {
  const gateway = useGateway()
  return useQuery({ queryKey: queryKeys.packageInfo, queryFn: () => gateway.getPackageInfo() })
}

export function useHairdressers() {
  const gateway = useGateway()
  return useQuery({ queryKey: queryKeys.hairdressers, queryFn: () => gateway.listHairdressers() })
}

export function useServices() {
  const gateway = useGateway()
  return useQuery({ queryKey: queryKeys.services, queryFn: () => gateway.listServices() })
}

export function useWorkingHours() {
  const gateway = useGateway()
  return useQuery({ queryKey: queryKeys.workingHours, queryFn: () => gateway.listWorkingHours() })
}

export function useAppointments(range: DateRange | null, hairdresserId?: string) {
  const gateway = useGateway()
  return useQuery({
    queryKey: [...queryKeys.appointments, range, hairdresserId ?? 'all'],
    queryFn: () => gateway.listAppointments(range!, hairdresserId),
    enabled: Boolean(range),
  })
}

export function useTimeBlocks(range: DateRange | null) {
  const gateway = useGateway()
  return useQuery({
    queryKey: [...queryKeys.blocks, range],
    queryFn: () => gateway.listTimeBlocks(range!),
    enabled: Boolean(range),
  })
}

export function useClients(search: string, page: number, pageSize = 8) {
  const gateway = useGateway()
  return useQuery({
    queryKey: [...queryKeys.clients, search, page, pageSize],
    queryFn: () => gateway.listClients(search, page, pageSize),
  })
}

export function useClient(id: string | undefined) {
  const gateway = useGateway()
  return useQuery({
    queryKey: [...queryKeys.client, id],
    queryFn: () => gateway.getClient(id!),
    enabled: Boolean(id),
  })
}

export function useOwnerAvailability(query: AvailabilityQuery | null) {
  const gateway = useGateway()
  return useQuery({
    queryKey: [...queryKeys.ownerAvailability, query],
    queryFn: () => gateway.getOwnerAvailability(query!),
    enabled: Boolean(query),
  })
}

export function usePublicCatalog(slug: string) {
  const gateway = useGateway()
  return useQuery({
    queryKey: [...queryKeys.publicCatalog, slug],
    queryFn: () => gateway.getPublicSalon(slug),
  })
}

export function usePublicAvailability(query: PublicAvailabilityQuery | null) {
  const gateway = useGateway()
  return useQuery({
    queryKey: [...queryKeys.publicAvailability, query],
    queryFn: () => gateway.getPublicAvailability(query!),
    enabled: Boolean(query),
  })
}

export function useManagementAppointment(token: string | null) {
  const gateway = useGateway()
  return useQuery({
    queryKey: [...queryKeys.management, token],
    queryFn: () => gateway.lookupManagement(token!),
    enabled: Boolean(token),
    retry: false,
  })
}

export function useCreateAppointment() {
  const gateway = useGateway()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (draft: AppointmentDraft) => gateway.createAppointment(draft),
    onSuccess: () => invalidateSchedule(queryClient),
  })
}

export function useUpdateAppointment() {
  const gateway = useGateway()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, draft }: { id: string; draft: AppointmentDraft }) =>
      gateway.updateAppointment(id, draft),
    onSuccess: () => invalidateSchedule(queryClient),
  })
}

export function useCancelAppointment() {
  const gateway = useGateway()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => gateway.cancelAppointment(id),
    onSuccess: () => invalidateSchedule(queryClient),
  })
}

export function useSetAppointmentStatus() {
  const gateway = useGateway()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'completed' | 'no_show' }) =>
      gateway.setAppointmentStatus(id, status),
    onSuccess: () => invalidateSchedule(queryClient),
  })
}

export function useCreateTimeBlock() {
  const gateway = useGateway()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (draft: BlockDraft) => gateway.createTimeBlock(draft),
    onSuccess: () => invalidateSchedule(queryClient),
  })
}

export function useDeleteTimeBlock() {
  const gateway = useGateway()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => gateway.deleteTimeBlock(id),
    onSuccess: () => invalidateSchedule(queryClient),
  })
}

export function useCreatePublicBooking() {
  const gateway = useGateway()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: PublicBookingInput) => gateway.createPublicBooking(input),
    onSuccess: () => {
      invalidateSchedule(queryClient)
      void queryClient.invalidateQueries({ queryKey: queryKeys.publicCatalog })
    },
    onError: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.publicAvailability })
    },
  })
}

export function useRescheduleManaged(token: string) {
  const gateway = useGateway()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (startsAt: string) => gateway.rescheduleManaged(token, startsAt),
    onSuccess: () => {
      invalidateSchedule(queryClient)
      void queryClient.invalidateQueries({ queryKey: [...queryKeys.management, token] })
    },
    onError: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.publicAvailability })
    },
  })
}

export function useCancelManaged(token: string) {
  const gateway = useGateway()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => gateway.cancelManaged(token),
    onSuccess: () => {
      invalidateSchedule(queryClient)
      void queryClient.invalidateQueries({ queryKey: [...queryKeys.management, token] })
    },
  })
}

export function useSetDemoLevel() {
  const gateway = useGateway()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (level: PlanLevel) => gateway.setLevel(level),
    onSuccess: () => {
      void queryClient.invalidateQueries()
    },
  })
}

export function useResetDemo() {
  const gateway = useGateway()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => gateway.resetDemo(),
    onSuccess: () => {
      queryClient.clear()
    },
  })
}
