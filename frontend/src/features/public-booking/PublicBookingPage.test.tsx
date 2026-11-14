import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it, vi } from 'vitest'

import { GatewayError } from '@/data/gateway'
import { DataProvider } from '@/data/DataProvider'
import { DemoGateway } from '@/demo/gateway'

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
  // Guards a real regression: after a time was picked, the auto-chosen day fell back to
  // today (where that slot does not exist), so the details step showed no date and the
  // submit button stayed disabled forever.
  it('keeps the chosen day and slot when moving to the details step', async () => {
    const user = userEvent.setup()
    renderPage(new DemoGateway({ storage: null, latencyMs: 0 }))

    await user.click(await screen.findByRole('button', { name: /Žensko šišanje/ }))
    await user.click(await screen.findByRole('button', { name: /Lana Jovanović/ }))

    const findOpenDay = async (): Promise<HTMLButtonElement> => {
      const deadline = Date.now() + 2000
      while (Date.now() < deadline) {
        const open = Array.from(
          document.querySelectorAll<HTMLButtonElement>('[data-date-key]'),
        ).find((button) => {
          const label = button.getAttribute('aria-label') ?? ''
          return !label.includes('ne radi') && !label.includes('nema slobodnih')
        })
        if (open) return open
        await new Promise((resolve) => setTimeout(resolve, 50))
      }
      throw new Error('No open day was offered in the date strip.')
    }
    const chosenDay = await findOpenDay()
    const chosenDayLabel = chosenDay.getAttribute('aria-label') ?? ''
    await user.click(chosenDay)

    const firstTime = await within(
      document.getElementById('booking-time-title')?.closest('section') as HTMLElement,
    ).findAllByRole('button', { name: /^\d{2}:\d{2}$/ })
    await user.click(firstTime[0]!)

    expect(await screen.findByRole('heading', { name: 'Vaši podaci' })).toBeInTheDocument()
    // The summary shows the day the guest actually picked, not "Nije izabran" and not today.
    const details = document.getElementById('booking-details-title')?.closest('section')
    const detailsText = details?.textContent ?? ''
    const dayName = chosenDayLabel.split(',')[0] ?? ''
    expect(detailsText).not.toContain('Nije izabran')
    expect(detailsText.toLowerCase()).toContain(dayName.toLowerCase())
    // If the derived day ever falls back to "today", this is what the guest would see.
    const todayKey = new Date().toISOString().slice(0, 10)
    expect(chosenDay.getAttribute('data-date-key')).not.toBe(todayKey)
    expect(await screen.findByRole('button', { name: 'Potvrdi termin' })).toBeEnabled()
  })

  it('returns the guest to the time step with a clear message on a slot conflict', async () => {
    const user = userEvent.setup()
    const gateway = new DemoGateway({ storage: null, latencyMs: 0 })
    vi.spyOn(gateway, 'createPublicBooking').mockRejectedValue(new GatewayError('SLOT_UNAVAILABLE'))
    renderPage(gateway)

    await user.click(await screen.findByRole('button', { name: /Žensko šišanje/ }))
    await user.click(await screen.findByRole('button', { name: /Lana Jovanović/ }))

    // Pick a day the salon is open. The strip names a closed day "salon ne radi" and a full
    // one "nema slobodnih termina", so the first day that says neither has slots.
    const findOpenDay = async (): Promise<HTMLButtonElement> => {
      const deadline = Date.now() + 2000
      while (Date.now() < deadline) {
        const open = Array.from(
          document.querySelectorAll<HTMLButtonElement>('[data-date-key]'),
        ).find((button) => {
          const label = button.getAttribute('aria-label') ?? ''
          return !label.includes('ne radi') && !label.includes('nema slobodnih')
        })
        if (open) return open
        await new Promise((resolve) => setTimeout(resolve, 50))
      }
      throw new Error('No open day was offered in the date strip.')
    }
    await user.click(await findOpenDay())

    // The time step's slots only: every step stays mounted, so scope to the time section.
    const timeSection = document.getElementById('booking-time-title')?.closest('section')
    expect(timeSection).not.toBeNull()
    const firstTime = await within(timeSection as HTMLElement).findAllByRole('button', {
      name: /^\d{2}:\d{2}$/,
    })
    expect(firstTime.length).toBeGreaterThan(0)
    await user.click(firstTime[0]!)

    await user.type(screen.getByLabelText('Ime i prezime'), 'Demo Gost')
    await user.type(screen.getByLabelText('Broj telefona'), '061 000 099')
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: 'Potvrdi termin' }))

    // The conflict message can appear on the time step and again in the details form.
    expect(
      (await screen.findAllByText(/Termin se preklapa sa drugim terminom/)).length,
    ).toBeGreaterThan(0)
    expect(screen.getByRole('heading', { name: 'Izaberite termin' })).toBeInTheDocument()
  })
})
