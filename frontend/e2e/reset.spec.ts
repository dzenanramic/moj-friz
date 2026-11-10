import { expect, test } from '@playwright/test'

test('reset restores the starting demo state', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Prikaži Paket 1' }).click()
  await expect(page.getByText('Prikaz je prebačen na Paket 1.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Prikaži Paket 1' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )

  await page.getByRole('button', { name: 'Resetuj demo' }).click()
  const confirm = page.getByRole('alertdialog')
  await expect(confirm).toBeVisible()
  await confirm.getByRole('button', { name: 'Resetuj demo' }).click()

  await expect(page.getByRole('button', { name: 'Prikaži Paket 2' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(page.getByText('Demo je resetovan na početno stanje.')).toBeVisible()
})
