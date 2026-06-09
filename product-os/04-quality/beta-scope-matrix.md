# Dashboard Product — Controlled Beta Scope Matrix

Date: 2026-06-03  
Release label: **Beta** (evaluation use only; not legal/compliance advice)

## Included (cohort-ready)

| Area | Roles | Notes |
|------|-------|-------|
| Auth + onboarding | cooperative, exporter, importer, reviewer, sponsor | Canonical steps; invite-only tenant activation |
| Home dashboards | all tenant roles | Virgin-state CTAs; role-specific KPIs |
| Plots + geometry history | cooperative, exporter, agent | PostGIS-backed reads; assignment lifecycle |
| Packages + compliance readiness | exporter, importer, reviewer | DDS readiness reason codes; evidence diagnostics |
| Admin (tenant-scoped) | admin, delegated admin | Org/users, entitlements, DDS status tools |
| Launch surfaces | all | Onboarding progress, commercial profile, entitlements |
| Cool Farm + SAI V2 ops | integration operators | Live proxy routes (scheduler, run queue, claim/release/retry) |
| EUDR DDS (guarded) | compliance_manager, importer | Role-gated submit/status per backend policy |
| Feature-gated deferrals | all | `/outreach`, `/inbox` gated; `/reports` enabled by default |

## Excluded (beta)

| Area | Reason |
|------|--------|
| Public worldwide launch claims | P0-02 / P0-03 not closed |
| Request campaigns / inbox (default) | `NEXT_PUBLIC_FEATURE_REQUEST_CAMPAIGNS=false` |
| Official legal/compliance sign-off | Counsel memo pending |
| Full pilot evidence pack | P0-03 not started |
| Partner bulk export automation | Operator-only; requires explicit entitlement |

## Flagged (known limitations)

| Item | Mitigation |
|------|------------|
| `/packages/new` create flow | Client validation only; backend `POST` with `voucherIds` not wired |
| `integrations-mock-data.ts` | Deprecated; do not use for ops UI |
| Backend unit suite role drift | 37 tests need email/role fixture alignment (non-blocking for staging smoke) |
| `TEST_DATABASE_URL` not set locally | Ownership integration suite skipped until pooler URL configured |

## Beta messaging (required)

- UI/support/docs: **Beta — evaluation use only**
- No channel may claim official worldwide launch until P0-02 + P0-03 exit criteria pass.
