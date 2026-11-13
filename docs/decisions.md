# Decisions

The founder approved the Milestone A plan and the defaults below on **10.11.2026** (Europe/Sarajevo).
Changes must be recorded here before they are implemented. Nothing in this file claims that the
pilot backend already exists.

## Founder product decisions

| #   | Decision                       | Chosen default                                                                   | Status                  |
| --- | ------------------------------ | -------------------------------------------------------------------------------- | ----------------------- |
| 1   | Public booking outcome         | **Auto-confirm** immediately on submit                                           | Approved for pilot plan |
| 2   | “Any available hairdresser”    | **Not included**; guest picks a specific hairdresser                             | Approved                |
| 3   | Public booking lead time       | **60 minutes** ahead                                                             | Approved                |
| 4   | Public booking horizon         | **30 days** ahead                                                                | Approved                |
| 5   | Guest cancel/reschedule cutoff | **2 hours** before the appointment                                               | Approved                |
| 6   | Trial length                   | **14 days**, extendable manually                                                 | Approved                |
| 7   | Trial expiry behavior          | **Notice only**, manually managed; no feature lock                               | Approved                |
| 8   | Staff accounts                 | **Owner account only** initially; membership model and `hairdresser_id` retained | Approved                |
| 9   | Service duration               | **One duration per service**, same for all hairdressers                          | Approved                |
| 10  | Guest phone verification       | **None** in the controlled pilot; documented impersonation/spam risk             | Approved with risk      |

## Engineering defaults

- Slot step is **15 minutes**; appointment duration is independent of the step.
- Weekly working hours are interpreted in **Europe/Sarajevo**; instants are stored as UTC.
- Appointment, service-name, duration and price snapshots are preserved on later service edits.
- Guest management token: 32 random bytes, only its hash is stored, token travels in the URL
  **fragment** and is sent in request bodies. It expires 24 hours after appointment end; reschedule
  extends it. No SMS/email fallback for a lost link.
- Guest duplicate handling: a unique exact normalized-phone match inside the salon is reused without
  overwriting the stored name or notes. Zero or multiple matches create a new client.
- Salon downgraded from Paket 2: existing online appointments remain manageable until their cutoff;
  no new public bookings. This becomes server-enforced in the pilot.
- Packages/trials are changed by management CLI in the pilot, never by a public billing flow. Trial
  expiry never silently activates a paid charge.
- The demo starts on Paket 2; the package switch is a demo-only control and is labelled as such.
- Demo settings are read-only except time blocks and the package preview. Service/hairdresser/working-
  hours editing belongs to pilot integration.
- Week view and drag-and-drop are out of Milestone A. Day view + mobile agenda are in A; a week view
  is required before pilot sign-off and will be added during integration.
- The demo calendar is custom-built rather than a third-party calendar. This avoids paid resource
  views and lets the day view fit the mobile-first design. No paid calendar dependency is present.
- Local fonts: Fraunces Variable and Instrument Sans Variable, bundled through Fontsource, OFL-1.1,
  Latin Extended included. No external font CDN.
- Form date controls use explicit day-first selects so the visible format is **DD.MM.YYYY** regardless
  of browser locale.
- A guest confirmation never says or implies that an SMS/email was sent.
- No third-party analytics and no fabricated testimonials, charts or usage metrics.

## Dependencies and tooling

- React 19.3.1, Vite 8.3.7, React Router 8.5.1, TanStack Query 5.107.1, React Hook Form 7.91.0,
  Zod 4.6.7, Tailwind CSS 4.3.5, Radix UI primitives, date-fns 4.4.0 + @date-fns/tz 1.5.0,
  lucide-react, Sonner, Fontsource 5.3.0.
- TypeScript **5.9.3** (not TS 7) because typescript-eslint supports `<6.1.0`.
- ESLint **9.39.5** (not ESLint 10) because eslint-plugin-jsx-a11y supports up to ESLint 9.
- Playwright **1.64.1** to match the browser runtime available during Milestone A; CI installs the
  same version. Vitest 5.1.0, Testing Library, jsdom 31, Prettier 3.9.10.
- Lockfile committed. No paid dependencies.
- Client-side demo is behind a `SalonGateway` contract. The future HTTP gateway must implement the
  same public/internal separation, stable error codes and token rules.

## Public demo hosting

- The repository is public at <https://github.com/dzenanramic/moj-friz>; `main` is the source of the
  static demo.
- The demo is hosted on Vercel (Hobby) as a static site. Vercel project settings: **Root Directory**
  `frontend`, framework preset **Vite**. `frontend/vercel.json` sets the install, build and output
  configuration explicitly because the Vite preset otherwise ignores `buildCommand` and
  `outputDirectory`. No environment variables are needed; there is no server-side data.
- `main` deploys to the production URL; every other branch and pull request is a preview deployment.
- The strict CSP is kept as a production rule and is not weakened for Vercel preview tooling; see
  [security notes](security.md).

## Deliberately deferred

- Staff login and staff-specific permissions UI.
- Any public signup, password-reset email or fake email flow.
- SMS, email, payments, invoicing, marketplace.
- Phone verification/OTP.
- Rate limiting, idempotency and server-side hard constraints are **not** present in the demo; they
  belong to the pilot backend and must not be claimed now.
- Production backups and monitoring.

## Honesty rules

- The demo is not proof of backend guarantees.
- No benchmark or scalability claim may be added without a measured run and documented environment.
- The privacy notice is a draft for owner/legal review, not a compliance claim.
