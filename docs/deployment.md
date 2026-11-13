# Deployment notes — visual demo

**Status: static demo only.** The demo is published on Vercel from
<https://github.com/dzenanramic/moj-friz> (`main`, Hobby plan). No paid resource exists and there is
no server-side data. This document describes the static deployment of the Milestone A build.

## Local production build

```bash
cd frontend
pnpm install --frozen-lockfile
pnpm build
pnpm preview
```

The build output is `frontend/dist`. It is a static single-page app. There is no backend and no
environment variable to configure.

## Vercel deployment

The repository root is the project root, so the Vite app lives in `frontend/`. `frontend/vercel.json`
provides:

- install command `pnpm install --frozen-lockfile`;
- build command `pnpm run build` (typecheck + `vite build`);
- output directory `dist`;
- SPA rewrite to `/index.html` so deep links such as `/rezervacija/studio-lana` and `/upravljanje`
  work on refresh;
- security headers: `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: no-referrer`,
  `X-Content-Type-Options: nosniff`, a restrictive Permissions Policy and the strict CSP described
  in [security notes](security.md).

The install, build and output values are set explicitly in `vercel.json` on purpose. The Vite
framework preset otherwise supplies its own `vite build` command and `dist` output and ignores the
`buildCommand`/`outputDirectory` values in `vercel.json`, which would skip the typecheck. The values
match the preset, so the same configuration also works on other static hosts.

### One-time project setup (import from GitHub)

1. Vercel → **Add New → Project** → import `dzenanramic/moj-friz`.
2. **Root Directory**: `frontend` (Edit → select the folder).
3. **Framework Preset**: Vite. Leave the build settings as detected — `vercel.json` defines them.
4. No environment variables. Node.js version: 24 (from `frontend/.nvmrc` and `package.json`).
5. **Deploy**.

After that, every push to `main` publishes to the production URL, and every other branch or pull
request gets a preview URL. The Vercel CLI (`vercel --prod`) is not required.

### Checking the deploy contract locally

The `browser` Playwright project serves the built `dist` with the real `vercel.json` rules and checks
the rewrite, the headers and that the app boots under the CSP:

```bash
cd frontend
pnpm build
PW_CHANNEL=chrome pnpm exec playwright test --project=browser
```

`PW_CHANNEL=chrome` uses your installed Chrome instead of downloading a Playwright browser.

## Terms and cost

Vercel Hobby is a personal, non-commercial plan for this demo. Check the current terms before using
any deployment commercially; provider terms change and are not claimed here.

## Other static hosts

The app uses BrowserRouter paths, so an equivalent rewrite to `index.html` and the same headers are
required on any other static host. If a host cannot rewrite unknown paths to `index.html`, deep
links will 404; that is a hosting limitation, not a backend.

## Browser and network behaviour

- Fonts and code are bundled locally; there is no font CDN, analytics or third-party script.
- The static demo needs no network access after assets are loaded.
- It stores fictional demo data in localStorage on the device.
- The token in a private management link is in the URL fragment, which browsers do not send to the
  server or include in the `Referer` header. Deployment logs should still be treated as sensitive.

## Rollback

A static demo rolls back by redeploying the previous build artifact or reverting the deployment in
the host UI. Do not reset or replace user data because there is no server-side user data in this
milestone.

## Later

Pilot deployment, HTTPS, same-origin `/api` routing, migrations, secrets, health checks, backups and
the restore drill are Milestone B–D work. They are not implemented here and must not be inferred from
this static build.
