import { expect, test } from '@playwright/test'

import { formatSalonDateLong, nextOpenDateKey, submitNewClientAppointment } from './helpers'

test('owner adds, reschedules and cancels an appointment', async ({ page }) => {
  const dateKey = nextOpenDateKey(7)
  const clientName = 'E2E Klijent'

  await page.goto('/')
  await page.getByRole('link', { name: 'Uđi u demo' }).click()
  await expect(page.getByRole('heading', { name: 'Danas', exact: true })).toBeVisible()

  await submitNewClientAppointment(page, {
    dateKey,
    clientName,
    phone: '061 999 001',
  })

  await page.goto(`/kalendar?datum=${dateKey}`)
  await expect(page.getByText(formatSalonDateLong(dateKey))).toBeVisible()
  const row = page.getByRole('button', { name: new RegExp(clientName) }).first()
  await expect(row).toBeVisible()
  await row.click()

  const editDialog = page.getByRole('dialog')
  await expect(editDialog.getByRole('button', { name: 'Sačuvaj izmjene' })).toBeVisible()
  await expect(editDialog.locator('fieldset button').nth(1)).toBeVisible()
  await editDialog.locator('fieldset button').nth(1).click()
  await editDialog.getByRole('button', { name: 'Sačuvaj izmjene' }).click()
  await expect(editDialog).toBeHidden()

  await expect(page.getByRole('button', { name: new RegExp(clientName) }).first()).toBeVisible()
  await page
    .getByRole('button', { name: new RegExp(clientName) })
    .first()
    .click()
  await page.getByRole('button', { name: 'Otkaži termin' }).click()
  const confirm = page.getByRole('alertdialog')
  await expect(confirm).toBeVisible()
  await confirm.getByRole('button', { name: 'Otkaži termin' }).click()
  await expect(confirm).toBeHidden()
  await expect(page.getByRole('button', { name: new RegExp(clientName) })).toHaveCount(0)
})

test('owner adds a break that blocks availability', async ({ page }) => {
  const dateKey = nextOpenDateKey(7)

  await page.goto(`/kalendar?datum=${dateKey}`)
  await page.getByRole('button', { name: 'Dodaj pauzu' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await dialog.locator('#break-start').selectOption('16:45')
  await dialog.locator('#break-end').selectOption('17:00')
  await dialog.getByRole('button', { name: 'Dodaj u raspored' }).click()
  await expect(dialog).toBeHidden()

  await page.goto('/postavke/radno-vrijeme')
  await expect(page.getByText('16:45–17:00').first()).toBeVisible()
})
