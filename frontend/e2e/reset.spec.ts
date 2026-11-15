import { expect, test } from '@playwright/test'

import { previewPackage, resetDemoState } from './helpers'

test('reset restores the starting demo state', async ({ page }) => {
  await resetDemoState(page)
  await previewPackage(page, 'Paket 1')

  // Level 1 is shown on the calendar; the reset brings the demo back to Paket 2 and to tap 0.
  await page.getByRole('button', { name: 'Resetuj demo' }).click()
  const confirm = page.getByRole('alertdialog')
  await expect(confirm).toBeVisible()
  await confirm.getByRole('button', { name: 'Resetuj demo' }).click()

  await expect(page.getByText('Demo je resetovan na početno stanje.')).toBeVisible()
  // A reset package is shown as the current one in Postavke, where the switch lives.
  await expect(page).toHaveURL(/\/$/)
  await page.goto('/postavke')
  await expect(page.getByRole('button', { name: 'Prikaži Paket 1 u demou' })).toBeVisible()
})
