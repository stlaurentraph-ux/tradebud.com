# CI secrets and fixtures

**Status:** Living doc — add entries when automation slices introduce new GitHub/Vercel secrets.  
**Plan refs:** `automation-ops-plan.md` §12, `implement-automation-slice.md`

Agents: **never commit secret values.** Document names, purpose, and phase here only. Humans add values in GitHub Settings / Vercel dashboard.

---

## GitHub Actions secrets

| Secret | Phase | Used by | Purpose |
|--------|-------|---------|---------|
| `TEST_DATABASE_URL` | live | backend CI | PostGIS integration tests |
| `DASHBOARD_BASE_URL` | 2.5 | onboarding proxy smoke | Production dashboard URL (`https://dashboard.tracebud.com`) |
| `SUPABASE_URL` | 2.5, 2.6 | deploy smoke token mint | Product Supabase project URL — mints fresh smoke JWT each workflow run |
| `SUPABASE_ANON_KEY` | 2.5, 2.6 | deploy smoke token mint | Anon key for Supabase verify step during mint |
| `SUPABASE_SERVICE_ROLE_KEY` | 2.5, 2.6 | deploy smoke token mint | Service role for admin magic-link mint (**sensitive** — repo-scoped access only) |
| `TRACEBUD_SMOKE_BEARER_TOKEN` | 2.5, 2.6, 2.7 | optional legacy fallback | Deprecated — prefer Supabase mint secrets; local dev can use `--stdout` mint |
| `TRACEBUD_SMOKE_TENANT_ID` | 2.7, 4.4–4.7 | Playwright / smoke assertions | Optional — default `tenant_rwanda_001` per manifest |
| `TRACEBUD_SMOKE_ROLE` | 2.5, 2.7 | onboarding proxy smoke | Optional — default `compliance_manager` |
| `TRACEBUD_SMOKE_STEP_KEY` | 2.5, 2.7 | onboarding proxy smoke | Optional — default `create_first_campaign` |
| `SENTRY_RELEASE_HEALTH_AUTH_TOKEN` | 4.7 | release health gate | Sentry API token with `project:read` ([create](https://tracebud.sentry.io/settings/auth-tokens/)) |
| `SENTRY_RELEASE_HEALTH_ORG` | 4.7 | release health gate | Org slug: `tracebud` |
| `SENTRY_RELEASE_HEALTH_PROJECT` | 4.7 | release health gate | Project slug: `javascript-nextjs` (dashboard + marketing web) |
| `TURBO_TOKEN` | 1.2 | Turbo remote cache | Vercel Remote Cache token ([create](https://vercel.com/account/tokens) or `npx turbo login`) |
| `TURBO_TEAM` | 1.2 | Turbo remote cache | Vercel team slug (Settings → General, or output of `npx turbo link`) |
| `MARKETING_SMOKE_BASE_URL` | 2.4, 2.8, 4.7 | marketing deploy smoke, uptime probes, release health gate | Production base URL (`https://www.tracebud.com`) — **live 2026-06-22** |
| `UPTIME_DASHBOARD_BASE_URL` | 2.8, 4.7 | synthetic uptime probes, release health gate | Dashboard base URL (`https://dashboard.tracebud.com`) — **live 2026-06-22** |
| `UPTIME_BACKEND_BASE_URL` | 2.6, 2.8, 4.7 | backend deploy smoke, synthetic uptime probes, release health gate | Backend base URL (`https://api.tracebud.com`) — **live 2026-06-22** |
| `MARKETING_PREVIEW_BASE_URL` | 4.6 | marketing preview Playwright on PR | Optional override when Vercel PR previews are disabled |
| `MARKETING_PREVIEW_SECRET` | 2.4 | stealth route smoke | Optional preview cookie tests |
| `VERCEL_AUTOMATION_BYPASS_SECRET` | 2.4, 2.8, 4.6 | marketing deploy smoke, uptime probes, preview Playwright | Vercel Deployment Protection bypass for CI |
| `EXPO_TOKEN` | 3.O.1, 4.8 | offline Maestro golden path + nightly smoke | Optional — install latest EAS `simulator` build on CI; without it, `expo run:ios` builds locally (slower) |
| `SENTRY_RELEASE_HEALTH_AUTH_TOKEN` | 4.7, 4.O.1 | release health gate + offline mobile SLO gate | Also reused by `offline-mobile-slo-gate.yml` for `tracebud/react-native` |
| `FIELD_TENANT_SMOKE_FARMER_A_EMAIL` | 4.O.2 | Expo CI tenant isolation smoke (**blocking**) | Farmer A login — see `golden-field-tenant-smoke.md` |
| `FIELD_TENANT_SMOKE_FARMER_A_PASSWORD` | 4.O.2 | Expo CI tenant isolation smoke (**blocking**) | Farmer A password |
| `FIELD_TENANT_SMOKE_FARMER_B_ID` | 4.O.2 | Expo CI tenant isolation smoke (**blocking**) | Farmer B profile uuid (foreign target) |
| `FIELD_TENANT_SMOKE_FARMER_B_PLOT_ID` | 4.O.2 | Expo CI tenant isolation smoke (**blocking**) | Farmer B plot uuid for PATCH denial probe |
| `FIELD_TENANT_SMOKE_API_URL` | 4.O.2 | Expo CI tenant isolation smoke | Optional — defaults to `https://api.tracebud.com/api` |
| `EXPO_PUBLIC_SENTRY_DSN` | H24 | Expo CI production release preflight (**blocking**) | Mobile Sentry DSN (`tracebud/react-native`) — must match EAS production env |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | H24 | Expo CI production release preflight (**blocking**) | Google OAuth web client — same values as EAS production / `.env.local` |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | H24 | Expo CI production release preflight (**blocking**) | Google OAuth iOS client |
| `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` | H24 | Expo CI production release preflight (**blocking**) | Google OAuth Android client |

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

## Sentry alert rules (human — slice 2.2)

**Status:** live 2026-06-22 — no GitHub secrets required.

| Rule | Project | Environment | Trigger | Action |
|------|---------|-------------|---------|--------|
| [Notify Suggested Assignees](https://tracebud.sentry.io/monitors/alerts/649072/) | `javascript-nextjs` (+ mobile) | `production` | First seen event | Email → active members / issue owners |

Optional follow-up: duplicate rule for `staging` (pairs with Cursor Automation 3.2); add `react-native`-specific rule if mobile alerts should route separately.

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

Railway backend (audit H3 — distributed rate limiting):

| Variable | Where | Purpose |
|----------|-------|---------|
| `UPSTASH_REDIS_REST_URL` | Railway `tradebud.com` service | Upstash Redis REST endpoint (`https://….upstash.io`) — **external** Upstash account, not Railway Redis |
| `UPSTASH_REDIS_REST_TOKEN` | Railway `tradebud.com` service | Upstash REST token (**sensitive**) |

When unset, backend falls back to in-process memory buckets (single-replica dev only). Production should set both from [upstash.com](https://upstash.com) (do not deploy the Railway Serverless Redis template — removed 2026-06-26).

Marketing build: no secrets required for static build; forms need env only at runtime on Vercel.

---

## Golden staging tenant (Phase 2.7)

**Status:** documented — see `golden-staging-tenant.md` + `golden-staging-tenant.json`.

| Fixture | Value |
|---------|-------|
| Recipient tenant | `tenant_rwanda_001` |
| Sender tenant | `tenant_brazil_001` |
| Bootstrap action | `seed_golden_path` (exporter/admin JWT) |
| Onboarding smoke role | `compliance_manager` |
| Onboarding step key | `create_first_campaign` |

**Bootstrap (staging):** `node apps/dashboard-product/scripts/golden-staging-bootstrap.mjs`  
**Onboarding smoke:** `node apps/dashboard-product/scripts/launch-onboarding-proxy-smoke.mjs`  
**CI smoke auth:** deploy workflows mint a fresh bearer via `smoke-bearer-ci-preflight.mjs` when `SUPABASE_URL` + `SUPABASE_ANON_KEY` + `SUPABASE_SERVICE_ROLE_KEY` are set in GitHub.  
**Local token:** `export TRACEBUD_SMOKE_BEARER_TOKEN="$(npm run smoke:token:mint -s -w tracebud-backend -- --stdout)"`  
**CI guard:** `npm run golden:staging:assert`

Slice **2.5** / **2.6** post-deploy smokes use workflow-time mint (no hourly secret rotation).

---

## Golden field tenant smoke (Phase 4.O.2)

**Status:** documented — see `golden-field-tenant-smoke.md` + `golden-field-tenant-smoke.json`.

| Fixture | Value |
|---------|-------|
| Farmer A (probe) | `field+tenant-smoke-a@tracebud.com` (recommended) |
| Farmer B (victim) | `field+tenant-smoke-b@tracebud.com` (recommended) |
| Probes | `GET /v1/plots?farmerId=B` → 403; `PATCH /v1/plots/:plotBId` → ≥400 |

**Local smoke:** `cd apps/offline-product && npm run qa:tenant-isolation`  
**CI guard:** `npm run qa:tenant-isolation:assert` (Expo `app` job)  
**Blocking smoke:** requires all four `FIELD_TENANT_SMOKE_*` secrets + shared Supabase secrets above.

---

## Release health gate (Phase 4.7)

**Status:** documented — see `release-health-gate.md` + `release-health-gate.json`.

| Command | Purpose |
|---------|---------|
| `npm run release:health:assert` | Manifest / wiring guard (Contracts CI) |
| `npm run release:health:collect` | Gather CI + smoke + Sentry signals into report JSON |
| `npm run release:health:gate` | Evaluate report → GO/NO-GO exit code |

**Workflow:** `.github/workflows/release-health-gate.yml` (manual + weekly schedule). Optional live signals reuse `MARKETING_SMOKE_BASE_URL`, uptime URLs, and Sentry secrets above.

---

## Human setup checklist

- [ ] Add secrets in GitHub → Settings → Secrets and variables → Actions
- [ ] **Field tenant smoke (4.O.2):** create golden farmer pair per `golden-field-tenant-smoke.md`; set `FIELD_TENANT_SMOKE_*` + verify `SUPABASE_URL` / `SUPABASE_ANON_KEY`
- [ ] **Mobile production preflight (H24):** set `EXPO_PUBLIC_SENTRY_DSN` + `EXPO_PUBLIC_GOOGLE_*` in GitHub Actions (mirror EAS production environment)
- [ ] **Turbo remote cache (1.2):** `TURBO_TOKEN` + `TURBO_TEAM` — CI uses local cache until set; `npm run turbo:cache:report` logs status in Contracts job
- [ ] Never paste values into PRs or `daily-log.md`
- [ ] After adding secret, move slice from **Blocked** → **Ready** in `agent-queue.md`
- [ ] Enable branch protection (0.H) only after CI jobs green on `main`

---

## Changelog

| Date | Change |
|------|--------|
| 2026-06-26 | H24: EAS production `environment` binding + blocking `release:preflight:production` in Expo CI; new GitHub secrets for Sentry DSN + Google OAuth client ids |
| 2026-06-22 | Slice 4.O.2: golden field tenant smoke manifest + blocking Expo CI probe; `FIELD_TENANT_SMOKE_*` secrets required |
| 2026-06-21 | Slice 2.6: backend deploy smoke manifest, runner, workflow; reuses `UPTIME_BACKEND_BASE_URL` + optional `TRACEBUD_SMOKE_BEARER_TOKEN` |
| 2026-06-21 | Slice 2.7: golden staging tenant manifest, runbook, bootstrap helper, CI guard |
| 2026-06-21 | Slice 2.O.2: workflow-f missed schedule alert guard + activation runbook |
| 2026-06-20 | Slice 1.2: Turbo remote cache env in CI; `turbo:cache:report` guard |
| 2026-06-20 | Slice 3.O.1: optional `EXPO_TOKEN` for Maestro golden-path CI |
| 2026-06-20 | Slice 2.O.1: n8n Founder OS env vars (n8n host, not GitHub) |
| 2026-06-20 | Slice 2.8: `UPTIME_DASHBOARD_BASE_URL`, `UPTIME_BACKEND_BASE_URL`; reuse `MARKETING_SMOKE_BASE_URL` |
| 2026-06-20 | Initial stub for automation rollout |
