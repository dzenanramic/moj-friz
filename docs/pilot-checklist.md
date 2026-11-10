# Pilot readiness checklist

**Current state: Milestone A only. The pilot is not ready.** This checklist prevents the demo from
being mistaken for a working pilot. Update it only after checks actually run.

## Gate A — visual demo

- [x] Frontend runs with `./scripts/demo.sh` and no backend.
- [x] Fictional salon, three hairdressers, services, clients, appointments relative to today.
- [x] Level 1 and Level 2 previews; public booking locked in Paket 1.
- [x] Demo bar “Demo — podaci nisu stvarni” and reset.
- [x] Add/edit/reschedule/cancel appointment; add break; public booking; confirmation; management.
- [x] Bosnian UI, KM, DD.MM.YYYY, 24-hour time, Europe/Sarajevo.
- [x] Mobile/desktop visual QA; keyboard/accessibility review.
- [x] Typecheck, lint, unit/component tests, build and Playwright smoke tests pass.
- [x] Demo script, scope, decisions, deployment notes and known limitations.
- [ ] Founder sign-off after seeing the demo. **This is the current stop.**

## Gate B — pilot backend

- [ ] FastAPI/SQLAlchemy/Alembic/PostgreSQL project and Docker Compose.
- [ ] Migrations pass on a fresh database.
- [ ] Real owner authentication, Argon2id, opaque sessions, CSRF and Origin checks.
- [ ] Tenant isolation by membership; cross-salon read/write/FK tests.
- [ ] Database-level overlap constraint for appointments and blocks.
- [ ] Working-hours change protection; concurrent booking/block tests.
- [ ] Public Level 2 enforcement on the backend, public DTOs and management tokens.
- [ ] Lead/horizon/cutoff, idempotency and DST tests.
- [ ] Real PostgreSQL integration tests; no SQLite substitute.
- [ ] Gate B review; do not connect real UI yet.

## Gate C — integration

- [ ] Real login/logout UI and session bootstrap.
- [ ] HTTP gateway replaces demo gateway in production mode.
- [ ] Public booking and management operate against the real API.
- [ ] Week view and settings editing needed for the Level 1 pilot.
- [ ] Playwright flows use the real API/PostgreSQL.
- [ ] Security and concurrency review against the deployed architecture.
- [ ] Demo build remains clearly separate from the pilot build.

## Gate D — pilot readiness

- [ ] HTTPS, same-origin `/api`, restricted runtime DB role, migrations and secrets documented.
- [ ] Encrypted off-host backups scheduled; restore drill completed.
- [ ] Operational checklist, rollback notes, health checks, structured logs/request IDs.
- [ ] Privacy notice reviewed by the owner/legal advisor; export/deletion procedure documented.
- [ ] Synthetic dataset (several salons, 5,000 clients) and lightweight load test **actually run**;
      dataset, concurrency, hardware, latency and error rate recorded.
- [ ] Known limitations reviewed and accepted by the founder.
- [ ] Written approval to invite pilot salons.

## Before each salon visit

- [ ] Start from a fresh demo/reset.
- [ ] No real client data entered.
- [ ] Phone and desktop views checked.
- [ ] Demo script reviewed.
- [ ] Questions for discovery prepared.
- [ ] No claim of SMS/email, payments, live availability or production security.
