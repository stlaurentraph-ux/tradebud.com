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
   - `ANDROID_APP_LINK_SHA256` — comma-separated SHA-256 cert fingerprints from EAS / Play Console

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
