# Decisions

The founder approved the Milestone A plan and the defaults below on **10.11.2026** (Europe/Sarajevo).
Changes must be recorded here before they are implemented. Nothing in this file claims that the
pilot backend already exists.

## Founder product decisions

| #   | Decision                       | Chosen default                                                                                            | Status                  |
| --- | ------------------------------ | --------------------------------------------------------------------------------------------------------- | ----------------------- |
| 1   | Public booking outcome         | **Auto-confirm** immediately on submit                                                                    | Approved for pilot plan |
| 2   | “Any available hairdresser”    | **Not included**; guest picks a specific hairdresser                                                      | Approved                |
| 3   | Public booking lead time       | **60 minutes** ahead                                                                                      | Approved                |
| 4   | Public booking horizon         | **30 days** ahead                                                                                         | Approved                |
| 5   | Guest cancel/reschedule cutoff | **2 hours** before the appointment                                                                        | Approved                |
| 6   | Trial length                   | **14 days**, extendable manually                                                                          | Approved                |
| 7   | Trial expiry behavior          | **Notice only**, manually managed; no feature lock                                                        | Approved                |
| 8   | Staff accounts                 | **Owner account only** initially; membership model and `hairdresser_id` retained                          | Approved                |
| 9   | Service duration               | **One duration per service**, same for all hairdressers                                                   | Approved                |
| 10  | Guest phone verification       | **None** in the controlled pilot; documented impersonation/spam risk                                      | Approved with risk      |
| 11  | Colour palette                 | **Ink blue + copper** on a paper-cream base; dark is a warm near-black blue. The green palette is dropped | Approved 15.11.2026     |
| 12  | Demo seed                      | **Every day has work**: all seven weekdays are demo working days (Sunday opens later and shorter) and each day shows **at least 10 appointments** | Approved 15.11.2026     |
| 13  | Visual direction               | **Print, not SaaS**: a display serif for the salon's voice, copper as a rule (never a button border or fill), hierarchy from hairlines and density rather than repeated rounded cards | Implemented 15.11.2026 |

## Visual direction (decision 13)

The palette below is unchanged. What changed is how it is spent: one focal element per screen, and
beneath it a quiet, ruled, ledgery surface.

- **Type.** Two faces, one job each. **Fraunces Variable** (`--font-display`, imported in
  `src/main.tsx` via `@fontsource-variable/fraunces/opsz.css`) carries the salon's voice and only
  that: `h1`, the `.display` utility, and the salon wordmark. Everything else — every label, button,
  column and number — stays Instrument Sans. The optical-size axis (`opsz 96`, `SOFT 0`, `WONK 0`) is
  why this face was chosen: large sizes get its printed cut rather than a blown-up text weight.
  Latin Extended is bundled, so `Ž`, `š` and `č` resolve here and not in a system fallback.
- **Numbers are never set in the display face.** A clock time is read, not admired: the "now"
  appointments and the day tally stay in the sans with `.tabular` figures. A serif's `1` and `:` do
  not line up as a time.
- **Copper is a rule, never a button border or the loudest fill.** `Button variant="accent"` is a
  solid ink fill (dark mode: the brand blue, because `ink` is near-white there and a cream block
  would out-shout the page) with **no border**. The 3px copper margin rule marks the active sidebar
  screen and the hero headline. Contrast is enforced by `contrast.test.ts` (`surface` on `ink`,
  `accent-ui` on `paper` ≥ 3:1).
- **Hierarchy from a ground ladder, not a card kit.** page `paper` → section rule (a heading over a
  hairline, `SectionHeading`) → object `Panel` (one hairline border, `rounded-md`) → elevated
  `Surface` (shadow; sheets, the launcher preview, the confirmation only). `SectionHeading` is ruled
  rather than boxed so a section is not a card.
- **The calendar is a book, not a spreadsheet.** Gridlines use `--rule-grid` (a hairline token, also
  mirrored in `public/theme-boot.css`); hours outside a hairdresser's day and breaks are hatched
  (`.closed-hatch`), so closed time never reads as a bookable slot.
- **Demo chrome is quiet.** The demo bar is a hairline strip, not a coloured bar; the Paket 1/2
  preview switch lives in Postavke → Paket and nowhere else.
- **`/danas` reads the day in the order it is worked**: the chair in use now, else the next
  appointment, else — once the day is over — the day's tally. The history is below it, never first.
  A fresh demo must never open on a closed salon: the seed fills the current day whatever weekday
  it is (`e2e/owner.spec.ts`, "a fresh demo opens on a working day").


## Palette (decision 11)

Semantic tokens in `frontend/src/styles/index.css`; components name roles (`bg-paper`, `text-ink`),
never colours. Dark values live under `.dark`, not in a media query, so a stored choice can win.

| Role                        | Light                                         | Dark                                          |
| --------------------------- | --------------------------------------------- | --------------------------------------------- |
| paper / surface / line      | `#F6F2EA` / `#FCFAF6` / `#E2DACB`             | `#12151D` / `#1A1E29` / `#2B3142`             |
| ink / muted                 | `#1F2430` / `#4F5A6A`                         | `#ECE8DF` / `#A2A8B8`                         |
| primary / hover / tint / on | `#243B6B` / `#1A2D54` / `#DDE3F0` / `#FCFAF6` | `#8FA6E0` / `#A9BCEA` / `#222C4A` / `#0F1320` |
| accent / tint / on / ui     | `#D1823A` / `#F8E4CF` / `#1F2430` / `#8A4E12` | `#E39A56` / `#3A2A18` / `#12151D` / `#E39A56` |
| brick / tint / ink          | `#B4574B` / `#F2DAD5` / `#963F2D`             | `#DB8579` / `#3B2420` / `#F0A398`             |
| danger / on-danger          | `#A33B2B` / `#FCFAF6`                         | `#E27D6B` / `#1A0F0E`                         |

- Contrast (WCAG 2.2 AA) is enforced by `frontend/src/styles/contrast.test.ts`; the review that
  produced the values above is recorded with the audit script.
- Corrections to the founder's first values, all measured: `muted` light `#626877` → `#4F5A6A`
  (4.02 on `line`, 3.80 on the plum hairdresser card); `brick-ink` and `accent-ui` added because
  brick as text (4.27) and copper as a 3:1 mark (2.70) fail on cream; `accent-ui` is a text-grade
  darkened copper so the same tone can be a pending label and a hairdresser bar (5.92 on paper,
  4.97 on the copper card); hairdresser bar edges 1–6 in light are `#36539A` `#8A4E12` `#983B2F`
  `#7A5A86` `#8A6D14` `#4B5366`; `on-danger` because white on dark `#E27D6B` is 2.85.
  `public/theme-boot.css` repeats these values for the first paint; the contrast test fails if the
  copy drifts.
- One commit per sheet: "Dodaj termin" adds the term and closes the sheet, "Sačuvaj izmjene"
  saves and closes; "Odustani" is the way out without saving.
- Rules: copper is a fill (the one CTA per screen), never text; `muted` never sits inside a
  hairdresser tinted card; `line` is a border, not text. **Amended by decision 13:** the one CTA on
  a screen is a solid ink or brand-blue fill with no border, and copper appears as a rule (nav,
  hero), never as text and never as a button border; the text-safe warm tone stays `accent-ui`.
- Theme: the page starts from `prefers-color-scheme` before React mounts
  (`frontend/index.html`), an explicit choice is stored in `mojfriz.theme` and wins. The switch is
  one button (moon in light, sun in dark) on the Postavke page and in the demo bar on every screen,
  public page included; the site is served with `script-src 'self'`, so no inline script is used.
- "Javna stranica" in the sidebar is a **sign-out**: it opens the public page in a new tab,
  deliberately bypassing the demo's owner screens.
- Hairdresser colours are six seats (`1`–`6`), assigned in `frontend/src/demo/seed.ts`: Lana plum,
  Amina blue, Milica brick. The blue seat is not the first one so a calendar column in the primary
  colour never reads as selection. The public booking flow shows no hairdresser colour.

## Demo seed (decision 12)

- The seed covers **seven days back and twenty ahead**, so the public date strip (30 days) and the
  calendar strip (three weeks) both show busy days from the first paint.
- `frontend/src/demo/seed.ts` walks each hairdresser's day as a chain of services with real gaps
  rather than fixed slot blocks. When a day still has fewer than ten appointments after those
  walks, it is topped up from the end of the day backwards, so the morning keeps the room a guest
  is most likely to want. `MIN_SEED_APPOINTMENTS_PER_DAY` holds that floor and is asserted in
  `frontend/src/demo/gateway.test.ts` for every weekday.
- Nothing is seeded in the past, nothing is cancelled, and no seeded day books a hairdresser
  twice. A fresh seed leaves at least one free slot on every working hairdresser-day (checked over
  120 sample days), because a demo nobody can book in is not a demo of booking.
- Working hours are demo data and can be edited in the pilot; the seed's own hours are the only
  requirement that every day can reach ten appointments.
- A stored state is reused while it was seeded **today**; opening it on a later day reseeds it,
  carrying over guest bookings (and their management tokens) that are still ahead and do not
  collide with the fresh plan. Both localhost and the Vercel deployment read the same
  `localStorage` key, so they behave the same way.

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
- A form's day is a grid of day buttons (`DateSelectField`), not a native date `<select>`: two rows
  of five days to start, "Više datuma" adding two rows at a time, up to a quarter ahead. The same
  five columns on every width, so the picker keeps one shape on phone and desktop. The chosen day is
  spelled out above it in words (**DD.MM.YYYY** regardless of browser locale). The sheet is a modal
  with a focus trap, and the operating system's select menu opened from it could close on its own and
  move the value to a neighbour day — a day must never become wrong by being chosen. Its layout is in
  plain CSS classes (`.picker-days`, `.picker-day`, `.picker-more`) so no utility generation stands
  between the component and its style.
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
