import { expect, test } from '@playwright/test'

import { formatSalonDateLong, nextOpenDateKey, previewPackage, resetDemoState } from './helpers'

test('guest books, reschedules and cancels a Level 2 appointment', async ({ page }) => {
  const dateKey = nextOpenDateKey(2)

  await page.goto('/rezervacija/studio-lana')
  await expect(page.getByRole('heading', { name: 'Izaberite uslugu' })).toBeVisible()
  await page.getByRole('button', { name: /Žensko šišanje/ }).click()
  await page.getByRole('button', { name: /Lana Jovanović/ }).click()

  await page.getByRole('button', { name: formatSalonDateLong(dateKey) }).click()
  const timeSlot = page
    .locator('button')
    .filter({ hasText: /^\d{2}:\d{2}$/ })
    .first()
  await expect(timeSlot).toBeVisible()
  await timeSlot.click()

  await page.getByRole('textbox', { name: 'Ime i prezime' }).fill('E2E Gost')
  await page.getByRole('textbox', { name: 'Broj telefona' }).fill('061 999 002')
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Potvrdi termin' }).click()

  await expect(page).toHaveURL(/\/potvrda#t=/)
  await expect(page.getByRole('heading', { name: 'Vidimo se u salonu' })).toBeVisible()
  await expect(page.getByText(/Nismo poslali SMS ni e-mail/)).toBeVisible()

  await page.getByRole('link', { name: /Upravljaj terminom/ }).click()
  await expect(page.getByRole('heading', { name: 'Upravljanje terminom' })).toBeVisible()
  await expect(page.getByText('Potvrđen')).toBeVisible()

  await page.getByRole('button', { name: 'Promijeni termin' }).click()
  const newSlot = page
    .locator('button')
    .filter({ hasText: /^\d{2}:\d{2}$/ })
    .first()
  await expect(newSlot).toBeVisible()
  await newSlot.click()
  await page.getByRole('button', { name: 'Potvrdi promjenu' }).click()
  await expect(page.getByText('Termin je pomjeren.')).toBeVisible()

  await page.getByRole('button', { name: 'Otkaži termin' }).click()
  const confirm = page.getByRole('alertdialog')
  await expect(confirm).toBeVisible()
  await confirm.getByRole('button', { name: 'Da, otkaži termin' }).click()
  await expect(page.getByText('Termin je otkazan.', { exact: true })).toBeVisible()
  await expect(page.getByText('Otkazano')).toBeVisible()
})

test('Level 1 shows an honest lock instead of public booking', async ({ page }) => {
  // The package switch lives in Postavke, and the level is stored: start from Paket 2.
  await resetDemoState(page)
  await previewPackage(page, 'Paket 1')
  await page.goto('/rezervacija/studio-lana')
  await expect(
    page.getByRole('heading', { name: /Online rezervacije su isključene/ }),
  ).toBeVisible()
})

test('guest picks a day from the scrollable date strip', async ({ page }) => {
  await page.goto('/rezervacija/studio-lana')
  await page.getByRole('button', { name: /Žensko šišanje/ }).click()
  await page.getByRole('button', { name: /Lana Jovanović/ }).click()

  const strip = page.getByRole('group', { name: 'Izaberite datum' })
  await expect(strip).toBeVisible()
  const selectedDay = page.locator('[data-date-key][aria-pressed="true"]')
  // Wait for the strip's own first-free-day choice to settle.
  await expect
    .poll(async () => await selectedDay.getAttribute('aria-label'), { timeout: 5_000 })
    .toMatch(/slobodnih termina$/)
  const startLabel = await selectedDay.getAttribute('aria-label')

  // The guest can scroll to a later day and tap it, not just the first few on screen.
  await expect
    .poll(async () => strip.evaluate((el) => el.scrollWidth > el.clientWidth + 1))
    .toBe(true)
  const laterDay = page.locator('[data-date-key]').nth(6)
  await laterDay.scrollIntoViewIfNeeded()
  await laterDay.click()
  await expect
    .poll(async () => await selectedDay.getAttribute('aria-label'), { timeout: 5_000 })
    .not.toBe(startLabel)
})
