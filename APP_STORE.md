# CampHQ → App Store guide

Phase 1 (wrapping the app with Capacitor) is **done**. This doc is everything YOU
do for Phases 2–3. Work top to bottom.

## Prereqs (one-time)
- **Xcode** installed (free, Mac App Store). Open it once, accept the license.
- **Apple Developer account** — ✅ you have it (used it for Apple sign-in).
- **CocoaPods NOT needed** (this project uses Swift Package Manager).

## The one command to remember (after any web change)
```
cd ~/Claude/bunk
npm run build && npx cap sync
```
That rebuilds the web app and copies it into the iOS project. Run it before every
Xcode build so the app has your latest code.

---

## Phase 2 — Xcode (~30 min)

1. Open the iOS project:
   ```
   cd ~/Claude/bunk && npx cap open ios
   ```
2. In Xcode's left sidebar click the blue **App** project → select the **App**
   target → **Signing & Capabilities** tab.
3. Check **Automatically manage signing** → set **Team** to your Apple account.
   - Bundle Identifier should read **`app.camphq.ios`**. If Xcode complains it's
     taken, that's fine — it's the App ID you already registered.
4. **General** tab: set **Display Name** = `CampHQ`, **Version** = `1.0`,
   **Build** = `1`.
5. **App Icon**: you need a **1024×1024 PNG** (no transparency). Make one from the
   CampHQ tent logo. In Xcode: left sidebar → `App/Assets` → **AppIcon** → drag the
   PNG into the 1024 slot.
6. **Test it**: pick an iPhone simulator at the top, press **▶ (Play)**. CampHQ
   should launch. Then plug in your iPhone, select it, Play again (you may have to
   "Trust" the developer profile on the phone: Settings → General → VPN & Device
   Management).

If it launches and you can sign in → Phase 2 done.

---

## Phase 3 — App Store Connect (submit)

### A. Create the app record
1. Go to **appstoreconnect.apple.com** → **My Apps** → **➕ → New App**.
2. Platform **iOS**, Name **CampHQ**, Primary Language English, Bundle ID
   **app.camphq.ios** (pick from dropdown), SKU = `camphq-ios` (any unique text).

### B. Upload the build from Xcode
1. In Xcode: top menu **Product → Archive** (build for a real device target, not
   simulator — pick "Any iOS Device").
2. When the Organizer window opens → **Distribute App → App Store Connect →
   Upload**. Wait for it to process (a few min–1 hr).

### C. Fill the store listing (in App Store Connect)
- **Description**, **keywords**, **Support URL** = `https://camphq.app`.
- **Screenshots** — required: **6.7" iPhone** size. Easiest: run the app in the
  iPhone 15 Pro Max simulator, `Cmd+S` to save screenshots of a few good screens
  (overview, roll call, camper view).
- **Category**: Education (or Lifestyle).
- **Age rating**: fill the questionnaire honestly. Do **NOT** check "Made for
  Kids" (organizers/adults use it too; that category adds heavy restrictions).
- **Privacy Policy URL**: ⚠️ you must host a real page. Put your
  `legal/privacy-policy.md` content at `https://camphq.app/privacy`. (Ask me to
  add a `/privacy` page to the site — quick.)
- **App Privacy** ("nutrition labels"): declare what you collect (name, email,
  and — if enabled — health info), and mark it **not used for tracking**. No
  third-party ad/analytics SDKs.
- **Pricing**: **Free**.

### D. Submit
- Attach the uploaded build → **Add for Review** → **Submit**.
- Review usually takes **1–3 days**.

---

## 3 rules that keep you from getting rejected
1. **No paying inside the app.** Organizers pay on **camphq.app**, never with a
   button in the iOS app (avoids Apple's 30% + In-App-Purchase requirement,
   Guideline 3.1.1). The app is free.
2. **Not "just a website"** (Guideline 4.2). It's fine — CampHQ works offline,
   uses the camera (photos/QR), and is a real tool. If asked, say so.
3. **Kids' data.** No third-party trackers; your Privacy Policy + DPA cover it.

## Known follow-ups (not blockers for v1)
- **Native SSO deep-link**: the Google/Microsoft/Apple buttons may not bounce back
  cleanly *inside* the wrapped app yet (needs a URL-scheme/deep-link setup).
  Email/password works in-app. Ask me to wire native deep-linking when you want
  the social buttons working in the app.
- **Push notifications**: not set up yet; add later with `@capacitor/push-notifications`.
- The `ios/` native folder lives on your Mac (git-ignored). Regenerate anytime
  with `npx cap add ios` if needed; signing/icon are set in Xcode.
