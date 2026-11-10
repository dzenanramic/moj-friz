import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it, vi } from 'vitest'

import { GatewayError } from '@/data/gateway'
import { DataProvider } from '@/data/DataProvider'
import { DemoGateway } from '@/demo/gateway'
import { addDaysToDateKey, formatDateLong, todayDateKey } from '@/lib/time'

import { PublicBookingPage } from './PublicBookingPage'

function renderPage(gateway: DemoGateway) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <DataProvider gateway={gateway} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/rezervacija/studio-lana']}>
          <Routes>
            <Route path="/rezervacija/:slug" element={<PublicBookingPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </DataProvider>,
  )
}

describe('PublicBookingPage', () => {
  it('returns the guest to the time step with a clear message on a slot conflict', async () => {
    const user = userEvent.setup()
    const gateway = new DemoGateway({ storage: null, latencyMs: 0 })
    vi.spyOn(gateway, 'createPublicBooking').mockRejectedValue(new GatewayError('SLOT_UNAVAILABLE'))
    renderPage(gateway)

    await user.click(await screen.findByRole('button', { name: /Žensko šišanje/ }))
    await user.click(await screen.findByRole('button', { name: /Lana Jovanović/ }))

    const tomorrowKey = addDaysToDateKey(todayDateKey(), 1)
    const tomorrowButton = await screen.findByRole('button', {
      name: formatDateLong(tomorrowKey),
    })
    await user.click(tomorrowButton)

    const timeLabels = await screen.findAllByText(/^\d{2}:\d{2}$/)
    const firstTime = timeLabels[0]?.closest('button')
    expect(firstTime).not.toBeNull()
    await user.click(firstTime!)

    await user.type(screen.getByLabelText('Ime i prezime'), 'Demo Gost')
    await user.type(screen.getByLabelText('Broj telefona'), '061 000 099')
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: 'Potvrdi termin' }))

    expect(await screen.findByText(/Termin se preklapa sa drugim terminom/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Izaberite termin' })).toBeInTheDocument()
  })
})
