# Known limitations — Milestone A

This file is intentionally blunt. The visual demo is useful for validation; it is not a pilot-ready
product.

## Not implemented at all

- Backend, database, migrations, deployment, uptime or monitoring.
- Real authentication, sessions, owner accounts, staff logins or password reset.
- Real tenant isolation, cross-tenant protection or server-side authorization.
- Real public booking endpoint, database-level exclusion constraints or transactional scheduling.
- Email, SMS, reminders or notification delivery.
- Payments, subscription charging, invoices or fiscalization.
- Rate limiting, server-side idempotency, abuse controls or phone verification.
- Backup, restore, export or deletion procedures.
- Privacy compliance, legal review or data-processing agreements.
- Marketplace, reviews, loyalty, inventory, reporting, AI, native apps, multi-location support.
- Week view (planned before pilot sign-off), recurring appointments, overnight shifts.
- Editing services, hairdressers, weekly hours or salon policy in the demo; those screens are
  read-only except time blocks and the demo package switch.

## Demo-specific limitations

- State lives in the browser’s localStorage (`mojfriz.demo.v1`); it is not shared between browsers or
  devices and is lost when that storage is cleared. A separate “Resetuj demo” restores the seed.
- Seed appointments are generated relative to the day the demo is opened. Only times still ahead are
  pre-booked and every working hairdresser gets appointments, so a day opened late is still a day of
  work, not a page of finished history. The demo script says this openly.
- Every day of the week is a demo working day, Sunday included, and the seed guarantees at least ten
  appointments a day for three weeks (seven days back, twenty ahead). A state seeded on an earlier
  day is reseeded when it is next opened: the demo moves with the calendar, and guest bookings the
  stored state holds are carried over with their private links. Edits made within the day are kept.
- The demo’s scheduling and conflict rules are client-side illustrations. They are **not** the
  production scheduling guarantee and do not exercise PostgreSQL exclusion constraints.
- The guest management token is hashed in localStorage and travels in a URL fragment, but the link
  is still just a bearer credential. Anyone with the link can manage that fictional appointment.
- Phone numbers are invented and are not verified. The demo does not claim ownership of a phone.
- No SMS or email is sent. The interface says this explicitly and asks the guest to save the private
  link.
- The package switch is a demo control. It is not billing and does not create a paid subscription.
- Trial expiry is a notice-only display in the pilot plan; the demo does not run a real trial clock
  or lock features.
- No real client data should be entered. Do not put medical or other sensitive information in notes.
- The demo has no third-party analytics. The only runtime assets are bundled local fonts and scripts.
  Vite’s dev server is used locally; the production build is a static SPA.
- A deployed static preview requires SPA rewrites for deep links; `vercel.json` is included, but no
  provider account has been created and no deployment has been performed.
- The demo was verified in Chromium via Playwright and reviewed at phone/desktop viewports. It has
  not been exhaustively tested on every browser or screen reader. One-command local start and the
  documented checks are the supported path.

## Risks to carry into the pilot

- Auto-confirm means a guest can create a booking without salon approval. The cutoff and cancellation
  policy must be clear.
- No phone verification means impersonation/spam risk. The pilot is controlled; public traffic must
  not be considered safe until abuse controls are reviewed.
- A management link is a bearer credential. Logs, referrers and third-party scripts must never expose
  it; the production design must keep it out of query strings and access logs.
- Trial expiry and subscription status are manually managed. Operational discipline is required; the
  software must not silently imply a charge.
- DST, concurrent changes, working-hours changes and duplicate submissions are backend concerns.
  The demo’s client-side checks are not sufficient evidence for any of them.

## What the demo does prove

- The intended screens and workflows can be understood by a salon owner on phone and desktop.
- The core actions can be completed without drag-and-drop, accounts or training.
- The Level 1 / Level 2 distinction and the honesty requirements around messaging and billing can be
  communicated clearly.
