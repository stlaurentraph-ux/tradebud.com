# Current Focus

## In-flight (parallel work — claim before editing)

| ID | Branch | Owner | Scope | Feature doc | Status | Blocked by |
|----|--------|-------|-------|-------------|--------|------------|
| IF-001 | — | — | — | — | — | Bundle E 4.7 release health gate or human smoke secrets (2.5) |
| IF-002 | `feature/founder-os-app` | cursor | Lane 3 — Founder OS standalone ops app | `FEAT-founder-os-app.md` | in_progress | PR #141 merge + Vercel deploy |

Agents: use `.cursor/commands/start-agent-task.md`. Do not duplicate scope of an `in_progress` row.

## Work now

- **Field app device QA (2026-06-21, priority)** — Branch `feature/offline-field-sync-ui`: Metro `dev:metro:production`, Hector account. Verify Settings backup pill (no flash), sync messages (queue vs plots), Documents plot list stability, farmer name on Home/Settings, tenure jurisdiction hints on dashboard.
- **Automation ops** — **4.5** merged (PR #168): dashboard Playwright golden paths in CI. **Next:** **4.7** release health gate; human GitHub secrets for **2.5**.
- **Metro structural isolation (2026-06-20)** — Device debug unblocked. Install field deps only in `apps/offline-product`; run `npm run dev:metro:production` from that directory. Root `npm install` must not reintroduce `react-native` at repo root. `npm run check:metro-start` gates before Metro.
- **Tenure AI lifecycle (2026-06-20)** — Upload dedup + supersede + wrong-doc alert skip deployed in code; redeploy backend + reload Metro. Device QA: re-upload wrong photo → single verification row, “Upload correct land paper”, no exporter alert.
- **ADR-006 database reorg (2026-06-20)** — Phases 0–2 live on single Supabase project. Phase 3 (second GTM project) deferred; founder + lead tables stay in `crm` / `gtm` schemas on product DB.
- **Supabase ops browse (2026-06-20)** — Pin **`plot_ops_summary`** (not raw `plot`) as the team default in Supabase Table Editor. `plot.status` / `deforestation_screening_label` = GFW only; use `land_tenure_label` + `eudr_dossier_ready_hint` for dossier sorting (CRM plot detail remains authoritative).
- **Field app sync Phase 2 (2026-06-20)** — Photo failures split storage vs API; Settings uses `runFieldSyncPipeline`; Sentry breadcrumbs on sync failures. Device: re-add photo if queue row has stale picker URI; run `npm run test:maestro:sync` on signed-in simulator.
- **Field app sync (2026-06-19)** — Hardened offline sync against the production 429/"plot not on server" loop: one cached server plot-fetch per sync run (`serverPlotFetchCache`) + deterministic farmer scope (no auth-uid flip-flop). Prod DB verified healthy for the reported account (one profile `dcdd88e5…`, one plot `39d548f9…`). Device QA: with production API (`dev:metro:production`), Sync now should clear the queue without 429; watch console for a single `GET /v1/plots` per farmer id and `apiFarmerId = dcdd88e5…`.
- **Field app (2026-06-16)** — Delivery saved screen (`DeliveryLoggedPanel`) shipped on harvests tab; plot receipt tab + land-paper gating. Device QA: record delivery → share PNG → view plot receipt; queued path → Sync now.
- Mobile multi-plot delivery trip shipped (field app harvests tab); cooperative voucher intake QA pack at `product-os/04-quality/cooperative-voucher-intake-qa.md`.
- Dashboard exporter supplier directory + processing facility subtypes (contacts org list, CSV import labels).

## Tomorrow (2026-06-17)

1. **Field app device QA (priority)** — On physical iPhone: Google sign-in → Documents → plot documents → back to `/documents`; sign out → confirm UI stays signed out after tab switch (Settings + Home focus).
2. **Sign-out soak** — Repeat sign-out 3× with sync queue pending; confirm no session restore from OAuth token rotation or `refreshAuth` on focus.
3. **Producer documents completeness** — Upload FPIC + labor once on Documents; open indigenous-overlap plot and confirm checklist + plot Documents hint link back correctly.
4. **Exporter manual QA** — `product-os/04-quality/exporter-critical-path-qa.md` §1 lineage on staging if field app QA passes.
5. **Push branch** — `cursor/v0-design-review-a74f` is ahead of origin; push + preview OTA when device sign-off is green.

## Previous focus (archive)

Extracted to [`current-focus-archive.md`](current-focus-archive.md) (2026-06-20 repo hygiene — ~580 historical bullets).

## Deferred — billing production activation (env vars later)

Code is shipped (metering, month-end finalize endpoint, Stripe webhook handler, marketing pricing). **Do not set billing secrets until first paid invoicing is required.**

When ready, complete in order:

1. **Railway env** (`tracebud-backend`): `BILLING_SCHEDULER_TOKEN`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` — see `tracebud-backend/.env.production.example` and `DEPLOY_PRODUCTION.md` §2d.
2. **Stripe webhook**: register `https://api.tracebud.com/api/v1/billing/stripe/webhook` for `invoice.paid` + `invoice.payment_failed`; paste signing secret into `STRIPE_WEBHOOK_SECRET`.
3. **Month-end cron**: schedule `npm run billing:finalize-period-cron` (1st of month ~02:00 UTC) with `TRACEBUD_API_BASE` + `BILLING_SCHEDULER_TOKEN`.
4. **Per-tenant billing**: set `tenant_billing_subscription.stripe_customer_id` for orgs that should be card-charged at finalize.
5. **Smoke**: seal one shipment (origin meter) + submit one DDS (destination meter) → run manual finalize for current period → confirm webhook moves invoice to `PAID` or `FAILED` gate behavior.

Until then: usage meters and invoices work without Stripe; failed-payment gate only applies after webhooks are live.

## Priority migration lanes (v1.6)

- Spatial lane: enforce `GEOGRAPHY` + `ST_MakeValid` + area variance guard.
- Sync lane: enforce HLC conflict ordering and idempotency behavior.
- Lineage lane: enforce O(1) traversal via materialized lineage fields.
- TRACES lane: enforce payload chunking strategy and multi-reference reconciliation.
- GDPR lane: enforce cryptographic shredding with retention-safe audit preservation.

## Open first

- `product-os/02-features/FEAT-003-geospatial-mapping.md`

## Then

- `product-os/01-roadmap/dependency-map.md`
- `product-os/04-quality/acceptance-criteria.md`
- `product-os/05-decisions/ADR-001-tenant-model.md`
