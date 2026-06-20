# CI secrets and fixtures

**Status:** Living doc — add entries when automation slices introduce new GitHub/Vercel secrets.  
**Plan refs:** `automation-ops-plan.md` §12, `implement-automation-slice.md`

Agents: **never commit secret values.** Document names, purpose, and phase here only. Humans add values in GitHub Settings / Vercel dashboard.

---

## GitHub Actions secrets

| Secret | Phase | Used by | Purpose |
|--------|-------|---------|---------|
| `TEST_DATABASE_URL` | live | backend CI | PostGIS integration tests |
| `DASHBOARD_BASE_URL` | 2.5 | onboarding proxy smoke | Staging dashboard URL |
| `TRACEBUD_SMOKE_BEARER_TOKEN` | 2.5 | onboarding proxy smoke | Authenticated smoke bearer |
| `TURBO_TOKEN` | 1.2 | Turbo remote cache | CI cache auth |
| `TURBO_TEAM` | 1.2 | Turbo remote cache | Team slug |
| `MARKETING_SMOKE_BASE_URL` | 2.4 | marketing deploy smoke | Production or staging base URL |
| `MARKETING_PREVIEW_SECRET` | 2.4 | stealth route smoke | Optional preview cookie tests |

---

## Vercel-only (not in GitHub)

| Secret | Purpose |
|--------|---------|
| `SENTRY_AUTH_TOKEN` | Source map upload |

---

## CI placeholder env (safe in YAML — not secrets)

Dashboard build in CI (slices 0.2, 0.4):

```bash
NEXT_PUBLIC_SENTRY_ENABLED=0
TRACEBUD_BACKEND_URL=https://api.example.test/api
NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=ci-placeholder
```

Marketing build in CI (slice 2.1):

```bash
NEXT_PUBLIC_SENTRY_ENABLED=0
```

Deploy Sentry environment tags (slice 2.1 — set in Vercel/Railway, not GitHub):

| App | Explicit override | Auto fallback |
|-----|-------------------|---------------|
| dashboard | `NEXT_PUBLIC_SENTRY_ENVIRONMENT` | `VERCEL_ENV=preview` → `staging` |
| marketing | `NEXT_PUBLIC_SENTRY_ENVIRONMENT` | `VERCEL_ENV=preview` → `staging` |
| backend | `SENTRY_ENVIRONMENT` | `RAILWAY_ENVIRONMENT_NAME` → `staging` unless `production` |

Marketing build: no secrets required for static build; forms need env only at runtime on Vercel.

---

## Golden staging tenant (Phase 2.7)

**Status:** not yet documented — blocked slice 2.7.

Target: bearer token + tenant id for Playwright and proxy smoke. Document here when 2.7 completes.

---

## Human setup checklist

- [ ] Add secrets in GitHub → Settings → Secrets and variables → Actions
- [ ] Never paste values into PRs or `daily-log.md`
- [ ] After adding secret, move slice from **Blocked** → **Ready** in `agent-queue.md`
- [ ] Enable branch protection (0.H) only after CI jobs green on `main`

---

## Changelog

| Date | Change |
|------|--------|
| 2026-06-20 | Initial stub for automation rollout |
