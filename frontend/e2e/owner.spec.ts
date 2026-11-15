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
  // The calendar names the day on the selected day cell (it no longer prints a subtitle).
  await expect(page.locator('button[aria-current="date"]')).toHaveAttribute(
    'aria-label',
    formatSalonDateLong(dateKey),
  )
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

test('owner adds a break from the working hours page', async ({ page }) => {
  // Breaks are entered in Settings; the calendar only shows them. This test used to start
  // from a calendar button that no longer exists.
  await page.goto('/postavke/radno-vrijeme')
  await page.getByRole('button', { name: 'Dodaj pauzu' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'Dodaj u raspored' }).click()

  await expect(page.getByText(/Pauza/).first()).toBeVisible()
})

test('the day strip scrolls sideways and selects a day by tap', async ({ page }) => {
  await page.goto('/kalendar')
  const strip = page.getByRole('group', { name: 'Izaberite dan' })
  await expect(strip).toBeVisible()
  const selected = page.locator('button[aria-current="date"]')
  await expect(selected).toBeVisible()
  const startKey = await selected.getAttribute('data-date-key')

  // The strip is a scroller: it holds more days than fit, and a later day is reachable.
  const scrollable = await strip.evaluate((el) => el.scrollWidth > el.clientWidth + 1)
  expect(scrollable).toBe(true)

  const laterDay = page.locator('[data-date-key]').nth(9)
  const laterKey = await laterDay.getAttribute('data-date-key')
  expect(laterKey).not.toBe(startKey)
  await laterDay.scrollIntoViewIfNeeded()
  await laterDay.click()
  await expect(selected).toHaveAttribute('data-date-key', laterKey ?? '')
})

test('picking a later day keeps the earlier days in the strip', async ({ page }) => {
  await page.goto('/kalendar')
  const strip = page.getByRole('group', { name: 'Izaberite dan' })
  const cells = strip.locator('[data-date-key]')
  const originalKeys = await cells.evaluateAll((els) =>
    els.map((el) => el.getAttribute('data-date-key')),
  )
  const firstKey = originalKeys[0]

  // Choose a day a few places in: the strip must not re-anchor on it.
  const laterDay = cells.nth(5)
  const laterKey = await laterDay.getAttribute('data-date-key')
  await laterDay.scrollIntoViewIfNeeded()
  await laterDay.click()
  await expect(page.locator('button[aria-current="date"]')).toHaveAttribute(
    'data-date-key',
    laterKey ?? '',
  )

  const keysAfter = await cells.evaluateAll((els) =>
    els.map((el) => el.getAttribute('data-date-key')),
  )
  expect(keysAfter).toEqual(originalKeys)
  expect(keysAfter[0]).toBe(firstKey)

  // The earlier day is still on screen and can be brought back into view.
  await page.locator(`[data-date-key="${firstKey}"]`).scrollIntoViewIfNeeded()
  await page.locator(`[data-date-key="${firstKey}"]`).click()
  await expect(page.locator('button[aria-current="date"]')).toHaveAttribute(
    'data-date-key',
    firstKey ?? '',
  )
})
