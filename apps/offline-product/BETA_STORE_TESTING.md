# Beta store testing (iOS + Android)

Use this when validating the farmer field app on real devices through TestFlight or Google Play internal testing.

## Why the app may close after ~2 seconds

Common causes on downloaded beta builds:

1. **Missing EAS environment variables** — `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` were not injected at build time.
2. **Bad API URL** — release build used `localhost`, plain `http://`, or an invalid `EXPO_PUBLIC_API_URL`.
3. **Startup JS error** — previously, API config threw during module import and terminated the app before UI rendered.

Fixed builds show a **configuration screen** instead of silently exiting when env is incomplete.

## Required EAS environment variables

Set these for **`preview`** and **`production`** profiles in [Expo dashboard](https://expo.dev) → Project → Environment variables:

| Variable | Example |
|----------|---------|
| `EXPO_PUBLIC_API_URL` | `https://api.tracebud.com/api` |
| `EXPO_PUBLIC_SUPABASE_URL` | `https://YOUR_PROJECT.supabase.co` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |

`eas.json` already pins `EXPO_PUBLIC_API_URL` for preview/production builds. Supabase values must still be configured in Expo (do not commit secrets to git).

Verify locally before building:

```bash
cd apps/offline-product
npm run release:preflight:preview   # or :production
```

## Build and submit (beta)

From `apps/offline-product`:

```bash
npm run lint
npm run release:preflight:preview
npm run release:preview
```

After the build finishes:

- **iOS:** submit to TestFlight (`eas submit --platform ios --profile preview` or App Store Connect manual upload).
- **Android:** upload the AAB to Google Play **Internal testing** track.

Share the TestFlight / Play internal link with testers. Wait for store processing (often 15–60 minutes).

## Tester smoke checklist (real device)

1. App opens past splash and shows Home (not immediate exit).
2. Settings shows API base `https://api.tracebud.com/api`.
3. Sign in with a farmer test account works.
4. Record plot → save offline → sync when online.
5. Airplane mode: app stays open; sync queues and retries.

## If a tester still sees a crash

1. Confirm they installed the **latest** build number from Expo/EAS.
2. Capture a screen recording or screenshot of any error screen (post-fix builds show config details).
3. Check Expo build logs for the build ID and confirm env vars were present.
4. For iOS: connect device to Mac → Xcode → Devices → View Device Logs for native crash stack.
5. Rebuild after updating EAS secrets; OTA updates **cannot** add missing `EXPO_PUBLIC_*` vars — you need a new native build.

## Production API health

Before distributing a beta build:

```bash
cd tracebud-backend
npm run check:deploy-health -- https://api.tracebud.com
```

Expected: health check passes against `https://api.tracebud.com/api`.
