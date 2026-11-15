import { expect, type Page } from '@playwright/test'

const WEEKDAYS = [
  'ponedjeljak',
  'utorak',
  'srijeda',
  'četvrtak',
  'petak',
  'subota',
  'nedjelja',
] as const

function salonParts(offsetDays: number): { year: string; month: string; day: string } {
  const target = new Date(Date.now() + offsetDays * 86_400_000)
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Sarajevo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(target)

  return {
    year: parts.find((part) => part.type === 'year')?.value ?? '1970',
    month: parts.find((part) => part.type === 'month')?.value ?? '01',
    day: parts.find((part) => part.type === 'day')?.value ?? '01',
  }
}

export function salonDateKey(offsetDays: number): string {
  const parts = salonParts(offsetDays)
  return `${parts.year}-${parts.month}-${parts.day}`
}

export function formatSalonDateLong(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number)
  const weekday = (new Date(Date.UTC(year, month - 1, day, 12)).getUTCDay() + 6) % 7
  return `${WEEKDAYS[weekday]}, ${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}.${year}`
}

/** A future date when the demo salon is open and the standard hairdresser works. */
export function nextOpenDateKey(startOffset = 7): string {
  for (let offset = startOffset; offset < startOffset + 10; offset += 1) {
    const key = salonDateKey(offset)
    const [year, month, day] = key.split('-').map(Number)
    const weekday = new Date(Date.UTC(year, month - 1, day, 12)).getUTCDay()
    if (weekday !== 0) return key
  }
  throw new Error('No open demo date found')
}

export async function submitNewClientAppointment(
  page: Page,
  options: { dateKey: string; clientName: string; phone: string },
): Promise<void> {
  // The header action and the empty state's action share this name: the first is the header.
  await page.getByRole('button', { name: 'Novi termin' }).first().click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await dialog.locator('#appointment-client-name').fill(options.clientName)
  await dialog.locator('#appointment-client-phone').fill(options.phone)
  await dialog.locator('#appointment-date').selectOption(options.dateKey)
  await expect(dialog.locator('fieldset button').first()).toBeVisible()
  await dialog.locator('fieldset button').first().click()
  await dialog.getByRole('button', { name: 'Dodaj termin' }).click()
  await expect(dialog).toBeHidden()
}
