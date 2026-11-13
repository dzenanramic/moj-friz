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
- The static deployment includes `Referrer-Policy: no-referrer`, `X-Frame-Options: SAMEORIGIN`, a
  restrictive CSP and other basic headers. Those headers do not secure an absent backend.

## Deployed CSP

`frontend/vercel.json` sends this policy on every response:

```text
default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;
font-src 'self'; connect-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'
```

- Vercel overrides the `Content-Security-Policy` key from a `vercel.json` header rule with its own
  default policy, so the CSP must stay in `vercel.json` even when the app stops being a plain static
  site. `frontend/e2e/browser/` checks the header exactly as served.
- `script-src 'self'`: the app is bundled locally with no inline script. Vite’s module-preload
  polyfill is an inline script extension, so `build.modulePreload.polyfill` is disabled in
  `vite.config.ts` to keep this directive strict.
- `style-src 'unsafe-inline'`: React inline `style` attributes require it.
- `frame-ancestors 'self'` plus `X-Frame-Options: SAMEORIGIN` allow framing by the same origin only.
  This keeps the Vercel dashboard’s preview frame working. The app stores no credentials and its data
  is fictional, so same-origin framing is not a meaningful risk here.
- Versioned asset URLs make the SPA rewrite safe: the app does not define a `/assets/*` route, so it
  never requests a missing asset as HTML.
