import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useEffect, useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { DateSelectField } from './DateSelectField'

const today = '2026-11-15'

function Harness({
  initial = today,
  onPick,
}: {
  initial?: string
  onPick?: (dateKey: string) => void
}) {
  const [value, setValue] = useState(initial)
  useEffect(() => {
    onPick?.(value)
  }, [onPick, value])
  return (
    <DateSelectField
      id="test-date"
      label="Datum"
      value={value}
      onChange={setValue}
      startDateKey={today}
    />
  )
}

/** The shown days, by the accessible name each day button carries. */
function shownDays(): string[] {
  return within(screen.getByRole('toolbar', { name: 'Datum' }))
    .queryAllByRole('button')
    .map((button) => button.getAttribute('aria-label') ?? '')
    .filter((name) => /\d{4}$/.test(name))
}

function dayButton(name: string) {
  return screen.getByRole('button', { name })
}

describe('DateSelectField', () => {
  it('opens on two rows of five days and picks one with a click', async () => {
    const user = userEvent.setup()
    const onPick = vi.fn()
    render(<Harness onPick={onPick} />)

    expect(shownDays()).toHaveLength(10)
    expect(shownDays()[0]).toBe('nedjelja, 15.11.2026')
    expect(shownDays()[9]).toBe('utorak, 24.11.2026')
    expect(dayButton('nedjelja, 15.11.2026')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText(/Nedjelja, 15\.11\.2026 \(danas\)/)).toBeInTheDocument()

    await user.click(dayButton('ponedjeljak, 16.11.2026'))

    expect(onPick).toHaveBeenLastCalledWith('2026-11-16')
    expect(dayButton('ponedjeljak, 16.11.2026')).toHaveAttribute('aria-pressed', 'true')
    expect(dayButton('nedjelja, 15.11.2026')).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByText(/Ponedjeljak, 16\.11\.2026 \(sutra\)/)).toBeInTheDocument()
  })

  it('adds two more rows with "Više datuma" and reaches the end of the quarter', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(screen.getByRole('button', { name: 'Više datuma' }))
    expect(shownDays()).toHaveLength(20)

    for (let step = 0; step < 40; step += 1) {
      const more = screen.queryByRole('button', { name: 'Više datuma' })
      if (!more) break
      await user.click(more)
    }
    expect(screen.queryByRole('button', { name: 'Više datuma' })).not.toBeInTheDocument()
    expect(dayButton('petak, 12.02.2027')).toBeInTheDocument()
  })

  it('moves a day at a time or a row at a time with the arrow keys', async () => {
    const user = userEvent.setup()
    const onPick = vi.fn()
    render(<Harness onPick={onPick} />)

    dayButton('nedjelja, 15.11.2026').focus()
    await user.keyboard('{ArrowRight}')
    expect(onPick).toHaveBeenLastCalledWith('2026-11-16')

    await user.keyboard('{ArrowDown}')
    expect(onPick).toHaveBeenLastCalledWith('2026-11-21')

    await user.keyboard('{ArrowUp}{ArrowLeft}')
    expect(onPick).toHaveBeenLastCalledWith('2026-11-15')
  })

  it('keeps a day from before the quarter selectable', () => {
    render(<Harness initial="2026-11-10" />)

    // The old day sits with the days before it, not dangling on its own.
    expect(dayButton('utorak, 10.11.2026')).toBeInTheDocument()
    expect(dayButton('nedjelja, 15.11.2026')).toBeInTheDocument()
    expect(dayButton('utorak, 10.11.2026')).toHaveAttribute('aria-pressed', 'true')
  })
})
