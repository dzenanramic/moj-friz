import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createContext, useContext, useState, type ReactNode } from 'react'

import { DemoGateway } from '@/demo/gateway'

import type { SalonGateway } from './gateway'

interface DataProviderProps {
  children: ReactNode
  gateway?: SalonGateway
  queryClient?: QueryClient
}

const GatewayContext = createContext<SalonGateway | null>(null)

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 0,
        staleTime: 2_000,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  })
}

export function DataProvider({ children, gateway, queryClient }: DataProviderProps) {
  const [defaultGateway] = useState<SalonGateway>(() => new DemoGateway())
  const [defaultQueryClient] = useState<QueryClient>(() => createQueryClient())
  const activeGateway = gateway ?? defaultGateway

  return (
    <QueryClientProvider client={queryClient ?? defaultQueryClient}>
      <GatewayContext.Provider value={activeGateway}>{children}</GatewayContext.Provider>
    </QueryClientProvider>
  )
}

export function useGateway(): SalonGateway {
  const gateway = useContext(GatewayContext)
  if (!gateway) throw new Error('useGateway must be used inside DataProvider')
  return gateway
}
