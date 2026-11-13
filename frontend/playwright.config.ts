import { defineConfig, devices } from '@playwright/test'

/** Browser override, e.g. `PW_CHANNEL=chrome pnpm exec playwright test`. */
const channel = process.env.PW_CHANNEL || undefined

export default defineConfig({
  testDir: './e2e',
  timeout: 40_000,
  expect: { timeout: 8_000 },
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:5173',
    timezoneId: 'Europe/Sarajevo',
    locale: 'bs-BA',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      testIgnore: /browser\//,
      use: { ...devices['Desktop Chrome'], channel, viewport: { width: 1440, height: 1000 } },
    },
    {
      name: 'mobile',
      testIgnore: /browser\//,
      use: {
        ...devices['Desktop Chrome'],
        channel,
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      // Opt-in check of the built site served with frontend/vercel.json (see
      // e2e/browser/vercel-config.spec.ts). Starts its own server for `dist`; not part of the
      // default `pnpm e2e` run.
      name: 'browser',
      testMatch: /browser\/.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], channel, baseURL: 'http://127.0.0.1:4174' },
    },
  ],
  webServer: [
    {
      command: 'pnpm dev --host 127.0.0.1 --port 5173',
      url: 'http://127.0.0.1:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: 'node e2e/browser/serve-vercel-json.mjs',
      url: 'http://127.0.0.1:4174',
      reuseExistingServer: true,
      timeout: 30_000,
    },
  ],
})
