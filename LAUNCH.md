# CampHQ — Launch Plan (going live)

Goal: get a real, multi-tenant CampHQ live for the summer-camp window. Strategy:
**launch as a free beta** (real accounts + cloud data + shareable links), add
Stripe payments shortly after. Web-first; App Store later.

Status legend: ✅ done · 🔜 next · ⏳ waiting on you · 🧱 blocked (needs a service/key)

---

## Assets owned

| Asset | Value |
|---|---|
| Domain | **camphq.app** (production URL → `https://camphq.app`) |
| Code repo | `rudygarr/bunk` (GitHub) |
| **Production (LIVE)** | **https://camphq.app** → www.camphq.app (Vercel, auto-deploys on push to main) ✅ |
| Old demo | https://rudygarr.github.io/bunk/ (GitHub Pages) |
| Vercel default URL | https://bunk-olive.vercel.app |
| Backend | Supabase project `irzmarbzxvchsjqpkogg` |
| Brand | name "CampHQ", pine `#1f6f5c` / amber `#e08a3c`, tent logo |

> The app uses a relative base path + hash routing, so it runs unchanged at the
> GitHub Pages path *and* at the `camphq.app` root — no build change needed when
> we cut over to the domain.

---

## A. What YOU do (in order)

1. **Run the database schema.** Supabase → SQL Editor → paste `supabase/schema.sql` → Run. ⏳
2. **Confirm Email auth is on.** Supabase → Authentication → Providers → Email = enabled.
   For fast beta onboarding, optionally turn **OFF "Confirm email"** (Authentication →
   Providers → Email → Confirm email) so signups are instant. You can re-enable later. ⏳
3. **Pick the launch model:** free beta first (recommended) vs paid from day one. ⏳
4. **Choose the production host.** Recommended: **Vercel** (free) — sign in with GitHub,
   "Import" the `rudygarr/bunk` repo, deploy. (We can also stay on GitHub Pages to start.) ⏳
5. **Domain: `camphq.app`** — ✅ purchased. Point it at the host when chosen: add
   `camphq.app` as a custom domain in Vercel (or your host), then add the DNS
   records it gives you at your registrar. Then add `https://camphq.app` to
   Supabase → Authentication → URL Configuration (Site URL + Redirect URLs) so
   real login/email links resolve to the production domain. ⏳
6. **(When we add payments) Create a Stripe account**, then give me the **publishable**
   key and store the **secret** key where I tell you (never in the repo). 🧱
7. **(When we add email) Pick a transactional email provider** (Resend or Postmark),
   create an API key. 🧱
8. **Fill the legal placeholders** in `legal/*` (company name, contact email, refund
   policy, governing law) and get an attorney review before charging money. 🧱
9. **(Later) Apple Developer Program** ($99/yr) for the App Store wrap. 🧱

## B. Secrets / values I need from you (fill in when ready)

| Item | For | Status |
|---|---|---|
| Supabase Project URL | backend | ✅ have it |
| Supabase publishable (anon) key | backend | ✅ have it |
| "Schema is in" confirmation | data layer | ⏳ |
| Stripe publishable key | payments (later) | 🧱 |
| Stripe secret key (stored server-side, not in repo) | payments (later) | 🧱 |
| Email provider API key | verification/invites (later) | 🧱 |
| Domain name | branding | ✅ `camphq.app` — registrar **Namecheap** — needs DNS pointed at host (do after host is chosen) |
| Legal placeholder values | compliance | 🧱 |

## C. Engineering steps (mine), in order

1. ✅ Supabase client wired (`src/lib/supabase.ts`), connection verified
2. ✅ Normalized schema + Row-Level Security (`supabase/schema.sql`)
3. 🔜 Real organizer **auth** (sign up / log in) — `src/lib/auth.ts` + login UI
4. ⬜ **Data layer** — read/write the normalized tables (`src/lib/db.ts`)
5. ⬜ **Swap persistence** — signed-in organizers use the cloud; new accounts start
   empty; the public demo keeps using local sample data
6. ⬜ **Publish flow as free beta** — go-live without a charge (Stripe gate added later)
7. ⬜ **Participant (camper) login** linked to the `attendees` table
8. ⬜ **Stripe payments** (once keys exist)
9. ⬜ **Production host + custom domain**
10. ⬜ **Harden + test + launch**

---

## Notes / decisions
- **Demo stays alive.** The current localStorage demo keeps working as the public
  "try it" experience. Real accounts are a separate, cloud-backed path.
- **Privacy by the database.** RLS means rosters/health/assignments are never publicly
  readable — only the viewer-safe parts of a *published* camp are.
- **Children's data:** legal review is required before charging; see `legal/`.
