import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { DataProvider } from '@/data/DataProvider'
import { DemoGateway } from '@/demo/gateway'

import { StatisticsPage } from './StatisticsPage'

function renderPage(gateway: DemoGateway) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <DataProvider gateway={gateway} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <StatisticsPage />
      </QueryClientProvider>
    </DataProvider>,
  )
}

describe('StatisticsPage', () => {
  it('renders the report from stored appointments and switches the period', async () => {
    const user = userEvent.setup()
    const gateway = new DemoGateway({ storage: null, latencyMs: 0 })
    const getStatistics = vi.spyOn(gateway, 'getStatistics')
    renderPage(gateway)

    expect(await screen.findByRole('heading', { name: 'Statistika' })).toBeInTheDocument()
    expect(await screen.findByText('Prihod')).toBeInTheDocument()
    expect(screen.getByText('Dolasci i klijenti')).toBeInTheDocument()
    expect(screen.getByText('Frizeri')).toBeInTheDocument()
    expect(screen.getByText('Usluge')).toBeInTheDocument()
    expect(screen.getByText('Kada se radi')).toBeInTheDocument()
    expect(getStatistics).toHaveBeenCalledWith(expect.objectContaining({ period: 'last_7_days' }))

    const month = screen.getByRole('button', { name: '30 dana' })
    expect(month).toHaveAttribute('aria-pressed', 'false')
    await user.click(month)
    await waitFor(() =>
      expect(getStatistics).toHaveBeenCalledWith(
        expect.objectContaining({ period: 'last_30_days' }),
      ),
    )
    expect(month).toHaveAttribute('aria-pressed', 'true')
    expect(await screen.findByText(/Proteklih 30 punih dana/)).toBeInTheDocument()
  })
})
