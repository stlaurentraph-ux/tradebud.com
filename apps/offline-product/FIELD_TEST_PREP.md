# Field test prep (while EAS build runs)

Use this when a **preview** or **production** build is on Expo — not for `expo start` dev client.

## 1. Install the build

1. Open the build page on [expo.dev](https://expo.dev) → **Install** (or scan QR on iPhone).
2. iOS internal builds: device UDID must be registered (EAS handles this for ad hoc; App Store builds use TestFlight after submit).
3. Note build profile + version in the sign-off table at the bottom of `DEVICE_SMOKE_CHECKLIST.md`.

## 2. Accounts & API

| Need | Value |
|------|--------|
| API (preview/prod build) | `https://api.tracebud.com/api` (from `eas.json`) |
| Test farmer | Email/password account, or Google / Apple test user |
| Second account (optional) | Tenant check §10 — sign out / sign in |

**Do not use your dashboard email** (exporter/cooperative workspace) for the field app — those accounts belong on [dashboard.tracebud.com](https://dashboard.tracebud.com). The app will block them or OAuth may open the dashboard wizard if redirect URLs are misconfigured.

**Google OAuth in Expo Go** (`npx expo start`) needs `exp://**` in Supabase redirect URLs. Prefer testing Google on a **preview/production EAS build** (`tracebudoffline://auth/callback`).

Fix redirect URLs (one-time, requires Supabase access token):

```bash
export SUPABASE_ACCESS_TOKEN=...  # supabase.com/dashboard/account/tokens
node scripts/merge-supabase-redirect-urls.mjs
```

Verify OAuth before field day:

```bash
npm run oauth:verify
npm run release:preflight:production:online
```

## 3. 30-minute critical path

Do these first on a **physical iPhone** (GPS + push):

1. **Home** → create farmer name → Walk my plot → save polygon
2. **Settings** → Sign in (email) → backup consent → plots sync
3. **Sign out** → **Google** or **Apple** sign-in → upload if prompted
4. **Harvest** → record online → airplane mode → queue → online → **Sync now**
5. **Settings** → **Enable notifications** → allow → badge **On**
6. **Plot detail** → map hero shows polygon; photos / Finish setup

Full matrix: `npm run qa:device` (45 items).

## 4. Permission deny paths (5 min)

| Action | Deny once | Expect |
|--------|-----------|--------|
| Walk plot → Start | Location | Alert + Open Settings |
| Profile photo | Camera | `perm_camera_*` |
| Enable notifications | Push | `perm_push_*` |

## 5. If something breaks

- **Sync stuck** → Settings → queue error text → `INCIDENT_RUNBOOK.md`
- **OAuth fails** → `npm run oauth:verify`; check redirect `tracebudoffline://auth/callback`
- **Apple sign-in fails** → production build must include Sign in with Apple entitlement (re-run `npm run credentials:setup` if needed)
- **Crash** → Sentry project `tracebud/react-native` (DSN on EAS production env)

## 6. Android (parallel track)

When iOS is green, kick off Android production:

```bash
npx eas-cli build -p android --profile production
```

Preview Android builds have succeeded before; refresh credentials if production fails:

```bash
npm run credentials:setup
```

## 7. After field soak

- [ ] Complete sign-off row in `DEVICE_SMOKE_CHECKLIST.md`
- [ ] `eas submit -p ios --profile production --latest` (when ready for TestFlight / App Store)
- [ ] Play Console upload + Data Safety (`STORE_OPS_CHECKLIST.md`)
