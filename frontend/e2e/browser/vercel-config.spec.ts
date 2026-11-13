import { expect, test } from '@playwright/test'

import { gotoAndSettle, trackPageErrors } from './helpers'

/**
 * Validates the exact `frontend/vercel.json` contract without a Vercel account: the SPA rewrite
 * answers unknown deep links with index.html, the headers are served, and the app boots under the
 * strict CSP.
 *
 * Requires a running server for the built site (`pnpm build`, then
 * `node e2e/browser/serve-vercel-json.mjs`) and an installed browser:
 *
 *   pnpm exec playwright test e2e/browser --project=browser --channel=chrome
 */
const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:4174'

test('SPA rewrite serves deep links with the HTML shell', async ({ page }) => {
  for (const path of ['/rezervacija/studio-lana', '/upravljanje', '/nepostoji']) {
    await gotoAndSettle(page, `${BASE}${path}`, '#root')
    expect(page.url(), path).toBe(`${BASE}${path}`)
  }
})

test('security headers and the strict CSP are served', async ({ page }) => {
  const response = await page.request.get(`${BASE}/danas`)
  expect(response.status()).toBe(200)
  const headers = response.headers()
  expect(headers['x-content-type-options']).toBe('nosniff')
  // `SAMEORIGIN` lets the Vercel dashboard frame a preview; `frame-ancestors 'self'` is the
  // equivalent, unconditional rule that also covers browsers ignoring X-Frame-Options.
  expect(headers['x-frame-options']).toBe('SAMEORIGIN')
  expect(headers['referrer-policy']).toBe('no-referrer')
  expect(headers['permissions-policy']).toBe('camera=(), microphone=(), geolocation=()')
  expect(headers['content-security-policy']).toBe(
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'",
  )
})

test('app boots under the strict CSP when an inline script is injected', async ({ page }) => {
  // Simulates a host that injects an inline script, such as Vercel's preview toolbar. The script
  // must be blocked and the app must keep working.
  await page.route(
    (url) => url.pathname === '/' || url.pathname === '/danas',
    async (route) => {
      const response = await route.fetch()
      const html = await response.text()
      const injected = html.replace('</body>', '<script>window.probe = true</script></body>')
      await route.fulfill({ response, body: injected })
    },
  )

  const errors = trackPageErrors(page)
  const violations: string[] = []
  await page.exposeFunction('__recordViolation', (text: string) => violations.push(text))
  await page.addInitScript(() => {
    const target = window as unknown as { __recordViolation?: (text: string) => void }
    document.addEventListener('securitypolicyviolation', (event) => {
      target.__recordViolation?.(`${event.effectiveDirective} ${event.blockedURI}`)
    })
  })

  await gotoAndSettle(page, `${BASE}/danas`, '#root')
  await expect(page.getByRole('navigation', { name: 'Glavna navigacija' })).toBeVisible()
  await expect.poll(() => page.evaluate('window.probe === true')).toBe(false)
  await expect.poll(() => violations.length).toBeGreaterThan(0)
  expect(violations.every((violation) => violation.startsWith('script-src'))).toBe(true)
  expect(errors).toEqual([])
})
