# FEAT: Tenure document AI review (producer-in-possession)

## Phases

| Phase | Scope | Status |
|-------|--------|--------|
| 0 | Tenure path UI (formal vs producer-in-possession), attestations + file links | Done |
| 1 | Async `plot_tenure_verification` parse job, Gemini via AI Gateway, dashboard AI badges | Done |
| 2 | `evidence_documents` + provenance + `compliance_issues`, tenure review queue, checklist gating | Done |
| 3 | Clave Catastral OCR + formal title cross-link | Done |
| 4 | Tenure alerts + package pre-flight gating + multi-country cadastral packs | Done |

## Phase 2 behavior

### Trigger
- Farmer uploads `tenure_evidence` with `storagePath` → `POST /v1/plots/:id/evidence-sync`
- Backend upserts `evidence_documents` + `plot_tenure_verification`, enqueues parse

### Parse outcomes
- `COMPLETED` — high confidence, no critical clause gaps
- `MANUAL_REQUIRED` — low confidence, missing clauses, or anti-fraud cap
- `FAILED` — download/LLM fatal error

### Compliance
- `MANUAL_REQUIRED` / `FAILED` → open `compliance_issues` row (`linked_entity_type=tenure_verification`)
- `document_provenance_events` at UPLOADED, PARSE_COMPLETED, REVIEWED

### Human review
- `GET /v1/plots/tenure-review-queue` (tenant-scoped, exporter/compliance roles)
- `POST /v1/plots/:id/tenure-verification/:verificationId/confirm-review`
- Dashboard: `/compliance/tenure-review`

### Checklist gating (offline)
- `landOk` blocked when synced tenure parse is `MANUAL_REQUIRED` or `FAILED`
- Clears after operator confirms review (`COMPLETED` + `human_review` payload)

## Permissions
- Parse enqueue: farmer/agent on owned/assigned plot
- Review queue + confirm: exporter, compliance_manager, country_reviewer, admin
- Tenant isolation via consent + `resolveFarmerIdsForTenant`

## Analytics / audit
- `tenure_parse_completed`, `tenure_parse_reviewed`, `tenure_compliance_issue_resolved`
- Provenance events on `evidence_documents`

## Phase 3 behavior

### Trigger
- `land_title` photos sync with `storagePath` (uploaded to `plot-evidence` bucket) → formal cadastral parse enqueue
- `tenure_evidence` with `tenure_type = FORMAL` also runs cross-check
- `legal-sync` with cadastral key re-evaluates existing parse rows

### Formal extraction
- Dedicated vision prompt for deeds / Clave Catastral certificates
- Extracts `parcel_reference`, `title_number`, `holder_name`, issuer, dates

### Cross-check (`cadastral_cross_check` in parse_result)
- Normalize Honduras 10-digit Clave (`012-345-678-9`)
- Compare declared `cadastralKey` (from `plot_legal_synced`) vs extracted reference
- Fuzzy holder name vs farmer profile
- Flag `informalTenure` + formal document conflict
- Mismatch → `MANUAL_REQUIRED` (same review queue as Phase 2)

### Offline
- `syncLandTitlePhotosWithFiles` uploads title photos to `plot-evidence` before `photos-sync`; only rows with `storagePath` are sent so AI tenure parse can run
- Failed storage uploads throw (queued for Sync now) instead of silent metadata-only sync
- PDF/Word land papers (`tenure_evidence`) auto-upload on add when signed in (same as photos)
- HEIC/HEIF iPhone photos supported (`202606160001_plot_evidence_heic_mime`)
- Legality backup in My Plots triggers cadastral AI review when signed in

## Phase 4 behavior

### Alerts (`TenureReviewAlertService`)
- On `MANUAL_REQUIRED` / `FAILED` after parse: Expo push + Resend email to tenant staff (deduped per verification + status)
- Farmer push: cooperative reviewing / upload clearer copy
- Audit: `tenure_review_alert_sent`
- Requires `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, optional `DASHBOARD_BASE_URL`

### Package readiness gating
- `evaluateDdsPackageReadiness` checks `plot_tenure_verification` for voucher-linked plots
- Blocker `TENURE_REVIEW_REQUIRED` — `MANUAL_REQUIRED`, `FAILED`, or open tenure compliance issue
- Warning `TENURE_PARSE_PENDING` — `PENDING` / `IN_PROGRESS`

### Cadastral country packs
- `cadastral-country-packs.ts`: HN, GT, CO, BR, PE, NI, SV, CR, PA (+ generic fallback)
- Cross-check uses farmer `country_code`; `country_pack` / `country_label` on `cadastral_cross_check`

## Acceptance criteria
- [x] Tenure sync creates `evidence_documents` row with provenance UPLOADED
- [x] MANUAL_REQUIRED creates WARNING compliance issue within 3-day due window
- [x] Confirm review resolves issue and sets parse_status COMPLETED
- [x] Plot land checklist blocks until review confirmed or parse auto-passes
- [x] Dashboard tenure review queue lists tenant-scoped items
- [x] Land title photos with storage trigger formal cadastral parse
- [x] Declared Clave cross-checked against AI extraction (Honduras normalize)
- [x] legal-sync re-evaluates cross-check when farmer updates cadastral key
- [x] Staff email + push when tenure hits MANUAL_REQUIRED or FAILED
- [x] Package readiness blocks on open tenure review for linked plots
- [x] Multi-country cadastral normalization (beyond Honduras)

## Phase 5 — upload dedup + lifecycle (2026-06-20)

### Stable storage paths (offline)
- Land-title photos and tenure evidence use `{authUserId}/{plotId}/{kind}/{localRowId}-{label}` (not `Date.now()`).
- SQLite persists `storagePath` on `plot_title_photos` / `plot_evidence`; re-sync upserts the same object (no duplicate parse rows).

### Supersede on replace (backend)
- New land-doc upload marks prior same-slot `plot_tenure_verification` rows `superseded` and resolves open compliance issues.

### Wrong-document exporter noise
- `FAILED` + `not_a_land_document` skips compliance issue + staff alert (farmer re-upload only).

### CI
- `npm run check:tenure-parse:static` in backend CI job (cadastral SQL + supersede guard).
