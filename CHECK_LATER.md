# CampHQ — Check Later

Non-urgent, revisit anytime. Nothing here blocks launch.

## UX / a11y
- [ ] Mobile: 14 dashboard tabs scroll horizontally — consider a "More" menu (keep ~5 core tabs).
- [ ] Roster rows: many icon buttons — move secondary ones into a labeled row menu.
- [ ] Make blockers actionable (CTA on "1 open shift" / "N not on a vehicle").
- [ ] Finish aria-labels on the long tail of icon-only buttons; keyboard/focus + automated contrast (axe) pass.

## Features (deferred by design)
- [ ] Travel: desktop drag-and-drop assignment (tap-to-assign/move already works everywhere).
- [ ] Role-specific home views; camp-day mode; empty/loading/offline states (poor camp signal).
- [ ] Announcement clearance (who can send what) + organizer privacy-toggle UI (privacy column already exists).

## Ops reminders
- [ ] Apple SSO secret expires ~Dec 28 2026 — re-run apple-secret.js, update Supabase.
- [ ] Google consent screen still "Testing" — Publish before real directors use Google.
- [ ] Microsoft: verified-publisher step for OTHER schools to consent.
- [ ] Re-enable email verification (with real email provider) before charging.
- [ ] Re-run supabase/schema.sql after schema-touching features (idempotent).
