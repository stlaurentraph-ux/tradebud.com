# Sentry mobile issue alerts (react-native)

**Project:** `tracebud/react-native` on [de.sentry.io](https://de.sentry.io)  
**Manifest:** `sentry-mobile-alert-rules.json`  
**Apply script:** `apps/offline-product/scripts/setup-sentry-mobile-alerts.mjs`

## Automated setup (preferred)

1. Create an auth token with **`alerts:write`** + **`project:read`**:  
   [tracebud.sentry.io → Settings → Auth Tokens](https://tracebud.sentry.io/settings/account/api/auth-tokens/)

2. Store locally (gitignored):

```bash
cd apps/offline-product
node scripts/set-sentry-auth-token-local.mjs
# paste token with alerts:write
```

3. Create rules (idempotent — skips existing names):

```bash
npm run sentry:alerts:setup
npm run sentry:alerts:check
```

`npm run sentry:alerts:check` validates manifest wiring and, when a `project:read` token is available, confirms every manifest rule name exists in Sentry. CI runs the same check on offline PRs.

## Rules created

| Name | Trigger | Filter |
|------|---------|--------|
| Field — boot failure (scope:app_state_boot) | New issue | Tag `scope` equals `app_state_boot` |
| Field — sync/oauth message signals | New issue | Message contains `sync:` OR `auth.oauth` OR `analytics:sync` |
| Field — regression on resolved | Issue regresses after resolve | — |

All rules email **Issue Owners**, falling back to **Active Members** (same pattern as existing “Notify Suggested Assignees”).

## Manual UI fallback

If the API token cannot get `alerts:write`, create each rule in Sentry:

1. [Alerts → Create Alert → Issues](https://tracebud.sentry.io/alerts/new/issue/) → project **react-native**
2. Use the trigger/filter table above
3. Action: **Send a notification to Suggested Assignees**

## Preview builds + spans

Preview EAS profile enables Sentry (`EXPO_PUBLIC_SENTRY_ENABLED=1`, environment `preview`) and binds the **EAS preview environment** (`eas.json` → `"environment": "preview"`).

Ensure **EAS → Environment variables → preview** includes:

- `EXPO_PUBLIC_SENTRY_DSN` (same `react-native` project DSN as production)

After the next preview build, verify:

- **Issues** — boot/sync/oauth alerts fire on new events
- **Performance** — filter `op:sync.pipeline` or `op:auth.oauth` for Phase B spans
