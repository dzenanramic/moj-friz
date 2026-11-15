import { expect, type Locator, type Page } from '@playwright/test'

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

/** The next date, from today on, that falls on the given weekday (0 = Sunday). */
export function nextDateKeyOnWeekday(weekday: number, startOffset = 1): string {
  for (let offset = startOffset; offset < startOffset + 7; offset += 1) {
    const key = salonDateKey(offset)
    const [year, month, day] = key.split('-').map(Number)
    if (new Date(Date.UTC(year, month - 1, day, 12)).getUTCDay() === weekday) return key
  }
  throw new Error('No such weekday found')
}

/** The demo's own localStorage key (see src/demo/gateway.ts). */
const DEMO_STORAGE_KEY = 'mojfriz.demo.v1'

/**
 * Start from a fresh seed.
 *
 * The suite shares one origin, so a test that changes the package level or adds appointments
 * would otherwise decide what the next test opens on. Every test drops the stored state first;
 * the app then seeds the current day.
 */
export async function resetDemoState(page: Page): Promise<void> {
  await page.goto('/')
  await page.evaluate((key) => window.localStorage.removeItem(key), DEMO_STORAGE_KEY)
  await page.reload()
}

/** The package preview switch lives in Postavke → Paket, not in the demo bar. */
export async function previewPackage(page: Page, level: 'Paket 1' | 'Paket 2'): Promise<void> {
  await page.goto('/postavke')
  await page.getByRole('button', { name: `Prikaži ${level} u demou` }).click()
  await expect(page.getByText(`Demo prikaz je prebačen na ${level}.`)).toBeVisible()
}

/**
 * A future date the demo has appointments on. Every day of the week is a demo working day —
 * Sunday included — and the seed fills three weeks ahead, so any day in that window is open.
 */
export function nextOpenDateKey(startOffset = 7): string {
  return salonDateKey(startOffset)
}

/** The day picker is a grid of buttons: open more days until the wanted one is on screen, then tap it. */
async function chooseAppointmentDate(dialog: Locator, dateKey: string): Promise<void> {
  const picker = dialog.locator('#appointment-date')
  const day = picker.getByRole('button', { name: formatSalonDateLong(dateKey) })
  const more = picker.getByRole('button', { name: 'Više datuma' })
  for (let step = 0; step < 9 && !(await day.isVisible()); step += 1) {
    await more.click()
  }
  await day.click()
}

export async function submitNewClientAppointment(
  page: Page,
  options: { dateKey: string; clientName: string; phone: string },
): Promise<void> {
  // Creating starts from the calendar for the wanted day: the dashboard hides its action on a
  // day the salon is closed, and this day is chosen from the open days.
  await page.goto(`/kalendar?datum=${options.dateKey}`)
  // The header action and the empty state's action share this name: the first is the header.
  await expect(page.getByRole('button', { name: 'Novi termin' }).first()).toBeVisible()
  await page.getByRole('button', { name: 'Novi termin' }).first().click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await dialog.locator('#appointment-client-name').fill(options.clientName)
  await dialog.locator('#appointment-client-phone').fill(options.phone)
  await chooseAppointmentDate(dialog, options.dateKey)
  await expect(dialog.locator('fieldset button').first()).toBeVisible()
  await dialog.locator('fieldset button').first().click()
  await dialog.getByRole('button', { name: 'Dodaj termin' }).click()
  await expect(dialog).toBeHidden()
}
