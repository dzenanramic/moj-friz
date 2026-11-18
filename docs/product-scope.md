# Product scope

Moj Friz is a validation project for an independent founder in Banja Luka, Bosnia and Herzegovina.
The immediate goal is a convincing visual demo for conversations with salon owners, followed by a
small, reliable pilot for a few salons. It is deliberately not an enterprise platform.

## Validation goal

- Show a salon owner what a focused digital appointment book looks like in under five minutes.
- Learn whether salons will pay for a simple tool and whether online booking matters to them.
- Keep initial spending and operational complexity low.
- Validate with real salons before adding billing, messaging or a marketplace.

## Packages

Prices are shown as **KM** per **active hairdresser per month**. No automatic billing is implemented.

### Paket 1 — 19 KM / active hairdresser / month

- Calendar, day/week schedule and staff filter.
- Manual booking, rescheduling and cancellation.
- Hairdresser working hours, multiple intervals per day, breaks and date-specific time off.
- Basic client records and history.
- Completed/no-show status.
- Owner account manages all hairdressers.

### Paket 2 — 29 KM / active hairdresser / month

Everything in Paket 1 plus:

- Public salon page.
- Guest chooses service, specific hairdresser and available time.
- On-screen confirmation.
- Private management link for rescheduling or cancellation within salon rules.
- No SMS or email in the initial product.
- **No “any available hairdresser” option in the first pilot.**

## Milestone A — visual demo (current)

Frontend only. Fictional salon and data, demo package switch, reset, public booking and private
management flows, accessible responsive UI, and a read-only statistics report in Settings for the
last 7 or 30 full days. State lives in localStorage. No backend, no accounts, no deployment. See
[known-limitations.md](known-limitations.md).

## Milestone B — pilot backend

FastAPI + SQLAlchemy + Alembic + PostgreSQL, real authentication, tenant isolation, scheduling logic,
database-level overlap protection, management CLI and tests against PostgreSQL. This is not built yet.

## Milestone C — integration

Connect the current UI to the real API, add real login/session handling and the Level 1 pilot’s week
view and settings editing. Replace demo-only controls in production builds. Security and concurrency
tests operate against the real API.

## Milestone D — pilot readiness

Deployment instructions, backups and restore drill, operational checklist, privacy draft, measured
load test, documented known limitations. No scalability claims without measurements.

## Explicit exclusions

- Marketplace, native mobile app, reviews/loyalty, inventory, AI features.
- SMS, email delivery, payment collection, card storage, invoicing, fiscalization or automatic
  subscription charging.
- Recurring appointments and overnight working shifts in the first product.
- Sensitive medical or health records.
- Complex reporting or multi-location chains.
- Paid third-party services without approval.
- Marketing website.
- Drag-and-drop as a requirement; rescheduling is form-based.

## Non-negotiable pilot properties

- Each salon is isolated; a caller cannot reach another salon by guessing IDs.
- A slot cannot be double-booked, including a block/appointment race.
- Guest management links are high-entropy bearer credentials and are stored hashed.
- A guest sees only their own appointment, never internal notes or other clients.
- The interface never implies that an SMS or email was sent.
- Trial/package information is informative; no silent paid activation.
- Honest reporting: tests that were not run are not called passing.
