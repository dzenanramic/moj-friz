# Security notes

## Current scope: demo only

There is **no authentication, backend, database or server-side authorization** in Milestone A. The
demo cannot prove tenant isolation, concurrency safety, rate limiting or data protection. Any
security claim about the pilot must wait for Milestone B/C tests and review.

## Demo boundaries

- All data is fictional and stored in the browser’s localStorage. Do not enter real client data.
- No passwords, admin secrets or API keys are embedded in the demo bundle.
- No third-party analytics, tracking pixels, external fonts or remote scripts are used.
- Health, appointment or client information is not sent anywhere by the app.
- Management links are modelled correctly even though the demo is client-side:
  - a high-entropy token is generated in the browser;
  - only a SHA-256 hash is stored in demo state;
  - the raw token is placed in a URL fragment and sent in an action call, not a query string;
  - the page treats it as a bearer credential.
- This modelling does not make the demo secure against a determined local attacker or browser
  extension. It is not evidence for production.
- The public booking form includes a honeypot field. It is a demo-quality abuse deterrent, not a
  substitute for server-side rate limiting or phone verification.
- The static deployment includes `Referrer-Policy: no-referrer`, `X-Frame-Options: DENY`, a
  restrictive CSP and other basic headers. Those headers do not secure an absent backend.

## Privacy posture

- Collect only name, phone, service, appointment time and optional non-sensitive salon notes.
- The demo warns owners not to record health or other sensitive data.
- The privacy page is a draft marked for owner/legal review. It is not a compliance claim.
- Real export/deletion procedures, backup-retention implications and a retention policy belong to
  the pilot and are not implemented.

## Planned pilot controls (not built)

- Argon2id password hashing; opaque server-side sessions with hashed tokens; HttpOnly cookies.
- CSRF protection plus Origin checks for cookie-authenticated changes.
- Explicit CORS allowlist; same-origin deployment preferred.
- Every protected query scoped by authenticated salon membership; no trust in caller-supplied salon
  IDs.
- PostgreSQL composite tenant foreign keys and server-side plan enforcement.
- Database exclusion constraints for overlapping schedule entries; transactional locking for schedule
  changes.
- Hashed guest tokens, expiry/revocation, body-only token transport, public-safe response schemas.
- Configurable login/public booking rate limits. If they remain process-local, that limitation must
  be documented.
- Structured logs with request IDs and redaction; no raw tokens, passwords or unnecessary PII.
- Backups encrypted and stored off-host, with a tested restore procedure.
- No SMS/email/payment provider until explicitly approved.

## Reporting

Never state that security, concurrency or backups are proven because the demo looks correct. The
approval gates require tests against real PostgreSQL and a documented operational drill.
