# Deployment notes — visual demo

**Status: nothing has been deployed. No provider account, paid resource or credentials were created.**
This document describes a possible static deployment of the Milestone A build.

## Local production build

```bash
cd frontend
pnpm install --frozen-lockfile
pnpm build
pnpm preview
```

The build output is `frontend/dist`. It is a static single-page app. There is no backend and no
environment variable to configure.

## Vercel-compatible settings

The included `frontend/vercel.json` provides:

- install command `pnpm install --frozen-lockfile`;
- build command `pnpm run build`;
- output directory `dist`;
- SPA rewrite to `/index.html` so deep links such as `/rezervacija/studio-lana` and `/upravljanje`
  work on refresh;
- security headers: CSP, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`,
  `X-Content-Type-Options: nosniff` and a restrictive Permissions Policy.

In the hosting UI, set **Root Directory** to `frontend` and use the settings above. The app uses
BrowserRouter paths, so an equivalent rewrite is required on any other static host. If a host cannot
rewrite unknown paths to `index.html`, deep links will 404; that is a hosting limitation, not a
backend.

## Terms and cost

Check the current free-plan/commercial-use terms of any static host before deploying. Provider terms
change. Do not assume a free plan permits commercial use. No deployment should happen without the
founder’s approval.

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
