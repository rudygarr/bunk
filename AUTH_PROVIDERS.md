# Turning on Microsoft / Google / Apple sign-in

The buttons are already in the app. Each one lights up as soon as you enable that
provider in Supabase. Do them one at a time — **start with Microsoft** (your
school) and **Google** (both free).

## Values you'll reuse
- **Supabase callback URL** (providers ask for this "redirect URI"):
  `https://irzmarbzxvchsjqpkogg.supabase.co/auth/v1/callback`
- In **Supabase → Authentication → URL Configuration**, set:
  - **Site URL:** `https://www.camphq.app`
  - **Redirect URLs:** add `https://www.camphq.app/**` and `https://camphq.app/**`
    (and `http://localhost:5174/**` for local testing)

---

## Microsoft (free) — the big one for the school
1. Go to **portal.azure.com → Microsoft Entra ID → App registrations → New registration**.
2. Name it "CampHQ". Supported account types: **Accounts in any organizational
   directory and personal Microsoft accounts** (multitenant) so any school can use it.
3. **Redirect URI:** platform **Web**, value = the Supabase callback URL above.
4. After it's created, copy the **Application (client) ID**.
5. **Certificates & secrets → New client secret** → copy the secret **Value**.
6. In **Supabase → Authentication → Providers → Azure**: paste the client ID and
   secret, set the **Azure Tenant URL** to `https://login.microsoftonline.com/common`,
   enable, Save.
> ⚠️ Some schools lock down third-party app sign-in. If students get an "needs admin
> approval" screen, your IT admin can approve CampHQ for the tenant once.

## Google (free)
1. **console.cloud.google.com → APIs & Services → Credentials → Create Credentials
   → OAuth client ID** (configure the consent screen first if asked: External, app
   name "CampHQ", your email).
2. Application type **Web application**. Authorized redirect URI = the Supabase
   callback URL above.
3. Copy the **Client ID** and **Client secret**.
4. In **Supabase → Authentication → Providers → Google**: paste both, enable, Save.

## Apple ($99/yr — needs the Apple Developer account)
Do this once you have the Apple Developer Program (same one as the App Store).
1. developer.apple.com → Certificates, Identifiers & Profiles → create a **Services ID**,
   enable **Sign in with Apple**, add the Supabase callback URL.
2. Create a **Sign in with Apple key**, download the `.p8`.
3. In **Supabase → Authentication → Providers → Apple**: provide the Services ID,
   Team ID, Key ID, and the key contents. Enable, Save.

---

When a provider is enabled, its button on camphq.app immediately starts working —
no app redeploy needed. (The matching of a signed-in person's email to your camp
roster is the camper-login step, built next.)
