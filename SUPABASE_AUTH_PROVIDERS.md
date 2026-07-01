# Turning on SSO (Microsoft / Google / Apple)

The "Continue with Microsoft / Google / Apple" buttons already exist in the app.
They stay inert until you register CampHQ with each provider and paste the
credentials into Supabase. Do **Google first** (easiest, ~15 min) to prove the
flow, then Microsoft (the one your school needs).

## Values you'll reuse
- **Supabase OAuth callback URL** (paste into each provider console):
  `https://irzmarbzxvchsjqpkogg.supabase.co/auth/v1/callback`
- **Production site URL:** `https://www.camphq.app`

## Step 0 — Supabase URL config (do once)
Supabase → **Authentication → URL Configuration**:
- **Site URL:** `https://www.camphq.app`
- **Redirect URLs — add:**
  - `https://www.camphq.app/**`
  - `https://camphq.app/**`
  - `http://localhost:5174/**` (for local testing)

---

## Google (free, ~15 min)
1. **console.cloud.google.com** → create a project (e.g. "CampHQ") if you don't have one.
2. **APIs & Services → OAuth consent screen** → External → fill app name, support
   email, developer email → Save. (You can leave it in "Testing" to start.)
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID** →
   Application type **Web application**.
   - **Authorized redirect URIs → Add:** the Supabase callback URL above.
   - Create → copy the **Client ID** and **Client secret**.
4. Supabase → **Authentication → Providers → Google** → enable → paste **Client ID**
   and **Client Secret** → Save.
5. Test on the app: **Continue with Google**.

## Microsoft (free, ~20 min) — the one for your school
1. **portal.azure.com** → search **Microsoft Entra ID** (formerly Azure AD).
2. **App registrations → New registration**:
   - Name: `CampHQ`
   - **Supported account types:** *"Accounts in any organizational directory and
     personal Microsoft accounts"* (multi-tenant) — so other schools/orgs can use it.
   - **Redirect URI:** platform **Web** → the Supabase callback URL above.
   - Register → copy the **Application (client) ID**.
3. **Certificates & secrets → New client secret** → copy the secret **Value**
   (not the ID) immediately — it's only shown once.
4. Supabase → **Authentication → Providers → Azure** → enable → paste **Client ID**
   and **Secret**. For **Azure Tenant URL / Tenant** use `common` (multi-tenant).
   Save.
5. Test: **Continue with Microsoft**.
   - ⚠️ Your school's Microsoft tenant may require an admin to approve CampHQ for
     student sign-in (tenant consent). If students hit a "needs admin approval"
     screen, that's Omar/IT granting consent — not a bug.

## Apple (deferred — needs the $99 Apple Developer account)
Requires an Apple Developer membership, a Services ID, a key, and domain
verification. Do this alongside the App Store work later. The button can stay
hidden until then.

---

## Notes
- After a successful SSO sign-in, Supabase redirects back to `camphq.app`, the app
  detects the session automatically, and the organizer lands in their cloud
  workspace — same path as email/password login.
- SSO currently lives on the **organizer** sign-in. Camper SSO (school email →
  their camp) is a follow-up that reuses the verified `member_camp` matching.
