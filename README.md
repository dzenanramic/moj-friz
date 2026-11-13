# Moj Friz — visual demo

A calm, mobile-first digital appointment book for an independent salon in Banja Luka, built as a
**frontend-only visual demo**. The fictional demo salon is **Studio Lana**; all names, phone numbers,
appointments and notes are invented.

> **Status: Milestone A only.** There is no backend, database, authentication or real booking. The
> static demo is deployed on Vercel, but nothing in it proves production tenancy, concurrency or
> security. Read [docs/known-limitations.md](docs/known-limitations.md) before showing it.

## Live demo

The demo is deployed from `main` on Vercel. Setup and the known preview-toolbar limitation are
described in [docs/deployment.md](docs/deployment.md).

## Run it

Prerequisites: **Node.js 24+**, **pnpm 11+**.

```bash
./scripts/demo.sh
```

The script installs dependencies on first run and starts the demo at
<http://127.0.0.1:5173>. No environment variables, database or account are needed.

Manual alternative:

```bash
cd frontend
pnpm install --frozen-lockfile
pnpm dev
```

If you need to open the demo on a phone in the same local network, run
`pnpm dev --host 0.0.0.0` from `frontend/` and use the printed LAN address.

## URLs

| URL                        | What it is                                                |
| -------------------------- | --------------------------------------------------------- |
| `/`                        | Demo access and a small live preview of today             |
| `/danas`                   | Today's agenda for the salon owner                        |
| `/kalendar`                | Day view, staff filter, breaks and quick entry            |
| `/klijenti`                | Client search and basic history                           |
| `/postavke`                | Package, services, hairdressers, working hours            |
| `/rezervacija/studio-lana` | Guest-facing public booking (Paket 2)                     |
| `/upravljanje`             | Private guest management link (token in the URL fragment) |

The demo starts on **Paket 2**. Use the bar at the top to preview **Paket 1**; public booking is
locked there. “Resetuj demo” restores the seed and returns to the access screen.

## What works in this milestone

- Fictional salon, three hairdressers, six services, fictional clients and appointments relative to
  today.
- Day calendar with staff columns, breaks, free/busy space, date navigation and hairdresser filter.
- Add, edit, reschedule and cancel appointments; mark completed/no-show; conflict and working-hours
  messages.
- Add a break or absence and see it reflected in availability.
- Guest booking flow: service, specific hairdresser, date, free slot, name/phone, privacy
  acknowledgement, on-screen confirmation.
- Private guest management via a token in the URL fragment: reschedule/cancel within the demo cutoff.
- Level 1/Level 2 demo switch and informational subscription pricing.
- Fully in-memory/localStorage demo state behind a gateway contract; no API calls and no real data.

The demo does **not** send SMS or email, collect payments, use real authentication or persist
anything outside the browser.

## Checks

From `frontend/`:

```bash
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm build
pnpm e2e
```

Playwright needs its Chromium browser installed once (`pnpm exec playwright install chromium`).
Smoke tests run the demo UI only; they are not evidence of backend guarantees.

## Project layout

```text
frontend/       Vite + React + TypeScript demo
  src/data/     gateway contract, DTOs and TanStack Query hooks
  src/demo/     seed, in-memory store, demo gateway and token handling
  src/features/ owner, settings and public booking screens
  e2e/          Playwright demo smoke tests
docs/           scope, decisions, demo script, deployment and limitations
scripts/        one-command demo launcher
```

## Documentation

- [Product scope](docs/product-scope.md)
- [Decisions](docs/decisions.md)
- [Demo script](docs/demo-script.md)
- [Known limitations](docs/known-limitations.md)
- [Deployment notes](docs/deployment.md)
- [Security notes](docs/security.md)
- [Pilot readiness checklist](docs/pilot-checklist.md)
- [Backup and restore draft](docs/backup-restore.md)
- [Third-party notices](THIRD_PARTY_NOTICES.md)

## Data warning

Do not type real client data into this demo. Anything entered into the demo stays in that browser’s
localStorage and is not protected by a real backend. Use invented names and dummy phone numbers.
