import { expect, test } from '@playwright/test'

import { formatSalonDateLong, nextOpenDateKey } from './helpers'

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
  await expect(page.getByRole('heading', { name: 'Vidimo se u salonu.' })).toBeVisible()
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
  await expect(page.getByText('Otkazan', { exact: true })).toBeVisible()
})

test('Level 1 shows an honest lock instead of public booking', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Prikaži Paket 1' }).click()
  await expect(page.getByText('Prikaz je prebačen na Paket 1.')).toBeVisible()
  await page.goto('/rezervacija/studio-lana')
  await expect(
    page.getByRole('heading', { name: /Online rezervacije su isključene/ }),
  ).toBeVisible()
})
