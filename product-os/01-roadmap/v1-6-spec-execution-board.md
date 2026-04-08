# V1.6 Spec Execution Board

## Purpose
Execution board for converting spec gaps into implementation-ready, owner-assigned work with dependencies and acceptance criteria.

## Priority 0 — Must happen before spec use

| ID | Task | Owner | Why non-delegable | Done when |
|---|---|---|---|---|
| P0-01 | Internal consistency review across Sections 1–55; track cross-references, JSONB schemas, state machines, and dependent rules; produce contradiction log and resolve all items | You | Human full-document contradiction detection is required | `contradiction-log.md` completed with all items resolved/assigned and approved |
| P0-02 | Commission legal opinion on: GDPR shredding under retention, downstream first/subsequent interpretation, and Section 45.4 liability boundary adequacy | You + counsel | EU legal interpretation cannot be delegated to generated content | Signed counsel memo received and gated sections marked legally validated |
| P0-03 | Run 3-month MVP pilot with one Tier 2 cooperative (>=20 farmers, >=1 completed batch) and one Tier 3 buyer; feed findings back to spec before Release 2 | You | Real user behavior and workflow assumptions must be validated empirically | Pilot report delivered and spec deltas applied before Release 2 build |

## Priority 1 — External Decision Gates

| ID | Task | Owner | Dependency | Done when |
|---|---|---|---|---|
| P1-01 | Decide cloud provider + approved EU regions | You | None | `data_residency_zone` list approved and documented |
| P1-02 | Confirm TRACES NT sandbox/prod WSDL URLs | You | None | Endpoint URIs verified and stored in config docs |
| P1-03 | Confirm mobile platform baseline | You + engineering | None | Platform decision signed off and reflected in Section 35 |
| P1-04 | Confirm AgStack GeoID access model | You | None | API access model and docs obtained |
| P1-05 | Legal sign-off for Section 4.3 interpretations | You + counsel | None | Signed memo and `LEGAL_REVIEW_SIGN_OFF` records captured |

## Priority 2 — Cursor-Ready Spec Hardening

| ID | Task | Owner | Dependency | Acceptance criteria |
|---|---|---|---|---|
| P2-01 | Expand API endpoint contract blocks | Cursor | None | Each endpoint group has method/path/auth/idempotency/request/response/errors |
| P2-02 | Define webhook payload schemas | Cursor | None | All mandatory trigger payloads + DDS transitions + billing events documented |
| P2-03 | Define error taxonomy | Cursor | None | Structured `error_code` matrix with status and envelope defined |
| P2-04 | Define `parse_result` per document type | Cursor | None | Required keys listed per doc type including anti-fraud fields |
| P2-05 | Define `geolocation_payload` canonical keys | Cursor | None | Canonical schema + postal-address conditional rules documented |
| P2-06 | Define `role_decision_trace` canonical keys | Cursor | None | Canonical key contract documented in shipment schema |
| P2-07 | Define `blocking_issues` canonical keys | Cursor | None | Canonical issue object keys and severity semantics documented |
| P2-08 | Control `consent_grants.purpose` vocabulary | Cursor | None | Controlled vocabulary replaces free-text purpose |
| P2-09 | Add `audit_events` partitioning strategy | Cursor | None | Monthly partitioning and retention tier policy documented |
| P2-10 | Draft deforestation intersection scoring algorithm | Cursor | None | Deterministic scoring steps and reconciliation logic documented |
| P2-11 | Expand notifications to delivery model | Cursor | None | Channel config, delivery log table, payload families, retry policy documented |
| P2-12 | Define portability export schema | Cursor | None | JSON-LD export contract and receiving-import validation rules documented |
| P2-13 | Draft Stripe integration spec | Cursor | None | Mapping, lifecycle, webhook handling, idempotency, retries documented |

## Priority 3 — Input-First Then Draft

| ID | Your input | Cursor follow-up | Dependency | Done when |
|---|---|---|---|---|
| P3-01 | Verified yield benchmark sources and values | Replace provisional seed values with cited records | P1-05 | Each seed row has source + publication reference |
| P3-02 | Approved EU hosting regions | Add residency enum + enforcement rules | P1-01 | Residency list and enforcement rules merged |
| P3-03 | GeoID API docs | Finalize endpoint/auth/rate-limit/response schema | P1-04 | Section 8.2 marked complete with factual integration details |
| P3-04 | TRACES XSD + sample envelope | Finalize exact field mapping in 21.6 | P1-02 | Mapping table references actual XSD field names |
| P3-05 | TRACES chunking behavior confirmation | Finalize chunk-reference linkage semantics | P1-02 | Section 21.8 behavior confirmed and testable |
| P3-06 | Signature model decision (Ed25519 vs eIDAS) | Finalize compliance package signature implementation | P1-05 | Section 30.3 signature rules finalized |
| P3-07 | Enterprise-size review SLA/owner | Add SLA and reviewer responsibility rules | P1-05 | SLA and role constraints documented in Section 10/28 |
| P3-08 | Stripe product/price/account model | Replace placeholders with live IDs/config model | Billing decision | Stripe section production-ready |

## Priority 4 — Infrastructure Design Pack

| ID | Task | Owner | Dependency | Done when |
|---|---|---|---|---|
| P4-01 | DB topology and pooler design | You + engineering lead | None | Primary/replica/pooler architecture approved |
| P4-02 | Async processing architecture | You + engineering lead | None | Queue/backpressure/retry design approved |
| P4-03 | Object storage + lifecycle + replication | You + engineering lead | None | Bucket policy and retention lifecycle approved |
| P4-04 | Secrets/KMS/key-rotation model | You + engineering lead | None | Vault + KMS access model approved |
| P4-05 | CI/CD model with migration safety gates | You + engineering lead | None | Pipeline policy approved |
| P4-06 | Draft infrastructure/deployment spec section | Cursor | P4-01..P4-05 | Infrastructure section merged and cross-checked against NFRs |

## Priority 5 — UX Delivery Inputs

| ID | Task | Owner | Dependency | Done when |
|---|---|---|---|---|
| P5-01 | Tier 1 wireframes/annotated flows | You + design | None | Reviewed flows for registration/consent/plots/evidence |
| P5-02 | Field-agent GPS/dedup/conflict wireframes | You + design | None | Weak-signal and warning states specified |
| P5-03 | I18n language plan | You | None | Launch language matrix + RTL decision finalized |
| P5-04 | Expand Section 36 interaction states | Cursor | P5-01..P5-03 | Validation/error/empty/loading states documented per flow |

## Priority 6 — Legal Validation Workstream

| ID | Legal task | Owner | Build gate |
|---|---|---|---|
| P6-01 | Downstream first/subsequent interpretation sign-off | You + counsel | Phase 4 |
| P6-02 | Postal-address substitution scope sign-off | You + counsel | Phase 1 |
| P6-03 | Simplified declaration eligibility sign-off | You + counsel | Phase 5 |
| P6-04 | Enterprise-size mapping sign-off | You + counsel | Phase 1 |
| P6-05 | Cryptographic shredding interpretation sign-off | You + counsel | Phase 1 |
| P6-06 | 5-year retention baseline sign-off | You + counsel | Phase 1 |
| P6-07 | Downstream burden reduction interpretation sign-off | You + counsel | Phase 4 |

## Execution Rules
- Any item with external/legal dependency cannot be marked done with speculative values.
- Any schema-affecting change must include migration notes and backward-compatibility impact.
- Any operational policy change must include audit event instrumentation.
- Any open question must have owner and deadline or be explicitly marked as release blocker.
