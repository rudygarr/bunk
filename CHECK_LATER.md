# CampHQ — Check Later

Triage of the external UX/accessibility audit (2026-06-28, done from the public
demo via screenshots, no login). Each item verified against the live build.

---

## ✅ Worth doing (real — recommend a dedicated pass)

### A11y: accessible names for icon-only controls
**Confirmed real** via the accessibility tree. Icon-only buttons expose *empty*
accessible names — the hero **Share** and **Settings**, the **sign-out** button,
and the **pin/delete** buttons on every announcement all read as `button: ""` to a
screen reader. Decorative icons also leak glyphs into labels (e.g. `"﨡 Groups"`).

Fix pattern (mechanical, app-wide):
- Add `aria-label` to every icon-only `<button>` (Share camp, Camp settings, Sign
  out, Pin/Unpin, Delete, Edit, Assign, Remove, etc.).
- Add `aria-hidden="true"` to decorative `<i className="ti …">` icons so glyphs
  stop polluting accessible names.

Why it matters: institutional/school buyers increasingly ask about accessibility;
this is the right thing to do and is low-risk. Best as one focused sweep.

---

## 🕓 Deferred — revisit later (valid, not urgent)

- **Tab overflow → "More" menu.** 14 first-level tabs. Current horizontal-scroll
  rail is usable, but a "keep 5, collapse rest into More" pattern would lower
  scanning cost on phones. Design refinement, not a bug.
- **Make operational blockers louder.** Turn "1 open shift" and "N not on a bus
  yet" into prominent cards with direct CTAs ("Fill lifeguard shift", "Assign
  riders"). Polish.
- **Roster row action density.** Several icon buttons per row — fold secondary
  ones into a labeled row menu. (Overlaps with the a11y pass.)
- **Color-contrast audit.** Measure secondary gray text + muted badges against
  WCAG AA with real tooling. Needs automated testing, not eyeballing.
- **Keyboard traversal + visible focus.** Verify focus-visible states and tab
  order across the tab rail, roster actions, audience picker, roll-call cards.
- **Empty / loading / offline states + "last synced".** Camps have poor
  connectivity; roll call & schedule should show sync status and retry. (Feature.)

## 💡 Product ideas from the audit (roadmap, not fixes)

- **Role-specific home views** (director vs cabin leader vs parent/camper).
- **"Camp-day mode"** — a focused check-in/travel screen combining roll call,
  buses, medical flags, and urgent announcements.

---

## ❌ Audit claims verified as NOT issues (for the record)

- **"Mobile is unusable / collapses to a narrow column / controls disappear."**
  Not reproduced. At 375px: page overflow = 0, hero stacks, stat cards go 2-up,
  tab rail scrolls, announce & roll-call forms are fully usable.
- **"Desktop camp detail clipped at 1280px."** Not reproduced — the tab rail is an
  intentional `overflow-x:auto` strip; the page itself doesn't overflow.
- **"Medical flags & person-targeted announcements are visible."** True *in the
  demo*, because the demo is the organizer view (sees everything by design). In
  production this is enforced by the cloud `member_*` functions + RLS — verified
  2026-06-28: a signed-in camper cannot read another person's health/contacts
  (the planted `LEAK-CANARY-BEES` canary was absent from the payload).

*Audit caveat noted by the auditor: public demo only, no login, screenshot-based —
so its most severe claims (mobile, privacy) were the ones that didn't hold up once
tested against the real build.*
