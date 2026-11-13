import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { localDateTimeToInstant } from '@/lib/time'

import { SlotPicker } from './SlotPicker'

const dateKey = '2026-11-11'
const morning = localDateTimeToInstant(dateKey, '09:00')!
const afternoon = localDateTimeToInstant(dateKey, '14:00')!
const evening = localDateTimeToInstant(dateKey, '18:00')!

const availability = {
  dateKey,
  isClosed: false,
  isFull: false,
  slots: [
    { startsAt: morning, endsAt: localDateTimeToInstant(dateKey, '09:45')! },
    { startsAt: afternoon, endsAt: localDateTimeToInstant(dateKey, '14:45')! },
    { startsAt: evening, endsAt: localDateTimeToInstant(dateKey, '18:45')! },
  ],
}

describe('SlotPicker', () => {
  it('groups slots and selects a time', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(
      <SlotPicker
        availability={availability}
        onSelect={onSelect}
        dateKey={dateKey}
        isPending={false}
        error={null}
      />,
    )

    expect(screen.getByText('Prijepodne')).toBeInTheDocument()
    expect(screen.getByText('Poslijepodne')).toBeInTheDocument()
    expect(screen.getByText('Veče')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '09:00' }))
    expect(onSelect).toHaveBeenCalledWith(morning)
  })

  it('marks the selected slot with aria-pressed', () => {
    render(
      <SlotPicker
        availability={availability}
        selected={morning}
        onSelect={() => {}}
        dateKey={dateKey}
        isPending={false}
        error={null}
      />,
    )
    expect(screen.getByRole('button', { name: '09:00' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: '14:00' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('shows a closed-day message', () => {
    render(
      <SlotPicker
        availability={{ ...availability, slots: [], isClosed: true }}
        onSelect={() => {}}
        dateKey={dateKey}
        isPending={false}
        error={null}
      />,
    )
    expect(screen.getByText('Salon ne radi tog dana')).toBeInTheDocument()
  })

  it('shows a full-day message and an error state', () => {
    const { rerender } = render(
      <SlotPicker
        availability={{ ...availability, slots: [] }}
        onSelect={() => {}}
        dateKey={dateKey}
        isPending={false}
        error={null}
      />,
    )
    expect(screen.getByText('Nema slobodnih termina')).toBeInTheDocument()

    rerender(
      <SlotPicker
        availability={undefined}
        onSelect={() => {}}
        dateKey={dateKey}
        isPending={false}
        error={new Error('Test greška')}
      />,
    )
    expect(screen.getByText('Test greška')).toBeInTheDocument()
  })
})
