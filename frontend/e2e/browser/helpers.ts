import type { Page } from '@playwright/test'

export function trackPageErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(String(error)))
  return errors
}

export async function gotoAndSettle(page: Page, url: string, root: string) {
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.locator(root).waitFor({ state: 'attached', timeout: 10_000 })
}
