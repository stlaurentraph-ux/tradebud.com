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
| `TURBO_TOKEN` | 1.2 | Turbo remote cache | Vercel Remote Cache token ([create](https://vercel.com/account/tokens) or `npx turbo login`) |
| `TURBO_TEAM` | 1.2 | Turbo remote cache | Vercel team slug (Settings → General, or output of `npx turbo link`) |
| `MARKETING_SMOKE_BASE_URL` | 2.4, 2.8 | marketing deploy smoke, uptime probes | Production base URL (`https://www.tracebud.com`) |
| `UPTIME_DASHBOARD_BASE_URL` | 2.8 | synthetic uptime probes | Dashboard base URL (`https://dashboard.tracebud.com`); optional — manifest fallback when unset |
| `UPTIME_BACKEND_BASE_URL` | 2.8 | synthetic uptime probes | Backend base URL (`https://api.tracebud.com`); optional — manifest fallback when unset |
| `MARKETING_PREVIEW_SECRET` | 2.4 | stealth route smoke | Optional preview cookie tests |
| `VERCEL_AUTOMATION_BYPASS_SECRET` | 2.4, 2.8 | marketing deploy smoke, uptime probes | Vercel Deployment Protection bypass for CI |
| `EXPO_TOKEN` | 3.O.1 | offline Maestro golden path | Optional — install latest EAS `simulator` build on CI; without it, `expo run:ios` builds locally (slower) |

### n8n Founder OS (Phase 2.O — configure in n8n host, not GitHub)

| Variable | Phase | Used by | Purpose |
|----------|-------|---------|---------|
| `SUPABASE_URL` | 2.O.* | n8n Supabase nodes | CRM read/write |
| `SUPABASE_SERVICE_ROLE_KEY` | 2.O.* | n8n Supabase nodes | Service role for prospect checks |
| `FOUNDER_EMAIL_TO` | 2.O.1 | workflow-b notifications | Founder alert inbox |
| `SLACK_WEBHOOK_URL` | 2.O.* | optional Slack nodes | Ops alerts |
| `NOTION_DATABASE_ID` | 2.O.* | optional Notion nodes | Task logging |

Human configures these in the n8n instance after importing workflow specs from `automation/n8n/founder-os/`.

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
- [ ] **Turbo remote cache (1.2):** `TURBO_TOKEN` + `TURBO_TEAM` — CI uses local cache until set; `npm run turbo:cache:report` logs status in Contracts job
- [ ] Never paste values into PRs or `daily-log.md`
- [ ] After adding secret, move slice from **Blocked** → **Ready** in `agent-queue.md`
- [ ] Enable branch protection (0.H) only after CI jobs green on `main`

---

## Changelog

| Date | Change |
|------|--------|
| 2026-06-20 | Slice 1.2: Turbo remote cache env in CI; `turbo:cache:report` guard |
| 2026-06-20 | Slice 3.O.1: optional `EXPO_TOKEN` for Maestro golden-path CI |
| 2026-06-20 | Slice 2.O.1: n8n Founder OS env vars (n8n host, not GitHub) |
| 2026-06-20 | Slice 2.8: `UPTIME_DASHBOARD_BASE_URL`, `UPTIME_BACKEND_BASE_URL`; reuse `MARKETING_SMOKE_BASE_URL` |
| 2026-06-20 | Initial stub for automation rollout |
