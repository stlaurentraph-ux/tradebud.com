# ADR-006: Database schema organization (Supabase Table Editor)

**Status:** Accepted — Phases 0–2 implemented 2026-06-20; Phase 3 deferred (optional second project; not planned while on single Supabase project)  
**Date:** 2026-06-20  
**Context:** Tracebud Supabase project `uzsktajlnofosxeqwdwl` has 56 tables + 1 view in `public`, mixing product, commercial, CRM/GTM, integrations, and internal ops. Table Editor is hard to navigate; 15 tables have RLS disabled.

## Decision (proposed)

1. Split domains into Postgres schemas (not separate folders — Supabase groups by schema only).
2. Keep `public` lean: core EUDR product tables + ops views only.
3. Route commercial, CRM/GTM, integrations, and internal tables through NestJS (`service_role` / direct `pg` pool); do **not** expose those schemas via PostgREST.
4. Optionally move Founder OS + marketing lead tables to a **second Supabase project** (Phase 3).
5. Eliminate runtime `CREATE TABLE IF NOT EXISTS` in NestJS services; all tables via migrations.

## Target schema layout

| Schema | Purpose | PostgREST exposed |
|--------|---------|-------------------|
| `public` | Core product + compliance + geo reference + ops views | Yes (RLS required) |
| `commercial` | Billing, subscriptions, shipment commercial metadata | No |
| `crm` | Sales pipeline, outreach, content calendar, CRM contacts | No |
| `gtm` | Marketing/waitlist lead capture forms | Yes (insert-only RLS for anon) |
| `integrations` | CoolFarm, partner exports, yield benchmarks | No |
| `ops` | Request campaigns, inbox, chat (dashboard workflow) | No |
| `internal` | Audit log, admin users/orgs, tenant onboarding captures | No |
| `extensions` | PostGIS / spatial_ref_sys (existing) | No |
| `auth`, `storage` | Supabase-managed | Platform default |

---

## Table-by-table mapping (live inventory)

Legend:
- **Priority:** P0 = move first (high clutter / security), P1 = medium, P2 = low / optional second project
- **API:** whether anon/authenticated Supabase clients should reach this table after reorg
- **Status:** `live` = in production DB today

### `public` — keep (core product)

| Table | Rows | Priority | API | Notes |
|-------|------|----------|-----|-------|
| `user_account` | 3 | — | authenticated RLS | Field-app identity; links to `auth.users` |
| `farmer_profile` | 3 | — | authenticated RLS | Tenant scope flows through farmer |
| `plot` | 1 | — | authenticated RLS | Canonical geometry + GFW screening |
| `harvest_transaction` | 0 | — | authenticated RLS | Plot deliveries |
| `voucher` | 0 | — | authenticated RLS | Harvest vouchers |
| `dds_package` | 0 | — | authenticated RLS | Filing packages |
| `dds_package_voucher` | 0 | — | authenticated RLS | Package ↔ voucher join |
| `consent_grants` | 0 | P0 | backend + RLS | **RLS currently OFF** — enable before/ during move |
| `plot_tenure_verification` | 0 | P0 | backend + RLS | **RLS OFF**; child of plot |
| `evidence_documents` | 0 | P0 | backend + RLS | **RLS OFF** |
| `document_provenance_events` | 0 | P0 | backend + RLS | **RLS OFF** |
| `compliance_issues` | 0 | P0 | backend + RLS | **RLS OFF** |
| `voucher_buyer_claims` | 0 | P0 | backend + RLS | **RLS OFF** |
| `sinaph_zone` | 0 | — | read-only RLS | Spatial reference overlay |
| `indigenous_zone` | 0 | — | read-only RLS | Spatial reference overlay |
| `plot_ops_summary` (view) | — | — | authenticated read | Default Table Editor browse surface for ops |

### `commercial` — move from public

| Table | Rows | Priority | API | Code touchpoints |
|-------|------|----------|-----|------------------|
| `tenant_commercial_profiles` | 0 | P1 | backend only | `launch.service.ts`, launch API specs |
| `tenant_billing_subscription` | 0 | P1 | backend only | billing SQL migrations |
| `tenant_billing_adoption_promo` | 0 | P1 | backend only | billing SQL migrations |
| `billing_usage_meters` | 0 | P0 | backend only | **RLS OFF** |
| `billing_invoices` | 0 | P0 | backend only | **RLS OFF** |
| `shipment_billing_legs` | 0 | P0 | backend only | **RLS OFF** |
| `shipment_headers` | 0 | P1 | backend only | **RLS OFF** |
| `shipment_header_packages` | 0 | P1 | backend only | **RLS OFF** |
| `tenant_feature_entitlements` | 0 | P1 | backend only | `launch.service.ts` — gates product features |

### `crm` — move from public (or Phase 3 second project)

| Table | Rows | Priority | API | Notes |
|-------|------|----------|-----|-------|
| `crm_contacts` | 0 | P1 | backend only | Links to `farmer_profile` — cross-schema FK OK |
| `prospects` | 2 | P2 | internal tools | Founder OS |
| `outreach_templates` | 0 | P2 | internal tools | Founder OS |
| `outreach_activity` | 2 | P2 | internal tools | Founder OS |
| `daily_actions` | 0 | P2 | internal tools | Founder OS |
| `content_ideas` | 0 | P2 | internal tools | Founder OS |
| `content_calendar` | 0 | P2 | internal tools | Founder OS |
| `content_tasks` | 0 | P2 | internal tools | Founder OS |
| `cadence_settings` | 0 | P2 | internal tools | Founder OS |

### `gtm` — move from public (or Phase 3 second project)

| Table | Rows | Priority | API | Notes |
|-------|------|----------|-----|-------|
| `leads` | 0 | P2 | anon insert RLS | Offline-product pilot form |
| `waitlist_signups` | 2 | P2 | anon insert RLS | Marketing waitlist |
| `exporter_leads` | 0 | P2 | anon insert RLS | Marketing site |
| `importer_leads` | 0 | P2 | anon insert RLS | Marketing site |
| `farmer_leads` | 0 | P2 | anon insert RLS | Marketing site |
| `cooperative_leads` | 0 | P2 | anon insert RLS | Marketing site |
| `country_leads` | 0 | P2 | anon insert RLS | Marketing site |

### `integrations` — move from public

| Table | Rows | Priority | API | Code touchpoints |
|-------|------|----------|-----|------------------|
| `integration_questionnaire_v2` | 0 | P1 | backend only | CoolFarm SAI v2 |
| `integration_runs_v2` | 0 | P1 | backend only | CoolFarm SAI v2 |
| `integration_evidence_v2` | 0 | P1 | backend only | CoolFarm SAI v2 |
| `integration_audit_v2` | 0 | P1 | backend only | CoolFarm SAI v2 |
| `integration_assessment_requests` | 0 | P1 | backend only | Assessment workflow |
| `yield_benchmarks` | 0 | P1 | backend only | `yield-benchmarks.controller.ts` |
| `yield_benchmark_import_runs` | 0 | P1 | backend only | Import job tracking |

### `ops` — move from public

| Table | Rows | Priority | API | Notes |
|-------|------|----------|-----|-------|
| `request_campaigns` | 0 | P1 | backend only | Dashboard request campaigns |
| `request_campaign_recipient_decisions` | 0 | P1 | backend only | Campaign fan-out |

### `internal` — move from public

| Table | Rows | Priority | API | Code touchpoints |
|-------|------|----------|-----|------------------|
| `audit_log` | 21 | P1 | backend only | Widespread; has RLS today |
| `admin_organizations` | 0 | P1 | backend only | `admin.service.ts` (runtime DDL) |
| `admin_users` | 0 | P1 | backend only | `admin.service.ts` (runtime DDL) |
| `tenant_trial_state` | 0 | P1 | backend only | `launch.service.ts` (runtime DDL) |
| `tenant_onboarding_progress` | 0 | P1 | backend only | `launch.service.ts` (runtime DDL) |
| `tenant_signup_contacts` | 0 | P0 | backend only | **RLS OFF**; onboarding email |
| `field_app_signup_contacts` | 1 | P0 | backend only | **RLS OFF**; welcome email |

---

## Codebase tables not yet in production

Formalize via migration **before** schema split (avoids moving twice).

| Table | Source | Target schema | Notes |
|-------|--------|---------------|-------|
| `agent_plot_assignment` | `tb_v16_010_*.sql` | `public` | Agent ↔ plot scope; not applied to prod |
| `farmer_push_devices` | `supabase/migrations/202606130003_*` | `public` | Push tokens; not applied to prod |
| `integration_partner_exports` | `tb_v16_018_*.sql` | `integrations` | Partner data exports |
| `inbox_requests` | `inbox.service.ts` runtime | `ops` | Must become proper migration |
| `inbox_request_events` | `inbox.service.ts` runtime | `ops` | Must become proper migration |
| `chat_threads` | `chat-threads.service.ts` runtime | `ops` | Must become proper migration |
| `chat_messages` | `chat-threads.service.ts` runtime | `ops` | Must become proper migration |

---

## Identity model (document, do not merge tables)

| Store | Schema | Role |
|-------|--------|------|
| `auth.users` | `auth` | Supabase login (email/OAuth) |
| `user_account` | `public` | Field-app business role (farmer/agent/exporter/viewer) |
| `admin_users` | `internal` | Dashboard org users (after move) |

Recommended: add explicit FK/comments linking `user_account.id` ↔ `auth.users.id` and `admin_users` ↔ `auth.users` where applicable.

---

## Phased migration checklist

### Phase 0 — Security & hygiene (no schema moves)

- [x] Enable RLS on 15 exposed tables (with policies)
- [x] Add `COMMENT ON TABLE` for all domain tables missing descriptions
- [x] Apply pending migrations: `agent_plot_assignment`, `farmer_push_devices`
- [x] Replace runtime DDL in `admin.service.ts`, `launch.service.ts`, `inbox.service.ts`, `chat-threads.service.ts`, `onboarding-email.service.ts` with versioned SQL
- [x] Confirm Supabase API settings: exposed schemas = `public`, `graphql_public`, `crm`, `gtm` (applied via Management API 2026-06-20)

### Phase 1 — Create schemas + move low-risk domains

- [x] Create schemas (`commercial`, `crm`, `gtm`, `integrations`, `ops`, `internal`)
- [x] Move integrations → commercial → internal → ops → crm → gtm (applied `phase1_schema_split`)
- [x] Backend `search_path` in `db.module.ts` for unqualified SQL
- [x] Dashboard/marketing Supabase clients use `.schema('crm')` / `.schema('gtm')`
- [x] Recreate `plot_ops_summary` with `internal.audit_log`
- [x] PostgREST exposed schemas: `public`, `graphql_public`, `crm`, `gtm` (Management API PATCH `/v1/projects/{ref}/postgrest`)

- [x] Verify `public` contains only core product + geo reference + views (~17 tables + `plot_ops_summary`)
- [x] Update Drizzle `schema.ts` — `audit_log` moved to `internal` schema; documents public-only core models
- [x] RLS policies for crm/gtm/integrations tables flagged by security advisor (PostgREST deny; service_role bypass)
- [x] Recreate `plot_ops_summary` with `security_invoker = true`
- [x] Fix `resolve_farmer_display_name` + trigger for `crm.crm_contacts` after Phase 1 schema move
- [x] Function `search_path` hardening on farmer display name helpers
- [x] Re-run Supabase security advisors — clean (2026-06-20)
- [x] PostgREST exposed schemas (same as Phase 1)

### Phase 3 — Optional second Supabase project

Move **Founder OS** (`crm` founder tables) + **all `gtm` lead tables** to **Tracebud GTM** project.

**Keep on product DB (`uzsktajlnofosxeqwdwl`):** `crm.crm_contacts` — FK to `public.farmer_profile`, used by NestJS contacts/plots/billing and `resolve_farmer_display_name()`.

- [x] Code: optional `SUPABASE_GTM_URL` + `SUPABASE_GTM_SERVICE_ROLE_KEY` on marketing + dashboard
- [x] Bootstrap SQL: `supabase/gtm-project/bootstrap.sql`
- [ ] ~~Create Supabase project **Tracebud GTM**~~ **Deferred** — not planned while staying on one Supabase project (~$10/mo saved)
- [ ] Run bootstrap; PATCH PostgREST `db_schema=public,graphql_public,crm,gtm`
- [ ] Export/import founder + gtm data from product DB
- [ ] Set env vars on Vercel (marketing + dashboard)
- [ ] Drop moved tables from product; remove `crm,gtm` from product PostgREST config

---

## Per-table migration SQL pattern

For each move:

```sql
-- Example: billing_invoices → commercial
ALTER TABLE public.billing_invoices SET SCHEMA commercial;
-- Update FKs automatically follow in Postgres 11+
-- Re-grant backend role:
GRANT ALL ON ALL TABLES IN SCHEMA commercial TO service_role;
-- Search path / qualified names in NestJS:
-- FROM commercial.billing_invoices
```

After move, add schema to backend connection `search_path` only if desired (qualified names are safer for clarity).

---

## Expected Table Editor after Phase 2

**public** (~16 objects):  
`user_account`, `farmer_profile`, `plot`, `harvest_transaction`, `voucher`, `dds_package`, `dds_package_voucher`, `consent_grants`, `plot_tenure_verification`, `evidence_documents`, `document_provenance_events`, `compliance_issues`, `voucher_buyer_claims`, `sinaph_zone`, `indigenous_zone`, `agent_plot_assignment`, `farmer_push_devices`, `plot_ops_summary` (view)

**commercial** (9) · **crm** (9) · **gtm** (7) · **integrations** (8) · **ops** (6) · **internal** (7)

---

## Security note (action required independent of reorg)

15 tables currently have **RLS disabled** while sitting in exposed `public`:

`consent_grants`, `billing_usage_meters`, `billing_invoices`, `shipment_billing_legs`, `shipment_headers`, `shipment_header_packages`, `tenant_billing_adoption_promo`, `tenant_billing_subscription`, `plot_tenure_verification`, `evidence_documents`, `document_provenance_events`, `compliance_issues`, `voucher_buyer_claims`, `tenant_signup_contacts`, `field_app_signup_contacts`

Moving to private schemas reduces PostgREST exposure, but **Phase 0 RLS policies are still required** for any table remaining in `public`.

---

## Acceptance criteria

- [x] Table Editor: each schema ≤ ~20 objects with obvious domain name
- [x] No runtime `CREATE TABLE` in NestJS services
- [x] All exposed tables have RLS enabled with explicit policies
- [x] Single migration source of truth (`supabase/migrations` synced with `tracebud-backend/sql/`)
- [ ] Backend integration tests pass with schema-qualified table names
- [x] Marketing lead forms still work (gtm schema exposed on PostgREST; verified HTTP 200)

---

## PostgREST exposed schemas (hosted)

After Phase 1 schema split, dashboard Founder OS and marketing routes need `crm` + `gtm` on the Data API. This is **platform config**, not SQL.

**Dashboard:** Integrations → Data API → Settings → Exposed schemas → add `crm`, `gtm`.

**Management API** (requires `data_api_config_write` on access token):

```bash
curl -X PATCH "https://api.supabase.com/v1/projects/{ref}/postgrest" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"db_schema":"public,graphql_public,crm,gtm"}'
```

Verify: `GET /rest/v1/prospects` with `Accept-Profile: crm` returns 200 (service role or authenticated with policy).

---

## References

- Live inventory pulled 2026-06-20 from project `uzsktajlnofosxeqwdwl`
- Existing ops view: `supabase/migrations/202606200005_plot_ops_summary_view.sql`
- RLS baseline: `tracebud-backend/sql/tb_v16_005_rls_baseline.sql`
