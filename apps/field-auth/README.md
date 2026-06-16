# Tracebud field-auth (`app.tracebud.com`)

Minimal Next.js host for **field-app-only** auth flows — separate from `dashboard.tracebud.com`.

## Routes

| Path | Purpose |
|------|---------|
| `/auth/callback` | OAuth return (Google/Apple). Expo Go uses `?app_redirect=exp://…`; store builds use universal links. |
| `/auth/confirm` | Email confirmation for farmer sign-up (`emailRedirectTo`). |
| `/.well-known/apple-app-site-association` | iOS Universal Links |
| `/.well-known/assetlinks.json` | Android App Links |

## Deploy (Vercel)

1. Create project `field-auth` → root `apps/field-auth`
2. Domain: **`app.tracebud.com`**
3. Env (production):
   - `APPLE_TEAM_ID` — `6RT8K5RM6Z` (default in code)
   - `ANDROID_APP_LINK_SHA256` — comma-separated SHA-256 cert fingerprints

### Android App Links fingerprints

Set **both** fingerprints when the app is on Google Play (comma-separated, no spaces):

| Source | Where to find it | Used for |
|--------|------------------|----------|
| **EAS upload keystore** | `eas credentials -p android` → Keystore → SHA256 | Internal/preview APKs, sideload |
| **Play App Signing** | Play Console → **App integrity** → **App signing** → SHA-256 | Store installs (production) |

Example:

```bash
ANDROID_APP_LINK_SHA256=0F:FC:C5:85:...:FF:49,AB:CD:EF:...:01:23
```

After updating, redeploy field-auth on Vercel so `/.well-known/assetlinks.json` serves both.

## Supabase redirect allow-list

After deploy, run from `apps/offline-product`:

```bash
node scripts/merge-supabase-redirect-urls.mjs
```

Includes `https://app.tracebud.com/**`.

## Local dev

```bash
cd apps/field-auth && npm install && npm run dev
```

Point mobile `.env.local` at localhost for bridge testing:

```
EXPO_PUBLIC_OAUTH_BRIDGE_URL=http://localhost:3003/auth/callback
EXPO_PUBLIC_FIELD_AUTH_CONFIRM_URL=http://localhost:3003/auth/confirm
```
