# Tracebud EUDR Spec v1.6

_Canonical v1.6 specification stored in legacy filename `TRACEBUD_V1_2_EUDR_SPEC.md`._

**Status:** Build-signoff draft  
**Supersedes:** v1.5  
**Regulatory basis:** Regulation (EU) 2023/1115 as amended by Regulation (EU) 2025/2650; EU Information System / TRACES NT implementation guidance (current as of April 2026)  
**Prepared:** April 2026  

**This specification is normative unless a section is explicitly marked informative.**

---

## TABLE OF CONTENTS

1. Purpose
2. Product Thesis
3. Commercial Tier Model
4. Regulatory Constants and Versioning
5. Legal Role Model
6. Legal Role Decision Tree
7. Product Scope
8. User and Identity Model
9. Data Schema — Reference Entities
10. Data Schema — Identity and Organisation
11. Data Schema — Producer and Farmer Wallet
12. Data Schema — Plot and Geometry
13. Data Schema — Evidence and Documents
14. Data Schema — Lineage: Lots, Batches, Inputs
15. Data Schema — Shipment Model
16. Data Schema — Compliance Records
17. Data Schema — Governance, Audit, and Support
18. Offline Sync Technical Design (HLCs)
19. Deforestation Risk Engine
20. Yield-Cap Anti-Laundering Algorithm
21. DDS Preparation and TRACES NT Integration
22. Simplified Declaration Flow
23. Downstream Retention and Trader Workflows
24. Evidence Parsing Pipeline
25. Duplicate Detection
26. Billing and Metering Model
27. Notifications and Communication
28. Onboarding and Invitation Flows
29. Data Residency, GDPR, and Cryptographic Shredding
30. Reporting, Audit, and Substantiated Concerns
31. Non-Functional Requirements
32. API Contract
33. Build Phases
34. Architectural Decisions and Outcomes
35. Mobile Application Technical Design
36. User Interface and Experience Specification
37. Yield Benchmark Data Management
38. Sponsor Governance Model
39. Testing and Acceptance Criteria
40. Regulatory Profile Change Management
41. Anti-Fraud Detection Model
42. Open Questions Register
43. TRACES NT Adapter Maintenance and Monitoring
44. Yield Engine Post-Launch Calibration Protocol
45. Tracebud Legal Status and Data Processing Obligations
46. Dataset Freshness and Retroactive Re-screening Protocol
47. Platform Interoperability
48. Security Program
49. Operational Model
50. Go-to-Market and Network Bootstrap Constraints
51. MVP Scope Definition and Compliance Deadline Phasing
52. Commodity-Specific Due Diligence Requirements
53. Data Infrastructure Reality Constraints
54. Data Escrow and Business Continuity for Customer Compliance Records
55. Internal Consistency Rules

---

## 1. Purpose

This document is the build-signoff product, systems, workflow, data, controls, and integration specification for Tracebud as an EUDR compliance and traceability platform.

v1.6 hardens the v1.5 data model against physical, mathematical, and regulatory edge cases encountered at enterprise scale:
- upgrades spatial storage from EPSG:4326 `GEOMETRY` to spheroidal `GEOGRAPHY` for accurate area calculations
- introduces auto-correction (`ST_MakeValid`) for self-intersecting mobile polygons
- replaces recursive runtime lineage traversal with O(1) materialized root arrays
- adds payload chunking to bypass TRACES NT 25MB and vertex limits
- replaces flawed client-clock sync logic with Hybrid Logical Clocks (HLCs)
- introduces cryptographic shredding for GDPR Right to Erasure without breaking immutable 5-year compliance audits

---

## 2. Product Thesis

Tracebud is the compliance operating system for fragmented and smallholder-heavy EUDR supply chains.

The product must do all of the following reliably:
- capture producer, plot, and evidence data in low-connectivity environments
- preserve provenance through aggregation, transformation, and shipment preparation
- generate operator-ready and downstream-ready compliance artifacts aligned to the EU Information System
- preserve producer portability and governed data sharing without weakening auditability

Core differentiators:
- portable GeoID-linked producer identity (farmer owns their record)
- yield-cap anti-laundering that detects over-claim before submission
- batch lineage that survives aggregation, split, and transformation
- role-aware workflows that correctly distinguish operator vs. downstream operator vs. trader at the workflow level, not the org level

### 2.1 Design principles

- Legal role is determined per workflow, never as a static organisation label.
- Legally required facts, Tracebud-scored indicators, and user attestations must be stored in separate fields or tables.
- No compliance-relevant submission or evidence history is overwritten in place; supersession is always by forward-chained record with immutable FK linkage.
- Where the law is explicit, product behavior must be explicit; where the law is silent, configurable policy must be versioned and attributable.
- Every rules-engine output must store the exact input set, dataset version, and rule profile version used at evaluation time.
- Lineage traversal must be O(1) at runtime (materialized at aggregation).
- Producer data sovereignty is enforced by consent grants, with cryptographic shredding to handle GDPR revocations.

---

## 3. Commercial Tier Model

A commercial tier controls pricing, permissions, support, sponsorship, and feature packaging only. It is not an EUDR legal role.

| Tier | Persona | Subscription | Per-shipment fee | Primary function |
|---|---|---|---|---|
| Tier 1 | Farmers & Micro-Producers | Free forever | — | Identity, wallet, plot data, evidence, simplified-path |
| Tier 2 | Exporters, Collectors & Cooperatives | Free at 1 farmer | €0.50/shipment | Aggregation, lineage, shipment preparation |
| Tier 3 | EU Importers, Roasters & Brands | Free at 1 supplier | €0.50/shipment | DDS preparation, downstream workflows, reporting |
| Tier 4 | Network Sponsors | Custom | Sponsor-covered or custom pass-through | Governance, delegated admin |

### 3.1 Tier 2 subscription bands

| Band | Farmer range | Monthly base |
|---|---|---|
| Starter | 1–50 | €19 |
| Growth | 51–500 | €49 |
| Scale | 501–3,000 | €99 |
| Enterprise | >3,000 | Custom |

### 3.2 Tier 3 subscription bands

| Band | Supplier range | Monthly base |
|---|---|---|
| Starter | 1–5 | €49 |
| Growth | 6–25 | €99 |
| Scale | 26–100 | €149 |
| Enterprise | >100 | Custom |

### 3.3 Free sub-tier policy

- Free registration requires no credit card.
- Payment method is collected only at first paid shipment unlock or voluntary credit purchase.
- The Free sub-tier includes a soft cap of 5 shipment-billed workflows per rolling 12 months.
- Soft-cap exceedance prompts upgrade review or sponsor outreach but does not hard-block compliance-critical historical access.
- The threshold may be adjusted only via an auditable commercial-policy override recorded against the organisation by Tracebud ops with explicit justification.

---

## 4. Regulatory Constants and Versioning

All regulatory constants must be versioned by `regulatory_profile_version`. No module may hard-code a regulatory date, threshold, or classification.

### 4.1 Baseline profile — `eudr_v1_2026`

Active as of April 2026:

| Constant | Value |
|---|---|
| Application date — medium and large operators and traders | 30 December 2026 |
| Application date — micro and small undertakings | 30 June 2027 |
| Deforestation cutoff date | 31 December 2020 |
| Audit retention baseline | 5 years |
| Postal-address substitution | Allowed only in legally eligible simplified-path workflows; not a general plot-geolocation substitute |
| Simplified declaration eligibility | Evaluated against the amended 2025/2650 regime; not inferred from commercial tier alone |
| Point-buffer default (risk engine) | 1.0 ha (Tracebud Product Policy; configured via risk-engine profile) |
| Yield PASS threshold | ratio ≤ 1.10 |
| Yield WARNING threshold | 1.10 < ratio ≤ 1.30 |
| Yield BLOCKED threshold | ratio > 1.30 |

### 4.2 Versioning rule

- Every DDS, simplified declaration, role decision, compliance package, and rules-engine run must store the `regulatory_profile_version` used.
- Historical records must never be recomputed in place after a regulatory profile changes.
- Superseding records must link back to the superseded record by immutable FK.

### 4.3 Regulatory Interpretation Sign-Off

The following interpretations in this specification are the product team's reading of Regulation (EU) 2023/1115 as amended by Regulation (EU) 2025/2650. Each interpretation must be validated by qualified legal counsel before the relevant feature is shipped. The sign-off record must be stored as an `audit_events` entry with `event_type = LEGAL_REVIEW_SIGN_OFF`.

Interpretations requiring sign-off:
1. The downstream operator first/subsequent distinction and the claim that only the first downstream operator must retain reference numbers.
2. The postal-address substitution restriction to low-risk country + micro/small primary operator pathway.
3. The simplified declaration eligibility conditions, specifically the "goods exclusively self-produced" requirement.
4. The enterprise-size mapping to EU Directive 2013/34/EU definitions.
5. The claim that the amended regime reduces downstream burden and limits reference-number obligations to the first downstream actor.
6. The 5-year audit retention baseline.
7. The interpretation that cryptographic shredding satisfies GDPR erasure obligations when records are tied to submitted DDS objects.

---

## 5. Legal Role Model

The system models the following workflow roles explicitly:

- `OUT_OF_SCOPE`
- `OPERATOR`
- `MICRO_SMALL_PRIMARY_OPERATOR`
- `DOWNSTREAM_OPERATOR_FIRST`
- `DOWNSTREAM_OPERATOR_SUBSEQUENT`
- `TRADER`
- `PENDING_MANUAL_CLASSIFICATION`

A single organisation may carry different roles across different workflows, shipment lines, and time periods.

### 5.1 Definitions

- **Operator:** the first person placing a relevant product on the EU market or exporting it where no valid upstream coverage already applies.
- **Micro/Small Primary Operator:** an operator legally eligible for the simplified primary-operator pathway under the active regulatory profile.
- **Downstream Operator (first):** the first downstream operator receiving goods already covered by a valid upstream DDS or valid simplified declaration. Subject to the stricter downstream reference-retention workflow. Only this role must collect and retain reference numbers or declaration IDs.
- **Downstream Operator (subsequent):** a later downstream operator in the already-covered chain. Exempt from the reference-number retention obligation of the first downstream operator to avoid paperwork build-up.
- **Trader:** an actor making relevant products available on the market without being classified as operator or downstream operator for that workflow.
- **Out of Scope:** product not in Annex I scope under the active profile.
- **Pending Manual Classification:** safety state used where legal role cannot be resolved confidently. Blocks all submission.

---

## 6. Legal Role Decision Tree

The system determines legal role per workflow object, not per organisation.
In v1.6, simplified-path eligibility is additionally enforced by database and service-layer validation, including check constraints on simplified-path parameters.

```text
INPUT:
organisation_id
workflow_object_id
workflow_object_type
regulatory_profile_version

Step 1 — Is the product in scope under Annex I for the active regulatory profile?
NO -> Role = OUT_OF_SCOPE. Workflow = OUT_OF_SCOPE_WORKFLOW. Exit.
YES -> Continue.

Step 2 — Is this organisation placing the covered goods on the EU market or exporting them from the EU for the first time in this workflow?
YES -> Continue to Step 3.
NO -> Continue to Step 5.

Step 3 — Does a valid upstream DDS or valid simplified declaration already cover the same goods scope?
YES -> Continue to Step 5.
NO -> Continue to Step 4.

Step 4 — Is the organisation legally eligible for the simplified primary-operator pathway?
All conditions must be true under the active profile:
- eligible country-risk context
- enterprise_size = MICRO or SMALL
- goods are exclusively self-produced / self-grown / self-harvested
- workflow falls within simplified-path scope
YES -> Role = MICRO_SMALL_PRIMARY_OPERATOR. Workflow = SIMPLIFIED_DECLARATION_WORKFLOW. Exit.
NO -> Role = OPERATOR. Workflow = DDS_WORKFLOW. Exit.

Step 5 — Are the goods covered by a valid upstream DDS or simplified declaration?
NO -> Role = PENDING_MANUAL_CLASSIFICATION. Workflow = MANUAL_HOLD_WORKFLOW. Exit.
YES -> Continue to Step 6.

Step 6 — Is this organisation merely making goods available on the market without being the first downstream-operator event owner?
YES -> Role = TRADER. Workflow = TRADER_RETENTION_WORKFLOW. Exit.
NO -> Continue to Step 7.

Step 7 — Is this the first downstream-operator event recorded for the covered goods chain?
YES -> Role = DOWNSTREAM_OPERATOR_FIRST. Workflow = DOWNSTREAM_REFERENCE_WORKFLOW. Exit.
NO -> Role = DOWNSTREAM_OPERATOR_SUBSEQUENT. Workflow = DOWNSTREAM_REFERENCE_WORKFLOW. Exit.
```

### 6.1 Mandatory manual-hold triggers
The system must assign PENDING_MANUAL_CLASSIFICATION where any of the following apply:
- upstream DDS reference is invalid, withdrawn, rejected, superseded, expired, or disputed
- goods scope cannot be matched confidently between source records and shipment line
- Annex I product classification is unresolved
- enterprise-size evidence is missing for a simplified-path claim
- country-risk profile changed after draft preparation and before sealing

### 6.2 Hold behavior
No shipment may be sealed, no DDS submitted, and no simplified declaration submitted while role = PENDING_MANUAL_CLASSIFICATION. Every hold must produce a compliance_issues record with a named owner and resolution path.

## 7. Product Scope
### 7.1 In scope for v1.6
producer and plot onboarding
online and offline field capture
GeoID-linked producer identity and farmer data wallet
versioned geometry capture and provenance
duplicate producer and duplicate plot detection
evidence upload, parsing, and provenance chain
consent grant management and producer portability
lot, batch, and shipment coverage lineage
risk screening and legal land-use evidence workflows
configurable yield-cap and volume plausibility checks
shipment assembly using header + line + coverage model
role-aware operator, simplified-path, downstream, and trader workflows
structured cross-org evidence requests with reminders and escalations
manual-assist and API-direct submission support
retention workflows and audit logs
sponsor governance and delegated admin
annual reporting support
substantiated-concern case handling
GDPR-compliant access, portability, retention, and end-of-relationship handling
credential vault for API-direct submission
### 7.2 Out of scope for v1.6
physical logistics execution
customs brokerage
commodity payment rails
carbon-credit issuance
public-government registry infrastructure
arbitrary multi-regulation rules engines not explicitly modelled
full CSRD module beyond basic EUDR-adjacent export compatibility

## 8. User and Identity Model
Tracebud uses a three-layer identity model.
Layer 1 — Persons
A person is an individual with login credentials, a profile, language preference, contact channels, and device registrations.
Layer 2 — Organisations
An organisation is a legal or operational entity. Every organisation has a commercial tier, one or more legal roles per workflow, country and jurisdiction metadata, commodity scope, supplier/customer links, a billing owner, and a data-retention policy.
Layer 3 — Network memberships
An organisation may belong to one or more sponsor-managed or buyer-managed networks. Network membership grants visibility and task-routing rights without transferring underlying ownership of farmer-origin data unless explicitly authorised by consent grant.

### 8.1 Role-Based Access Control (RBAC)
Roles in `org_members.role`: OWNER, ADMIN, COMPLIANCE_MANAGER, FIELD_AGENT, VIEWER, BILLING_CONTACT.

Permission matrix (Y = allowed, N = blocked, C = conditional by delegated policy):

| Action | OWNER | ADMIN | COMPLIANCE_MANAGER | FIELD_AGENT | VIEWER | BILLING_CONTACT |
|---|---|---|---|---|---|---|
| Seal shipment header | Y | Y | Y | N | N | N |
| Submit DDS or simplified declaration | Y | Y | Y | N | N | N |
| Amend or retract submitted DDS | Y | Y | Y | N | N | N |
| Approve yield exception request | Y | Y | Y | N | N | N |
| Revoke consent grant | Y | Y | Y | N | N | N |
| Resolve dedup review task | Y | Y | Y | C | N | N |
| Merge duplicate producers or plots | Y | Y | Y | N | N | N |
| Capture or edit plot geometry | Y | Y | Y | Y | N | N |
| Upload evidence documents | Y | Y | Y | Y | N | N |
| Create or close compliance issue | Y | Y | Y | C | N | N |
| Manage org billing and payment methods | Y | C | N | N | N | Y |
| Invite or remove org members | Y | Y | N | N | N | N |
| Trigger portability export | Y | Y | Y | N | N | N |
| Access annual reporting snapshots | Y | Y | Y | C | Y | Y |
| Configure risk or yield engine profiles | C | C | N | N | N | N |

Rules:
- Tier 4 sponsor admins may configure risk and yield profiles only for sponsor-scoped networks they govern.
- Any C action requires explicit delegated policy and must write an audit event.
- Enforcement model is dual: service-layer permission checks are mandatory before write operations; RLS enforces tenant isolation independently. Both are required.

### 8.2 GeoID Integration
GeoID is an external AgStack identity anchor used as a portable producer identifier. It is not a Tracebud-managed identity system.

Integration contract:
- Tracebud consumes GeoID as a read-only external reference and never creates GeoID records on behalf of producers.
- GeoID lookup endpoint, authentication method, and rate-limit policy are integration-config values in environment-specific connector settings and must be versioned in deployment docs.
- Producer onboarding succeeds even when GeoID is missing or unavailable: `producers.geoid_external_id` remains NULL and a deferred linkage task is queued.
- Uniqueness contract: one GeoID per `producers.id` within a network.
- A matching GeoID across separate networks is treated as a HIGH-confidence duplicate signal and must create a `dedup_review_tasks` record.
- If GeoID lookup fails during sync, Tracebud uses cached value, writes a `compliance_issues` record with severity INFO, and does not block workflow.
- Portability contract: GeoID is always included as a top-level identifier in payloads generated from `portability_requests`.

### 8.3 Device Registration and Revocation
SQL

person_devices
id                 UUID PK NOT NULL
person_id          UUID FK → persons.id NOT NULL
device_fingerprint TEXT NOT NULL
platform           ENUM NOT NULL (IOS, ANDROID, WEB)
os_version         TEXT NULLABLE
app_version        TEXT NOT NULL
push_token         TEXT NULLABLE
last_seen_at       TIMESTAMPTZ NULLABLE
registered_at      TIMESTAMPTZ NOT NULL
revoked_at         TIMESTAMPTZ NULLABLE
revoked_by_id      UUID FK → persons.id NULLABLE
revocation_reason  ENUM NULLABLE (LOST, STOLEN, DECOMMISSIONED, POLICY)
created_at         TIMESTAMPTZ NOT NULL

Rules:
- A device is registered on first successful authentication; `device_fingerprint` is generated on-device, persisted locally, transmitted during authentication, and stored server-side.
- Device revocation invalidates all device-associated sync tokens immediately. Any sync operation sent after `revoked_at` must be rejected with 401.
- On revocation, the system auto-creates a `portability_requests` record of type `IDENTITY_ONLY` for each producer with pending unsynced operations associated with the revoked device.
- Lost-device recovery requires authentication on a new device; operations arriving from revoked `device_fingerprint` values must be logged to `access_logs` with `result = DENIED`.

## 9. Data Schema — Reference Entities
All entities use UUID primary keys. Timestamps are UTC ISO 8601. Compliance-relevant records are never hard-deleted during their retention window. Soft deletion is used only for UI concealment.
SQL


commodities
id                  UUID PK
code                TEXT UNIQUE NOT NULL        -- e.g. COFFEE_GREEN
common_name         TEXT NOT NULL
annex_i_group       TEXT NOT NULL               -- COFFEE, COCOA, RUBBER, etc.
traces_description  TEXT NULLABLE
default_unit        TEXT NOT NULL DEFAULT 'kg'
species_support     BOOLEAN NOT NULL DEFAULT FALSE
active              BOOLEAN NOT NULL DEFAULT TRUE
created_at          TIMESTAMPTZ NOT NULL
updated_at          TIMESTAMPTZ NOT NULL

commodity_species
id                  UUID PK
commodity_id        UUID FK → commodities.id NOT NULL
scientific_name     TEXT NOT NULL
common_name         TEXT NULLABLE
active              BOOLEAN NOT NULL DEFAULT TRUE

annex_i_products
id                         UUID PK
regulatory_profile_version TEXT NOT NULL
hs_code                    TEXT NOT NULL
cn_code                    TEXT NULLABLE
commodity_id               UUID FK → commodities.id
product_description        TEXT NOT NULL
in_scope                   BOOLEAN NOT NULL
effective_from             DATE NOT NULL
effective_to               DATE NULLABLE

regulatory_profiles
id             UUID PK
version        TEXT UNIQUE NOT NULL   -- e.g. eudr_v1_2026
title          TEXT NOT NULL
effective_from DATE NOT NULL
effective_to   DATE NULLABLE
constants      JSONB NOT NULL
-- required keys:
--   application_date_large        DATE
--   application_date_micro_small  DATE
--   deforestation_cutoff_date     DATE
--   audit_retention_years         INTEGER
--   postal_address_allowed_scope  TEXT[]
created_at     TIMESTAMPTZ NOT NULL

country_risk_profiles
id                         UUID PK
country_iso                CHAR(2) NOT NULL
regulatory_profile_version TEXT NOT NULL
risk_tier                  ENUM NOT NULL (LOW, STANDARD, HIGH)
basis_note                 TEXT NULLABLE
assessed_at                DATE NOT NULL
effective_from             DATE NOT NULL
effective_to               DATE NULLABLE
created_at                 TIMESTAMPTZ NOT NULL
UNIQUE(country_iso, regulatory_profile_version, effective_from)

yield_engine_profiles
id               UUID PK
version          TEXT UNIQUE NOT NULL
title            TEXT NOT NULL
pass_ratio       NUMERIC(5,3) NOT NULL DEFAULT 1.10
warning_ratio    NUMERIC(5,3) NOT NULL DEFAULT 1.30
blocked_ratio    NUMERIC(5,3) NOT NULL DEFAULT 1.30
-- BLOCKED when ratio > blocked_ratio
default_cropping_share NUMERIC(4,3) NOT NULL DEFAULT 0.50
active           BOOLEAN NOT NULL DEFAULT TRUE
created_at       TIMESTAMPTZ NOT NULL

yield_benchmarks
id                 UUID PK
commodity_id       UUID FK → commodities.id NOT NULL
country_iso        CHAR(2) NOT NULL
province           TEXT NULLABLE
harvest_year       SMALLINT NULLABLE    -- NULL = perennial default
planting_year_age  SMALLINT NULLABLE    -- for juvenile curve
yield_lower_kg_ha  NUMERIC(10,3) NOT NULL
yield_upper_kg_ha  NUMERIC(10,3) NOT NULL
source_type        ENUM NOT NULL (SPONSOR_OVERRIDE, NATIONAL_STATS, USDA_FAS, FAOSTAT)
source_reference   TEXT NULLABLE
default_intercrop_density_factor NUMERIC(4,3) NOT NULL
juvenile_factor    NUMERIC(4,3) NULLABLE   -- null = use engine default curve
seasonality_factor NUMERIC(4,3) NOT NULL DEFAULT 1.00
engine_profile_version TEXT NOT NULL
active             BOOLEAN NOT NULL DEFAULT TRUE
created_at         TIMESTAMPTZ NOT NULL
updated_at         TIMESTAMPTZ NOT NULL

legal_compliance_requirements
id                         UUID PK
regulatory_profile_version TEXT NOT NULL
country_iso                CHAR(2) NOT NULL
commodity_id               UUID FK → commodities.id NULLABLE
requirement_type           TEXT NOT NULL
required_evidence_type     TEXT NOT NULL
optionality_level          ENUM NOT NULL (MANDATORY, RECOMMENDED, CONDITIONAL)
max_document_age_days      INTEGER NULLABLE
reviewer_qualification     TEXT NULLABLE
country_law_citation       TEXT NULLABLE
escalation_rule_if_absent  TEXT NULLABLE
active                     BOOLEAN NOT NULL DEFAULT TRUE
created_at                 TIMESTAMPTZ NOT NULL
updated_at                 TIMESTAMPTZ NOT NULL



## 10. Data Schema — Identity and Organisation
SQL


persons
id                  UUID PK NOT NULL
email               TEXT UNIQUE NOT NULL
email_verified      BOOLEAN NOT NULL DEFAULT FALSE
phone_e164          TEXT NULLABLE
full_name           TEXT NOT NULL
preferred_language  CHAR(5) NOT NULL DEFAULT 'en'
auth_provider       TEXT NOT NULL DEFAULT 'email'
auth_provider_id    TEXT NULLABLE
mfa_enabled         BOOLEAN NOT NULL DEFAULT FALSE
last_login_at       TIMESTAMPTZ NULLABLE
created_at          TIMESTAMPTZ NOT NULL
updated_at          TIMESTAMPTZ NOT NULL
deleted_at          TIMESTAMPTZ NULLABLE

organisations
id                          UUID PK NOT NULL
legal_name                  TEXT NOT NULL
trading_name                TEXT NULLABLE
country_iso                 CHAR(2) NOT NULL
registration_number         TEXT NULLABLE
registration_type           TEXT NULLABLE
vat_number                  TEXT NULLABLE
eori_number                 TEXT NULLABLE
tin_equivalent              TEXT NULLABLE
address_line_1              TEXT NULLABLE
address_line_2              TEXT NULLABLE
city                        TEXT NULLABLE
postal_code                 TEXT NULLABLE
jurisdiction                TEXT NULLABLE
organisation_type           ENUM NOT NULL (FARMER, COOPERATIVE, EXPORTER, IMPORTER, ROASTER, BRAND, SPONSOR, OTHER)
commercial_tier             SMALLINT NOT NULL CHECK (commercial_tier BETWEEN 1 AND 4)
billing_subtier             TEXT NOT NULL   -- Starter, Growth, Scale, Enterprise
enterprise_size             ENUM NULLABLE (MICRO, SMALL, MEDIUM, LARGE)
enterprise_size_evidence_id UUID FK → evidence_documents.id NULLABLE
enterprise_size_evidence_doc_ids UUID[] NOT NULL DEFAULT '{}'
enterprise_size_verified_at TIMESTAMPTZ NULLABLE
enterprise_size_verified_by UUID FK → persons.id NULLABLE
information_system_registration_id TEXT NULLABLE
information_system_registration_status ENUM NULLABLE (NOT_REQUIRED, REQUIRED_PENDING, ACTIVE, SUSPENDED)
active_farmer_count         INTEGER NOT NULL DEFAULT 0
active_supplier_count       INTEGER NOT NULL DEFAULT 0
billing_subtier_locked_until DATE NULLABLE
billing_owner_id            UUID FK → persons.id NULLABLE
plan_status                 ENUM NOT NULL (ACTIVE, SUSPENDED, CANCELLED, TRIAL)
data_residency_zone         TEXT NOT NULL DEFAULT 'eu'
created_at                  TIMESTAMPTZ NOT NULL
updated_at                  TIMESTAMPTZ NOT NULL
deleted_at                  TIMESTAMPTZ NULLABLE

-- Rules:
-- - EORI is not globally mandatory.
-- - Operator identity for outbound submission must be resolved from one or more of: EORI, VAT number, national registration number, TIN equivalent.
-- - address_line_1 and city are mandatory before outbound operator submission.
-- - enterprise_size must have supporting evidence for simplified-path claims.
-- - non-SME trader/downstream workflows require information system registration before sealing.

enterprise_size_assessments
id                          UUID PK NOT NULL
organisation_id             UUID FK → organisations.id NOT NULL
declared_enterprise_size    ENUM NOT NULL (MICRO, SMALL, MEDIUM, LARGE)
evidence_doc_ids            UUID[] NOT NULL DEFAULT '{}'
review_status               ENUM NOT NULL (PENDING_REVIEW, APPROVED, REJECTED)
reviewed_by_id              UUID FK → persons.id NULLABLE
reviewed_at                 TIMESTAMPTZ NULLABLE
review_note                 TEXT NULLABLE
created_at                  TIMESTAMPTZ NOT NULL
updated_at                  TIMESTAMPTZ NOT NULL

-- Rules:
-- - Only APPROVED assessments may set organisations.enterprise_size to a value used for simplified-path eligibility.
-- - PENDING_REVIEW or REJECTED assessments must keep producer simplified_path_eligible = FALSE.

org_members
id              UUID PK NOT NULL
organisation_id UUID FK → organisations.id NOT NULL
person_id       UUID FK → persons.id NOT NULL
role            ENUM NOT NULL (OWNER, ADMIN, COMPLIANCE_MANAGER, FIELD_AGENT, VIEWER, BILLING_CONTACT)
invited_by_id   UUID FK → persons.id NULLABLE
joined_at       TIMESTAMPTZ NULLABLE
status          ENUM NOT NULL (PENDING, ACTIVE, SUSPENDED, REMOVED)
created_at      TIMESTAMPTZ NOT NULL
updated_at      TIMESTAMPTZ NOT NULL
UNIQUE(organisation_id, person_id)

org_invitations
id                  UUID PK NOT NULL
organisation_id     UUID FK → organisations.id NOT NULL
invited_email       TEXT NOT NULL
role                ENUM NOT NULL
token               TEXT UNIQUE NOT NULL
invited_by_id       UUID FK → persons.id NOT NULL
expires_at          TIMESTAMPTZ NOT NULL
accepted_at         TIMESTAMPTZ NULLABLE
revoked_at          TIMESTAMPTZ NULLABLE
created_at          TIMESTAMPTZ NOT NULL

network_relationships
id                       UUID PK NOT NULL
sponsor_org_id           UUID FK → organisations.id NOT NULL
member_org_id            UUID FK → organisations.id NOT NULL
relationship_type        ENUM NOT NULL (SPONSORED, BUYER_SUPPLIER)
sponsor_billing_coverage BOOLEAN NOT NULL DEFAULT FALSE
data_visibility_policy   JSONB NOT NULL DEFAULT '{}'
status                   ENUM NOT NULL (ACTIVE, SUSPENDED, ENDED)
started_at               DATE NOT NULL
ended_at                 DATE NULLABLE
created_at               TIMESTAMPTZ NOT NULL
updated_at               TIMESTAMPTZ NOT NULL

api_credentials
id                  UUID PK NOT NULL
organisation_id     UUID FK → organisations.id NOT NULL
credential_type     ENUM NOT NULL (TRACES_NT_API, WEBHOOK_SIGNING, INTERNAL_API)
encrypted_value     TEXT NOT NULL   -- AES-256-GCM, application-level key
key_reference       TEXT NOT NULL   -- reference to KMS key ID; never stores raw
description         TEXT NULLABLE
expires_at          TIMESTAMPTZ NULLABLE
last_used_at        TIMESTAMPTZ NULLABLE
revoked_at          TIMESTAMPTZ NULLABLE
created_by_id       UUID FK → persons.id NOT NULL
created_at          TIMESTAMPTZ NOT NULL

-- Rules for api_credentials:
-- - Raw credential values are never stored; only encrypted ciphertext plus KMS key ref.
-- - Rotation must be triggered before expires_at; notifications sent 30 days prior.
-- - Revoked credentials cannot be reactivated; a new record must be created.



## 11. Data Schema — Producer and Farmer Wallet
SQL


producers
id                            UUID PK NOT NULL
owner_org_id                  UUID FK → organisations.id NOT NULL
geoid_external_id             TEXT NULLABLE    -- portable AgStack GeoID
national_id_hash              TEXT NULLABLE    -- SHA-256 of national ID; never raw
full_name                     TEXT NULLABLE -- nullable for cryptographic shredding
aliases                       TEXT[] NOT NULL DEFAULT '{}'
phone_e164                    TEXT NULLABLE
anonymized_at                 TIMESTAMPTZ NULLABLE
gender                        ENUM NULLABLE (M, F, OTHER, UNDISCLOSED)
date_of_birth_year            SMALLINT NULLABLE
country_iso                   CHAR(2) NOT NULL
province                      TEXT NULLABLE
district                      TEXT NULLABLE
village                       TEXT NULLABLE
verification_status           ENUM NOT NULL (UNVERIFIED, PENDING, VERIFIED, DISPUTED)
simplified_path_eligible      BOOLEAN NOT NULL DEFAULT FALSE
simplified_path_basis         TEXT NULLABLE
duplicate_status              ENUM NOT NULL (UNIQUE, SUSPECTED_DUPLICATE_HIGH, MERGED, CANONICAL)
canonical_producer_id         UUID FK → producers.id NULLABLE
wallet_active                 BOOLEAN NOT NULL DEFAULT TRUE
capture_method                ENUM NOT NULL (FIELD_AGENT, SELF_ENROLL, BULK_IMPORT)
captured_by_user_id           UUID FK → persons.id NULLABLE
captured_at                   TIMESTAMPTZ NOT NULL
created_at                    TIMESTAMPTZ NOT NULL
updated_at                    TIMESTAMPTZ NOT NULL
deleted_at                    TIMESTAMPTZ NULLABLE

producer_org_memberships
id                  UUID PK NOT NULL
producer_id         UUID FK → producers.id NOT NULL
organisation_id     UUID FK → organisations.id NOT NULL
membership_type     ENUM NOT NULL (MEMBER, CONTRACTED, ASSOCIATED)
started_at          DATE NOT NULL
ended_at            DATE NULLABLE
created_at          TIMESTAMPTZ NOT NULL
updated_at          TIMESTAMPTZ NOT NULL

consent_grants
id                    UUID PK NOT NULL
producer_id           UUID FK → producers.id NOT NULL
grantee_org_id        UUID FK → organisations.id NOT NULL
purpose_code          ENUM NOT NULL (COMPLIANCE_COLLECTION, SHIPMENT_PREPARATION, DDS_SUBMISSION, DOWNSTREAM_REFERENCE_SHARING, AUDIT_RESPONSE, PORTABILITY_TRANSFER)
purpose_detail        TEXT NULLABLE
data_scope            TEXT[] NOT NULL   -- e.g. ['plots','evidence','identity']
onward_sharing        BOOLEAN NOT NULL DEFAULT FALSE
granted_at            TIMESTAMPTZ NOT NULL
expires_at            TIMESTAMPTZ NULLABLE
revoked_at            TIMESTAMPTZ NULLABLE -- triggers cryptographic shredding pipeline
revoked_by_person_id  UUID FK → persons.id NULLABLE
consent_mechanism     ENUM NOT NULL (VERBAL_WITNESSED, WRITTEN, DIGITAL, PROXY)
evidence_document_id  UUID FK → evidence_documents.id NULLABLE
created_at            TIMESTAMPTZ NOT NULL
updated_at            TIMESTAMPTZ NOT NULL

-- Rules:
-- - An active consent grant must exist before any org may access producer data outside their own sourcing relationship.
-- - Revocation is prospective only. Historical compliance records remain accessible to the granted org for the legally required retention period.
-- - Wallet portability: if a producer moves between cooperatives, the producer record, historical evidence chain, and GeoID are preserved; network-specific permissions are recalculated, not cloned.

### 11.4 Consent Revocation and In-Flight Workflow Rules
When consent is revoked during an in-flight workflow, processing behavior is state-specific:

| Workflow state | Effect of revocation |
|---|---|
| batch in `PENDING` yield check | Yield check completes using already-stored plot data; revocation does not interrupt the run; result is stored; batch proceeds normally |
| batch in yield check `BLOCKED` | `yield_appeal_tasks` remains active; revocation does not close the appeal; cooperative retains appeal access for legally required retention period |
| shipment in `DRAFT` or `READY` | No shipment-state change; shipment may still be sealed using already-allocated coverage data; revocation does not retrospectively invalidate coverage |
| shipment in `SEALED` or `SUBMITTED` | No change; sealed payload is immutable; revocation cannot alter submitted or accepted DDS outcomes |
| active `requests` record for producer evidence | Request remains `OPEN`; producer org receives revocation notice; request cannot be fulfilled unless a new consent grant is obtained |

Normative rule:
Consent revocation never blocks completion of a compliance workflow initiated before `revoked_at`. It blocks only new workflows initiated after the revocation timestamp.



## 12. Data Schema — Plot and Geometry
SQL


plots
id                          UUID PK NOT NULL
producer_id                 UUID FK → producers.id NOT NULL
commodity_id                UUID FK → commodities.id NOT NULL
country_iso                 CHAR(2) NOT NULL
province                    TEXT NULLABLE
district                    TEXT NULLABLE
geolocation_mode            ENUM NOT NULL (POLYGON, POINT, POSTAL_ADDRESS)
geography                   GEOGRAPHY NULLABLE      -- spheroidal area-accurate storage
latitude                    NUMERIC(10,7) NULLABLE
longitude                   NUMERIC(10,7) NULLABLE
postal_address              TEXT NULLABLE
postal_address_legal_basis  TEXT NULLABLE
area_ha                     NUMERIC(10,4) NULLABLE   -- computed via ST_Area(geography)
area_source                 ENUM NULLABLE (GPS_CAPTURE, SATELLITE_ESTIMATE, CADASTRAL, SELF_REPORTED)
planting_year               SMALLINT NULLABLE
species_id                  UUID FK → commodity_species.id NULLABLE
cropping_share              NUMERIC(4,3) NULLABLE
intercropped                BOOLEAN NOT NULL DEFAULT FALSE
capture_method              ENUM NOT NULL (MOBILE_GPS, WEB_DRAW, BULK_IMPORT, AGENT_ENTRY, SATELLITE_DERIVED)
capture_device_id           TEXT NULLABLE
captured_at                 TIMESTAMPTZ NOT NULL
captured_by_user_id         UUID FK → persons.id NULLABLE
latest_geometry_version     INTEGER NOT NULL DEFAULT 1
deforestation_check_status  ENUM NOT NULL (PENDING, CLEAR, FLAGGED, UNAVAILABLE, FAILED, UNDER_REVIEW)
deforestation_checked_at    TIMESTAMPTZ NULLABLE
deforestation_dataset_version TEXT NULLABLE
risk_score                  NUMERIC(5,4) NULLABLE
risk_tier                   ENUM NULLABLE (LOW, STANDARD, HIGH)
legal_land_use_status       ENUM NOT NULL (UNVERIFIED, VERIFIED_COMPLIANT, VERIFIED_NON_COMPLIANT, UNDER_REVIEW)
duplicate_status            ENUM NOT NULL (UNIQUE, SUSPECTED_DUPLICATE_HIGH, SUSPECTED_DUPLICATE_MEDIUM, MERGED, CANONICAL)
canonical_plot_id           UUID FK → plots.id NULLABLE
created_at                  TIMESTAMPTZ NOT NULL
updated_at                  TIMESTAMPTZ NOT NULL
deleted_at                  TIMESTAMPTZ NULLABLE

-- Constraints:
-- - POSTAL_ADDRESS mode requires postal_address_legal_basis to be non-null.
-- - POSTAL_ADDRESS cannot be used as a substitute for geometry in operator DDS workflows.
-- - POLYGON or POINT mode requires geography or lat/lng to be non-null.
-- - All incoming polygons must pass through ST_MakeValid() before insert.
-- - If correction causes >5% area variance, reject back to client.

plot_geometry_versions
id                    UUID PK NOT NULL
plot_id               UUID FK → plots.id NOT NULL
version_number        INTEGER NOT NULL
geography             GEOGRAPHY NULLABLE
latitude              NUMERIC(10,7) NULLABLE
longitude             NUMERIC(10,7) NULLABLE
area_ha               NUMERIC(10,4) NULLABLE
source_event_id       UUID NOT NULL
changed_by_person_id  UUID FK → persons.id NULLABLE
changed_at            TIMESTAMPTZ NOT NULL
supersedes_id         UUID FK → plot_geometry_versions.id NULLABLE
UNIQUE(plot_id, version_number)

-- Rule: every geometry change must create a new plot_geometry_versions record.
-- The plot.latest_geometry_version counter must be incremented atomically.

plot_season_volumes
id                  UUID PK NOT NULL
plot_id             UUID FK → plots.id NOT NULL
commodity_id        UUID FK → commodities.id NOT NULL
harvest_season      TEXT NOT NULL    -- e.g. "2024-25"
claimed_kg_total    NUMERIC(12,3) NOT NULL DEFAULT 0
contributing_orgs   UUID[] NOT NULL DEFAULT '{}'
last_updated_at     TIMESTAMPTZ NOT NULL
UNIQUE(plot_id, commodity_id, harvest_season)

-- Rule: claimed_kg_total is updated atomically whenever a batch contribution references this plot and season. Cross-cooperative totals are accumulated here before final yield-check status is set.



## 13. Data Schema — Evidence and Documents
SQL


evidence_documents
id                    UUID PK NOT NULL
owner_org_id          UUID FK → organisations.id NOT NULL
producer_id           UUID FK → producers.id NULLABLE
plot_id               UUID FK → plots.id NULLABLE
batch_id              UUID FK → batches.id NULLABLE
shipment_id           UUID FK → shipment_headers.id NULLABLE
document_type         ENUM NOT NULL (LAND_TITLE, REGISTRATION_CERT, HARVEST_RECORD, CONSENT_FORM, PHOTO, SATELLITE_REPORT, AUDIT_CERTIFICATE, IMPORT_PERMIT, OTHER)
file_storage_key      TEXT NOT NULL
file_hash_sha256      TEXT NOT NULL
file_size_bytes       BIGINT NOT NULL
mime_type             TEXT NOT NULL
source_channel        ENUM NOT NULL (WEB_UPLOAD, MOBILE_UPLOAD, EMAIL_IMPORT, API_IMPORT, BULK_IMPORT)
source_uploaded_by    UUID FK → persons.id NULLABLE
source_device_id      TEXT NULLABLE
parse_status          ENUM NOT NULL (PENDING, IN_PROGRESS, COMPLETED, FAILED, MANUAL_REQUIRED)
parse_result          JSONB NULLABLE
parse_confidence      NUMERIC(3,2) NULLABLE   -- 0.00–1.00
parse_reviewed_by     UUID FK → persons.id NULLABLE
parse_reviewed_at     TIMESTAMPTZ NULLABLE
retention_until       DATE NOT NULL
created_at            TIMESTAMPTZ NOT NULL
updated_at            TIMESTAMPTZ NOT NULL

document_provenance_events
id                    UUID PK NOT NULL
evidence_document_id  UUID FK → evidence_documents.id NOT NULL
event_type            TEXT NOT NULL
-- e.g. UPLOADED, PARSE_STARTED, PARSE_COMPLETED, REVIEWED, LINKED_TO_PLOT, LINKED_TO_BATCH, RETENTION_EXTENDED
actor_type            TEXT NOT NULL   -- PERSON, SYSTEM, API
actor_id              UUID NULLABLE
payload               JSONB NOT NULL
created_at            TIMESTAMPTZ NOT NULL


### 13.1 Document parsing pipeline
The parsing pipeline runs asynchronously for all uploaded documents:
File received → SHA-256 hash computed → stored to object storage.
evidence_documents record created with parse_status = PENDING.
Parse worker picks up record, sets parse_status = IN_PROGRESS.
OCR / structured-data extraction attempted.
parse_result JSONB populated with extracted fields per document type.
parse_confidence set between 0 and 1.
If parse_confidence < 0.60, parse_status = MANUAL_REQUIRED.
Reviewer confirms or corrects; parse_reviewed_by and parse_reviewed_at set.
Provenance event written at each state transition.
If parsing fails fatally, parse_status = FAILED and compliance_issues record created.

### 13.2 `parse_result` JSONB canonical schema
All document parse outputs must include:
- `document_type`: TEXT
- `extracted_fields`: JSONB
- `confidence_breakdown`: JSONB
- `metadata_timestamp_plausible`: BOOLEAN
- `issuer_name_match`: BOOLEAN
- `document_age_within_policy`: BOOLEAN

Required `extracted_fields` keys by `document_type`:
- `LAND_TITLE`: `issuer_name`, `title_number`, `holder_name`, `parcel_reference`, `issue_date`, `country_iso`
- `HARVEST_RECORD`: `producer_name`, `commodity`, `harvest_date`, `quantity`, `unit`, `plot_reference`
- `CONSENT_FORM`: `producer_name`, `grantee_org_name`, `consent_scope`, `granted_at`, `expires_at`, `signature_present`
- `REGISTRATION_CERT`: `entity_name`, `registration_number`, `issuing_authority`, `issue_date`, `country_iso`
- `SATELLITE_REPORT`: `provider`, `dataset_version`, `analysis_date`, `risk_label`, `geometry_reference`
- `AUDIT_CERTIFICATE`: `certifier`, `certificate_id`, `scope`, `issued_at`, `valid_until`
- `IMPORT_PERMIT`: `permit_number`, `issuing_authority`, `issued_at`, `valid_until`, `commodity_scope`

Rule:
If any anti-fraud flag (`metadata_timestamp_plausible`, `issuer_name_match`, `document_age_within_policy`) is FALSE, `parse_confidence` is capped at 0.50 and `parse_status = MANUAL_REQUIRED`.

## 14. Data Schema — Lineage: Lots, Batches, Inputs
SQL


lots
id                 UUID PK NOT NULL
organisation_id    UUID FK → organisations.id NOT NULL
commodity_id       UUID FK → commodities.id NOT NULL
lot_reference      TEXT NOT NULL
product_form       TEXT NOT NULL
origin_country_iso CHAR(2) NOT NULL
quantity_kg        NUMERIC(12,3) NOT NULL
ownership_status   TEXT NOT NULL
created_at         TIMESTAMPTZ NOT NULL
updated_at         TIMESTAMPTZ NOT NULL
deleted_at         TIMESTAMPTZ NULLABLE

batches
id                    UUID PK NOT NULL
organisation_id       UUID FK → organisations.id NOT NULL
commodity_id          UUID FK → commodities.id NOT NULL
batch_reference       TEXT NOT NULL
product_form          TEXT NOT NULL
quantity_kg           NUMERIC(12,3) NOT NULL
quantity_unit         TEXT NOT NULL DEFAULT 'kg'
harvest_season        TEXT NULLABLE
root_plot_ids         UUID[] NOT NULL DEFAULT '{}'
lineage_locked        BOOLEAN NOT NULL DEFAULT FALSE
yield_check_status    ENUM NOT NULL (PENDING, PASS, WARNING, BLOCKED, UNAVAILABLE)
yield_check_run_at    TIMESTAMPTZ NULLABLE
yield_check_ratio     NUMERIC(6,4) NULLABLE
yield_engine_version  TEXT NULLABLE
created_at            TIMESTAMPTZ NOT NULL
updated_at            TIMESTAMPTZ NOT NULL
deleted_at            TIMESTAMPTZ NULLABLE

batch_inputs
id            UUID PK NOT NULL
batch_id      UUID FK → batches.id NOT NULL
source_type   ENUM NOT NULL (PLOT_HARVEST, LOT, BATCH, EXTERNAL, PROCESSING_FACILITY)
-- PLOT_HARVEST: direct from producer plot
-- LOT: from a lot record
-- BATCH: from a prior batch (split/merge)
-- EXTERNAL: from outside Tracebud with evidence reference
-- PROCESSING_FACILITY: sourced from intermediary facility intake (Section 52.2)
source_id     UUID NOT NULL
quantity_kg   NUMERIC(12,3) NOT NULL
evidence_id   UUID FK → evidence_documents.id NULLABLE
delivery_manifest_evidence_id UUID FK → evidence_documents.id NULLABLE
created_at    TIMESTAMPTZ NOT NULL

-- Rule: sum(batch_inputs.quantity_kg) for a batch must equal batches.quantity_kg at lineage lock.
-- Rule: a batch cannot be lineage-locked with unresolved yield check status of BLOCKED.
-- Rule: when lineage_locked, a background worker recursively materializes all ultimate plot IDs into batches.root_plot_ids.
-- Rule: when source_type = PROCESSING_FACILITY, delivery_manifest_evidence_id is required and must reference evidence_documents.document_type = HARVEST_RECORD.

### 14.4 Multi-Commodity Batch Rules
- A `batches` record has a single `commodity_id` by design; blending different commodities requires separate batch records per commodity.
- Mixing the same commodity across distinct HS codes requires separate batches because each HS code maps to a distinct DDS line item.
- A single physical lot containing multiple commodities must be split into per-commodity `lots` records before batch ingestion; bulk import tooling must support this split operation.
- If per-commodity split quantities cannot be determined at intake, assign `yield_check_status = UNAVAILABLE` to all affected batches and create a `compliance_issues` record with severity WARNING.
- Shipment handling remains line-scoped: one `shipment_headers` record may contain multiple `shipment_lines` with different `commodity_id` values; coverage allocation is always per `shipment_line`.



## 15. Data Schema — Shipment Model
SQL


shipment_headers
id                         UUID PK NOT NULL
organisation_id            UUID FK → organisations.id NOT NULL
workflow_role              ENUM NOT NULL (OPERATOR, MICRO_SMALL_PRIMARY_OPERATOR, DOWNSTREAM_OPERATOR_FIRST, DOWNSTREAM_OPERATOR_SUBSEQUENT, TRADER, PENDING_MANUAL_CLASSIFICATION, OUT_OF_SCOPE)
workflow_type              TEXT NOT NULL
shipment_reference         TEXT NOT NULL
buyer_org_id               UUID FK → organisations.id NULLABLE
consignee_name             TEXT NULLABLE
destination_country_iso    CHAR(2) NULLABLE
package_status             ENUM NOT NULL (DRAFT, READY, SEALED, SUBMITTED, ACCEPTED, REJECTED, ARCHIVED, ON_HOLD)
country_risk_tier          ENUM NULLABLE (LOW, STANDARD, HIGH)
country_risk_assessed_at   TIMESTAMPTZ NULLABLE
role_decision_trace        JSONB NOT NULL
-- canonical keys:
-- {
--   "workflow_role": TEXT,
--   "decision_steps": [{"step": TEXT, "result": TEXT, "reason": TEXT NULLABLE}],
--   "input_snapshot": {"organisation_id": UUID, "commodity_id": UUID, "country_iso": TEXT, "enterprise_size": TEXT NULLABLE},
--   "regulatory_profile_version": TEXT,
--   "decided_at": TIMESTAMPTZ
-- }
blocking_issues            JSONB NOT NULL DEFAULT '[]'
-- canonical item keys:
-- {
--   "issue_type": TEXT,
--   "entity_type": TEXT,
--   "entity_id": UUID,
--   "severity": "WARNING" | "BLOCKING",
--   "resolution_path": TEXT
-- }
billing_state              ENUM NOT NULL (UNPAID, PAID, SPONSOR_COVERED, WAIVED, FAILED)
billing_event_id           UUID FK → billing_events.id NULLABLE
regulatory_profile_version TEXT NOT NULL
sealed_at                  TIMESTAMPTZ NULLABLE
created_at                 TIMESTAMPTZ NOT NULL
updated_at                 TIMESTAMPTZ NOT NULL

shipment_lines
id                              UUID PK NOT NULL
shipment_header_id              UUID FK → shipment_headers.id NOT NULL
line_number                     INTEGER NOT NULL
commodity_id                    UUID FK → commodities.id NOT NULL
hs_code                         TEXT NOT NULL
product_description             TEXT NOT NULL
quantity_kg                     NUMERIC(12,3) NOT NULL
quantity_unit                   TEXT NOT NULL DEFAULT 'kg'
origin_country_iso              CHAR(2) NOT NULL
upstream_reference_number       TEXT NULLABLE
upstream_declaration_identifier TEXT NULLABLE
created_at                      TIMESTAMPTZ NOT NULL
updated_at                      TIMESTAMPTZ NOT NULL

shipment_line_coverages
id                UUID PK NOT NULL
shipment_line_id  UUID FK → shipment_lines.id NOT NULL
source_type       ENUM NOT NULL (BATCH, LOT, SIMPLIFIED_DECLARATION, EXTERNAL)
source_id         UUID NOT NULL
quantity_kg       NUMERIC(12,3) NOT NULL
coverage_snapshot JSONB NOT NULL
-- immutable snapshot of source record state at allocation time
created_at        TIMESTAMPTZ NOT NULL

-- Invariants:
-- - One shipment header may contain many shipment lines.
-- - One shipment line may be covered by many source records.
-- - SUM(shipment_line_coverages.quantity_kg) per line must equal shipment_lines.quantity_kg before sealing.
-- - No coverage record may over-allocate source quantity.
-- - A shipment may not be sealed while any line has unresolved blocking issues or while workflow_role = PENDING_MANUAL_CLASSIFICATION.
-- - package_status transitions are:
--   DRAFT -> READY | ON_HOLD
--   READY -> SEALED | ON_HOLD | DRAFT
--   SEALED -> SUBMITTED | ON_HOLD
--   SUBMITTED -> ACCEPTED | REJECTED | ON_HOLD
--   ACCEPTED -> ARCHIVED
--   REJECTED -> DRAFT | ON_HOLD
--   ON_HOLD -> DRAFT | READY
--   ARCHIVED is terminal.



## 16. Data Schema — Compliance Records
SQL


dds_records
id                         UUID PK NOT NULL
organisation_id            UUID FK → organisations.id NOT NULL
shipment_header_id         UUID FK → shipment_headers.id NOT NULL
traces_submission_id       TEXT NULLABLE
traces_reference_number    TEXT NULLABLE
regulatory_profile_version TEXT NOT NULL
submission_mode            ENUM NOT NULL (MANUAL_ASSIST, API_DIRECT)
payload_snapshot           JSONB NOT NULL   -- immutable after ACCEPTED
submission_status          ENUM NOT NULL (DRAFT, READY_TO_SUBMIT, SUBMITTED, ACCEPTED, REJECTED, PENDING_CONFIRMATION, AMENDMENT_DRAFT, AMENDED_SUBMITTED, WITHDRAWAL_REQUESTED, WITHDRAWN, SUPERSEDED)
submitted_at               TIMESTAMPTZ NULLABLE
accepted_at                TIMESTAMPTZ NULLABLE
rejection_reason           TEXT NULLABLE
pending_confirmation       BOOLEAN NOT NULL DEFAULT FALSE
superseded_by_id           UUID FK → dds_records.id NULLABLE
created_at                 TIMESTAMPTZ NOT NULL
updated_at                 TIMESTAMPTZ NOT NULL

-- DDS submission_status transitions:
-- DRAFT -> READY_TO_SUBMIT
-- READY_TO_SUBMIT -> SUBMITTED
-- SUBMITTED -> ACCEPTED | REJECTED | PENDING_CONFIRMATION
-- ACCEPTED -> AMENDMENT_DRAFT | WITHDRAWAL_REQUESTED
-- AMENDMENT_DRAFT -> AMENDED_SUBMITTED
-- AMENDED_SUBMITTED -> ACCEPTED | REJECTED
-- WITHDRAWAL_REQUESTED -> WITHDRAWN | REJECTED
-- Any ACCEPTED record may become SUPERSEDED only by explicit superseded_by_id.

-- Rules:
-- - payload_snapshot is immutable after status reaches ACCEPTED.
-- - Amendment and withdrawal windows are config-driven per regulatory profile.
-- - Amended submissions must preserve prior accepted version linkage.

simplified_declarations
id                          UUID PK NOT NULL
producer_id                 UUID FK → producers.id NOT NULL
organisation_id             UUID FK → organisations.id NOT NULL
commodity_id                UUID FK → commodities.id NOT NULL
country_iso                 CHAR(2) NOT NULL
postal_address              TEXT NULLABLE
geolocation_payload         JSONB NULLABLE
-- canonical keys when geolocation_mode != POSTAL_ADDRESS:
-- {
--   "type": "polygon" | "point",
--   "coordinates": ARRAY,
--   "area_ha": NUMERIC,
--   "crs": "EPSG:4326",
--   "capture_method": TEXT,
--   "captured_at": TIMESTAMPTZ
-- }
-- postal-address rule:
-- - when geolocation_mode = POSTAL_ADDRESS, geolocation_payload must be NULL and postal_address must be non-null.
-- - when geolocation_mode != POSTAL_ADDRESS, geolocation_payload must be non-null and postal_address may be null.
declaration_identifier      TEXT NULLABLE
regulatory_profile_version  TEXT NOT NULL
status                      ENUM NOT NULL (DRAFT, READY_TO_SUBMIT, SUBMITTED, ACCEPTED, EXPIRED, SUPERSEDED, REJECTED)
payload_snapshot            JSONB NOT NULL
eligibility_snapshot        JSONB NOT NULL
-- records enterprise_size, country_risk_tier, goods_self_produced flag, workflow_scope, evidence references, assessed_at
submitted_at                TIMESTAMPTZ NULLABLE
accepted_at                 TIMESTAMPTZ NULLABLE
valid_until                 DATE NULLABLE
created_at                  TIMESTAMPTZ NOT NULL
updated_at                  TIMESTAMPTZ NOT NULL

downstream_reference_records
id                         UUID PK NOT NULL
organisation_id            UUID FK → organisations.id NOT NULL
shipment_header_id         UUID FK → shipment_headers.id NOT NULL
record_type                TEXT NOT NULL  -- DOWNSTREAM_FIRST, DOWNSTREAM_SUBSEQUENT
reference_numbers          TEXT[] NOT NULL DEFAULT '{}'
declaration_identifiers    TEXT[] NOT NULL DEFAULT '{}'
supplier_customer_snapshot JSONB NOT NULL
retention_until            DATE NOT NULL
created_at                 TIMESTAMPTZ NOT NULL
updated_at                 TIMESTAMPTZ NOT NULL

trader_retention_records
id                         UUID PK NOT NULL
organisation_id            UUID FK → organisations.id NOT NULL
shipment_header_id         UUID FK → shipment_headers.id NOT NULL
supplier_customer_snapshot JSONB NOT NULL
retention_until            DATE NOT NULL
created_at                 TIMESTAMPTZ NOT NULL
updated_at                 TIMESTAMPTZ NOT NULL



## 17. Data Schema — Governance, Audit, and Support
SQL


requests
id                    UUID PK NOT NULL
requester_org_id      UUID FK → organisations.id NOT NULL
target_org_id         UUID FK → organisations.id NOT NULL
requester_person_id   UUID FK → persons.id NOT NULL
request_type          ENUM NOT NULL (MISSING_PRODUCER_PROFILE, MISSING_PLOT_GEOMETRY, MISSING_LAND_TITLE, MISSING_HARVEST_RECORD, YIELD_EVIDENCE, CONSENT_GRANT, DDS_REFERENCE, GENERAL_EVIDENCE, OTHER)
target_entity_type    TEXT NULLABLE
target_entity_id      UUID NULLABLE
description           TEXT NOT NULL
due_date              DATE NULLABLE
status                ENUM NOT NULL (OPEN, IN_PROGRESS, FULFILLED, EXPIRED, CANCELLED)
fulfilled_by_id       UUID FK → persons.id NULLABLE
fulfilled_at          TIMESTAMPTZ NULLABLE
created_at            TIMESTAMPTZ NOT NULL
updated_at            TIMESTAMPTZ NOT NULL

-- Request lifecycle transitions (normative):
-- - OPEN -> IN_PROGRESS | FULFILLED | CANCELLED | EXPIRED
-- - IN_PROGRESS -> FULFILLED | CANCELLED | EXPIRED
-- - FULFILLED, CANCELLED, EXPIRED are terminal states.
-- - Duplicate suppression for campaigns applies only to OPEN and IN_PROGRESS requests.
-- - Hourly expiry job sets EXPIRED where due_date < CURRENT_DATE and status in (OPEN, IN_PROGRESS).

request_reminders
id            UUID PK NOT NULL
request_id    UUID FK → requests.id NOT NULL
send_at       TIMESTAMPTZ NOT NULL
sent_at       TIMESTAMPTZ NULLABLE
channel       ENUM NOT NULL (IN_APP, EMAIL, WEBHOOK)
created_at    TIMESTAMPTZ NOT NULL

request_campaigns
id                    UUID PK NOT NULL
requester_org_id      UUID FK → organisations.id NOT NULL
requester_person_id   UUID FK → persons.id NOT NULL
campaign_name         TEXT NOT NULL
request_type          ENUM NOT NULL (MISSING_PRODUCER_PROFILE, MISSING_PLOT_GEOMETRY, MISSING_LAND_TITLE, MISSING_HARVEST_RECORD, YIELD_EVIDENCE, CONSENT_GRANT, DDS_REFERENCE, GENERAL_EVIDENCE, OTHER)
description_template  TEXT NOT NULL
due_date              DATE NULLABLE
channel_policy        JSONB NOT NULL
-- canonical keys:
-- {
--   "in_app": BOOLEAN,
--   "email": BOOLEAN,
--   "webhook": BOOLEAN
-- }
status                ENUM NOT NULL (DRAFT, QUEUED, RUNNING, COMPLETED, PARTIAL, CANCELLED)
total_targets         INTEGER NOT NULL DEFAULT 0
created_requests      INTEGER NOT NULL DEFAULT 0
failed_targets        INTEGER NOT NULL DEFAULT 0
created_at            TIMESTAMPTZ NOT NULL
updated_at            TIMESTAMPTZ NOT NULL

request_campaign_targets
id                    UUID PK NOT NULL
campaign_id           UUID FK → request_campaigns.id NOT NULL
target_org_id         UUID FK → organisations.id NOT NULL
target_entity_type    TEXT NULLABLE
target_entity_id      UUID NULLABLE
target_person_id      UUID FK → persons.id NULLABLE
request_id            UUID FK → requests.id NULLABLE
status                ENUM NOT NULL (PENDING, REQUEST_CREATED, SKIPPED_DUPLICATE, FAILED_VALIDATION, FAILED_DELIVERY)
failure_reason        TEXT NULLABLE
created_at            TIMESTAMPTZ NOT NULL
updated_at            TIMESTAMPTZ NOT NULL

-- Rules for mass-demand campaigns:
-- - A campaign expands into one `requests` row per target and stores linkage in request_campaign_targets.request_id.
-- - Duplicate suppression: do not create a new request when an OPEN/IN_PROGRESS request with same
--   requester_org_id + target_org_id + request_type + target_entity_id already exists.
-- - Campaign execution is asynchronous and resumable.
-- - Every state transition writes `audit_events` with event_type in:
--   REQUEST_CAMPAIGN_CREATED, REQUEST_CAMPAIGN_STARTED, REQUEST_CAMPAIGN_COMPLETED, REQUEST_CAMPAIGN_PARTIAL.

compliance_issues
id               UUID PK NOT NULL
organisation_id  UUID FK → organisations.id NOT NULL
entity_type      TEXT NOT NULL
entity_id        UUID NOT NULL
issue_type       TEXT NOT NULL
severity         ENUM NOT NULL (INFO, WARNING, BLOCKING)
description      TEXT NOT NULL
status           ENUM NOT NULL (OPEN, IN_PROGRESS, RESOLVED, ESCALATED) DEFAULT OPEN
owner_person_id  UUID FK → persons.id NULLABLE
resolution_path  TEXT NULLABLE
resolved_at      TIMESTAMPTZ NULLABLE
resolution_note  TEXT NULLABLE
created_at       TIMESTAMPTZ NOT NULL
updated_at       TIMESTAMPTZ NOT NULL

-- Compliance issue lifecycle rules (normative):
-- - OPEN -> IN_PROGRESS | RESOLVED | ESCALATED
-- - IN_PROGRESS -> RESOLVED | ESCALATED
-- - ESCALATED -> IN_PROGRESS | RESOLVED
-- - RESOLVED is terminal.
-- - BLOCKING issues must have owner_person_id and resolution_path before shipment sealing.
-- - status = RESOLVED requires resolved_at and resolution_note non-null.

dedup_review_tasks
id                      UUID PK NOT NULL
entity_type             ENUM NOT NULL (PRODUCER, PLOT)
entity_a_id             UUID NOT NULL
entity_b_id             UUID NOT NULL
composite_score         NUMERIC(4,3) NOT NULL
tier                    ENUM NOT NULL (SUSPECTED_DUPLICATE_HIGH, SUSPECTED_DUPLICATE_MEDIUM)
status                  ENUM NOT NULL (OPEN, MERGED, DISTINCT, ESCALATED)
reviewed_by_person_id   UUID FK → persons.id NULLABLE
reviewed_at             TIMESTAMPTZ NULLABLE
resolution_note         TEXT NULLABLE
created_at              TIMESTAMPTZ NOT NULL
updated_at              TIMESTAMPTZ NOT NULL

yield_appeal_tasks
id                   UUID PK NOT NULL
batch_id             UUID FK → batches.id NOT NULL
organisation_id      UUID FK → organisations.id NOT NULL
farmer_justification TEXT NOT NULL
evidence_ids         UUID[] NOT NULL DEFAULT '{}'
status               ENUM NOT NULL (PENDING, APPROVED, REJECTED)
reviewed_by_id       UUID FK → persons.id NULLABLE
reviewed_at          TIMESTAMPTZ NULLABLE
created_at           TIMESTAMPTZ NOT NULL

-- Rule: any batch BLOCKED by the yield engine triggers an immediate yield_appeal_tasks record.

yield_exception_requests
id                  UUID PK NOT NULL
batch_id            UUID FK → batches.id NOT NULL
organisation_id     UUID FK → organisations.id NOT NULL
exception_type      ENUM NOT NULL (DISASTER_YEAR, EXCEPTIONAL_SEASON, OTHER)
description         TEXT NOT NULL
requested_factor    NUMERIC(4,3) NOT NULL
evidence_ids        UUID[] NOT NULL DEFAULT '{}'
appeal_task_id      UUID FK → yield_appeal_tasks.id NULLABLE
status              ENUM NOT NULL (PENDING, APPROVED, REJECTED, EXPIRED)
approved_factor     NUMERIC(4,3) NULLABLE
reviewed_by_id      UUID FK → persons.id NULLABLE
reviewed_at         TIMESTAMPTZ NULLABLE
created_at          TIMESTAMPTZ NOT NULL
updated_at          TIMESTAMPTZ NOT NULL

-- Reconciliation rule:
-- - yield_appeal_tasks tracks human-review workflow ownership and disposition.
-- - yield_exception_requests tracks auditable exception-factor decisions used by the yield algorithm.
-- - when a yield_exception_requests record originates from a blocked batch workflow,
--   appeal_task_id must reference the corresponding yield_appeal_tasks record.

substantiated_concerns
id                  UUID PK NOT NULL
organisation_id     UUID FK → organisations.id NOT NULL
reported_by_id      UUID FK → persons.id NULLABLE
concern_type        TEXT NOT NULL
description         TEXT NOT NULL
entity_type         TEXT NULLABLE
entity_id           UUID NULLABLE
status              ENUM NOT NULL (RECEIVED, UNDER_REVIEW, ACTION_TAKEN, CLOSED_NO_ACTION, ESCALATED_TO_AUTHORITY)
outcome_note        TEXT NULLABLE
created_at          TIMESTAMPTZ NOT NULL
updated_at          TIMESTAMPTZ NOT NULL

annual_reporting_snapshots
id                    UUID PK NOT NULL
organisation_id       UUID FK → organisations.id NOT NULL
reporting_year        SMALLINT NOT NULL
regulatory_profile_version TEXT NOT NULL
snapshot_data         JSONB NOT NULL
-- volume_kg, commodity_breakdown, country_breakdown, dds_submitted_count, dds_accepted_count, risk_tier_distribution, substantiated_concerns_count
status                ENUM NOT NULL (DRAFT, FINALISED, SUBMITTED)
finalised_at          TIMESTAMPTZ NULLABLE
created_at            TIMESTAMPTZ NOT NULL
updated_at            TIMESTAMPTZ NOT NULL

portability_requests
id                    UUID PK NOT NULL
organisation_id       UUID FK → organisations.id NOT NULL
producer_id           UUID FK → producers.id NOT NULL
request_type          ENUM NOT NULL (FULL, IDENTITY_ONLY, PLOT_ONLY)
status                ENUM NOT NULL (PENDING_REVIEW, APPROVED, REJECTED, EXPORTED, EXPIRED)
triggered_by          UUID FK → persons.id NOT NULL
reviewed_by           UUID FK → persons.id NULLABLE
reviewed_at           TIMESTAMPTZ NULLABLE
export_url            TEXT NULLABLE
expires_at            TIMESTAMPTZ NULLABLE
created_at            TIMESTAMPTZ NOT NULL
updated_at            TIMESTAMPTZ NOT NULL

-- Rule:
-- - IDENTITY_ONLY and PLOT_ONLY may auto-approve by policy.
-- - FULL requests are review-gated unless cooperative governance pre-approves.
-- - Exports must be time-bound and auditable.

billing_events
id                   UUID PK NOT NULL
organisation_id      UUID FK → organisations.id NOT NULL
event_type           ENUM NOT NULL (SHIPMENT_FEE_T2, SHIPMENT_FEE_T3, MONTHLY_BASE_T2, MONTHLY_BASE_T3, SPONSOR_SEAT)
amount_eur           NUMERIC(10,2) NOT NULL
currency             CHAR(3) NOT NULL DEFAULT 'EUR'
payment_method       ENUM NOT NULL (CARD, CREDIT, SPONSOR_COVERED, WAIVED)
stripe_payment_id    TEXT NULLABLE
sponsor_org_id       UUID FK → organisations.id NULLABLE
reference_id         UUID NULLABLE     -- shipment_header.id or period ref
status               ENUM NOT NULL (PENDING, COMPLETED, FAILED, REFUNDED)
created_at           TIMESTAMPTZ NOT NULL
updated_at           TIMESTAMPTZ NOT NULL

sync_conflicts
id                       UUID PK NOT NULL
entity_type              TEXT NOT NULL
entity_id                UUID NOT NULL
client_version_snapshot  JSONB NOT NULL
server_version_snapshot  JSONB NOT NULL
strategy_applied         TEXT NOT NULL
resolution_status        ENUM NOT NULL (PENDING, AUTO_RESOLVED, REVIEWER_REQUIRED, RESOLVED)
reviewer_id              UUID FK → persons.id NULLABLE
resolved_at              TIMESTAMPTZ NULLABLE
created_at               TIMESTAMPTZ NOT NULL

traces_api_logs
id                   UUID PK NOT NULL
organisation_id      UUID FK → organisations.id NOT NULL
dds_record_id        UUID FK → dds_records.id NULLABLE
http_method          TEXT NOT NULL
endpoint             TEXT NOT NULL
request_payload_hash TEXT NOT NULL
response_status      INTEGER NOT NULL
response_body_hash   TEXT NULLABLE
duration_ms          INTEGER NOT NULL
error_class          TEXT NULLABLE
created_at           TIMESTAMPTZ NOT NULL

audit_events
id              UUID PK NOT NULL
organisation_id UUID NOT NULL
actor_type      ENUM NOT NULL (PERSON, SYSTEM, API, SPONSOR_ADMIN)
actor_id        UUID NULLABLE
event_type      TEXT NOT NULL
entity_type     TEXT NOT NULL
entity_id       UUID NOT NULL
diff_snapshot   JSONB NULLABLE
ip_address      TEXT NULLABLE
user_agent      TEXT NULLABLE
created_at      TIMESTAMPTZ NOT NULL

-- Partitioning strategy:
-- - PostgreSQL declarative partitioning by month on created_at.
-- - Parent table: audit_events.
-- - Child table pattern: audit_events_YYYY_MM.
-- - Retention tiers:
--   hot (0-6 months) primary storage,
--   warm (6-24 months) compressed/replica-preferred,
--   cold (24+ months) archive export tier.
-- - Purge/delete is allowed only after legal retention checks per record class.
-- - Monthly maintenance job creates next partition, detaches/archive-eligible partitions, and verifies index parity.

access_logs
id              UUID PK NOT NULL
person_id       UUID FK → persons.id NULLABLE
organisation_id UUID NULLABLE
action          TEXT NOT NULL
resource_type   TEXT NOT NULL
resource_id     UUID NULLABLE
result          ENUM NOT NULL (ALLOWED, DENIED)
reason          TEXT NULLABLE
ip_address      TEXT NULLABLE
created_at      TIMESTAMPTZ NOT NULL



## 18. Offline Sync Technical Design (HLCs)
### 18.1 Overview
Tier 1 and Tier 2 mobile applications operate in optimistic local-first mode.
Client absolute timestamps are not trusted for conflict resolution.
### 18.2 Sync queue (local SQLite)
SQL


sync_queue
id              INTEGER PK AUTOINCREMENT
operation       TEXT NOT NULL     -- CREATE, UPDATE, DELETE
entity_type     TEXT NOT NULL
entity_id       UUID NOT NULL
payload         TEXT NOT NULL     -- JSON
hlc_timestamp   TEXT NOT NULL     -- Hybrid Logical Clock timestamp
client_event_id UUID NOT NULL     -- idempotency key
created_at      TEXT NOT NULL
retry_count     INTEGER NOT NULL DEFAULT 0
last_error      TEXT NULLABLE


Rules:
client_event_id is mandatory. Retries without idempotency key are invalid.
Server rejects any operation without a valid client_event_id.
Operations are processed in FIFO order per entity_id.
Rule 1: Server maintains its own HLC; client HLC values are used for ordering only.
Rule 2: If client HLC is invalid or corrupted, server ingestion time is used for LWW fallback.
### 18.3 Conflict resolution
Entity
Strategy
Consequence
Producer identity fields
Server wins; client version preserved in sync_conflicts
No silent overwrite of authority source
Plot geometry
Versioned compare; auto-accept only if polygon overlap >95%; else REVIEWER_REQUIRED
Geometry auditability preserved
Plot declared area
If delta >20%, human review required
Affected yield checks blocked
Consent grant
Server wins
Legal source preserved
Batch / shipment quantity
Block; never auto-merge
Compliance-critical
Evidence metadata
Append-only merge
Provenance retained

### 18.4 Sync conflict logging
Every conflict must write a sync_conflicts record containing entity type, entity ID, client snapshot, server snapshot, strategy applied, and resolution status.
## 19. Deforestation Risk Engine
Tracebud risk outputs are screening artifacts and evidence inputs, not legal determinations. The default risk engine profile should be explicit, versioned, and reproducible so the same inputs always generate the same screening history.[4][5]
### 19.1 Dataset registry
SQL

risk_datasets
id                    UUID PK NOT NULL
provider              TEXT NOT NULL
dataset_name          TEXT NOT NULL
version_string        TEXT NOT NULL
spatial_resolution_m  INTEGER NOT NULL
update_cadence        TEXT NOT NULL
freshness_sla_days    INTEGER NOT NULL
licence_note          TEXT NULLABLE
enabled_geographies   TEXT[] NOT NULL DEFAULT '{}'
enabled_commodities   TEXT[] NOT NULL DEFAULT '{}'
active                BOOLEAN NOT NULL DEFAULT TRUE
created_at            TIMESTAMPTZ NOT NULL
updated_at            TIMESTAMPTZ NOT NULL
UNIQUE(provider, dataset_name, version_string)

risk_engine_profiles additions
risk_tier_low_max       NUMERIC(5,4) NOT NULL DEFAULT 0.10
risk_tier_standard_max  NUMERIC(5,4) NOT NULL DEFAULT 0.50

Each screening run must store the exact dataset versions used.[5][4]
### 19.2 Screening pipeline
Launch seed datasets for `eudr_v1_2026`:

| Provider | Dataset | Enabled geographies | Enabled commodities | Update cadence | Freshness SLA |
|---|---|---|---|---|---|
| JRC | Global Forest Cover Change | GLOBAL | COFFEE, COCOA, RUBBER, PALM_OIL, SOY, WOOD, CATTLE | annual | 540 days |
| INPE | PRODES (Brazil) | BR | COFFEE, COCOA, CATTLE, SOY, WOOD, RUBBER, PALM_OIL | annual | 540 days |
| WRI | Global Forest Watch Tree Cover Loss | GLOBAL | COFFEE, COCOA, RUBBER, PALM_OIL, SOY, WOOD, CATTLE | monthly | 90 days |
| JRC | Tropical Moist Forests (TMF) | tropical belt countries | COFFEE, COCOA, RUBBER, PALM_OIL, WOOD | annual | 540 days |

If any active dataset exceeds freshness SLA, Tracebud must write a `compliance_issues` record with severity WARNING and include dataset identifier and age.

For each plot or eligible point workflow:
Normalize geometry to EPSG:4326.
Validate geometry topology and area.
For POINT mode, apply the configured point-buffer distance from the active risk-engine profile.
Intersect against configured datasets applicable to the active profile.
Generate an immutable screening output containing dataset versions used, query timestamp, geometry version used, point-buffer distance applied, intersection metrics, risk tier, and explainability notes.
Persist the screening output as immutable history.
### 19.3 Risk tiers
Risk-tier thresholds are configuration-driven per regulatory profile.
Rule:
- LOW if score <= `risk_tier_low_max`
- HIGH if score > `risk_tier_standard_max`
- STANDARD otherwise

Default policy for `eudr_v1_2026`:
The profile assigns LOW when the intersection-weighted deforestation probability score is <= 0.10; STANDARD when score is > 0.10 and <= 0.50; HIGH when score > 0.50.
These values are stored in `risk_engine_profiles` and tagged as source `TRACEBUD_PRODUCT_POLICY`. They are not legal thresholds. Operators may request stricter profiles through sponsor-admin override.

### 19.4 Intersection scoring algorithm
Definitions:
- A dataset "hit" occurs when valid plot geometry intersects a positive-risk cell/object above overlap threshold.
- Minimum overlap threshold default: max(0.5 ha, 5% of plot area), configurable by profile.

Per-dataset computation:
1. Intersect plot geometry with dataset layer.
2. Compute `overlap_area_ha`.
3. Compute `overlap_ratio = overlap_area_ha / plot_area_ha`.
4. Compute `dataset_score = overlap_ratio * dataset_weight`.

Multi-dataset reconciliation:
- Composite risk score = weighted sum of dataset_scores normalized to [0,1].
- If datasets disagree, higher-resolution dataset has precedence; ties resolve by stricter (higher-risk) outcome.
- Screening output stores all dataset contributions, weights, overlap metrics, and reconciliation rationale.

Normative rule:
Risk scoring must be deterministic for identical geometry, profile version, and dataset versions.

## 20. Yield-Cap Anti-Laundering Algorithm
The yield engine is a configurable plausibility engine, not a hard-coded universal rule set. It must be explainable, versioned, and able to justify every flag it produces.[6][7]
### 20.1 Purpose
The engine detects claims that exceed plausible production for a plot, commodity, and harvest context, including cross-cooperative over-claim scenarios.
### 20.2 Benchmark source selection
The system selects the most specific approved benchmark in this order:
approved sponsor override benchmark
national agricultural statistics
USDA FAS or equivalent approved public source
FAOSTAT
Tracebud internal aggregate fallback
### 20.3 Algorithm
Plaintext


FUNCTION check_yield(batch_id, engine_profile_version):

contributions = all batch contributions for batch_id

FOR each contribution:
resolve benchmark by commodity, geography, harvest date, and profile
IF no benchmark:
status = UNAVAILABLE
emit issue
continue

effective_area_ha =
IF intercropped AND cropping_share known:
area_ha * cropping_share
ELSE IF intercropped AND cropping_share unknown:
area_ha * benchmark.default_intercrop_density_factor
emit estimated flag
ELSE:
area_ha

expected_max_kg =
benchmark.yield_upper_kg_ha
* effective_area_ha
* seasonality_factor
* juvenile_factor
* disaster_adjustment_factor

ratio = claimed_kg / expected_max_kg

assign status according to engine profile bands
store explainability payload
update cross-cooperative plot season totals

assign batch status = max severity across contributions


### 20.4 Status bands
Bands are stored in versioned yield_engine_profiles.
Default profile:
PASS: ratio <= 1.10
WARNING: 1.10 < ratio <= 1.30
BLOCKED: ratio > 1.30
### 20.5 Juvenile factor
Juvenile yield handling must be commodity-profile driven and versioned. Do not hard-code a global juvenile curve unless a profile explicitly declares it.
### 20.6 Edge cases
Edge case
Handling
Disaster year
yield_appeal_tasks with evidence; approved factor applied only via auditable override
Plot area unknown
UNAVAILABLE; affected workflow blocked
Multiple cooperatives sharing a plot
claims accumulated in plot_season_volumes before final status
Low-confidence benchmark
force minimum WARNING unless stricter policy profile applies
Data lag year
seasonality factor defaults per profile and emits lag flag

### 20.7 Explainability payload
Every yield run must store benchmark selected, alternate benchmarks considered, confidence score, all multipliers applied, final ratio, engine profile version, warning flags, and linked exception request IDs.[6]
If a farmer is blocked, the system must create a `yield_appeal_tasks` record for human review.

## 21. DDS Preparation and TRACES NT Integration
Tracebud should not pretend all downstream actors originate DDS filings. Only the first placer on the EU market or exporter should own the DDS origin obligation, while downstream actors mainly retain and pass reference data.[2][8][6]
### 21.0 Protocol and security architecture
TRACES NT integration is locked to SOAP/WSDL v1 at namespace `http://ec.europa.eu/tracesnt/certificate/eudr/submission/v1`.
Required operations: `submitDds`, `amendDds`, `retractDds`.
Credentials are WS-Security UsernameToken + hashed password over HTTPS + `WebServiceClientId` header.
`WebServiceClientId` is a business-system registration and must be encrypted and stored separately from operator credential material.
`traces_api_logs` must persist SOAP request/response envelope hashes and named SOAP fault classes.
### 21.1 Submission modes
Mode
Description
MANUAL_ASSIST
Tracebud prepares a structured outbound package and the operator submits through the EU interface
API_DIRECT
Tracebud submits on behalf of the operator using delegated credentials stored in a dedicated credential vault

### 21.2 Identifier model
Outbound operator identification must support one or more of:
EORI
VAT number
national registration number
TIN or equivalent
Identifier validation depends on workflow, jurisdiction, and target submission path. EORI should be supported, but not treated as globally mandatory.[8][6]
### 21.3 Field mapping
All outbound field mappings must map only from validated source fields present in schema. Because the outbound system accepts multiple identity forms, the mapping layer must choose the best available legal identifier per workflow rather than assuming EORI everywhere.
### 21.4 Error handling
Error class
Tracebud response
Validation 4xx
map field-level remediation tasks to source fields
Authentication failure
require re-provisioning; no automatic retry
429 rate limit
exponential backoff with capped retries
5xx / timeout
retry; then set pending_confirmation where ambiguity remains
ambiguous post-submit state
poll and require operator confirmation if unresolved
BusinessRulesValidationException (SOAP fault)
map rule-level remediation tasks to source facts and block resubmission until corrected
DdsPermissionDeniedException (SOAP fault)
require credential and role re-validation; no automatic retry

### 21.5 Submission state machine
Allowed transitions:
DRAFT -> READY_TO_SUBMIT
READY_TO_SUBMIT -> SUBMITTED
SUBMITTED -> ACCEPTED | REJECTED | PENDING_CONFIRMATION
ACCEPTED -> AMENDMENT_DRAFT | WITHDRAWAL_REQUESTED
AMENDMENT_DRAFT -> AMENDED_SUBMITTED
AMENDED_SUBMITTED -> ACCEPTED | REJECTED
WITHDRAWAL_REQUESTED -> WITHDRAWN | REJECTED
any accepted record may become SUPERSEDED only by explicit successor link
Rules:
time-bound amendment / withdrawal windows must be config-driven
accepted payload snapshots are immutable
amended submissions must preserve prior accepted version linkage
### 21.6 TRACES NT field mapping table
| TRACES NT XSD field | Tracebud source | Transformation rule | Validation and null/invalid handling |
|---|---|---|---|
| `operator.identification.eori` | `organisations.eori` | trim, uppercase | If required by workflow and null: block submission, create remediation task |
| `operator.identification.vatNumber` | `organisations.vat_number` | country prefix normalization | If invalid format: reject as validation error, no submit |
| `operator.identification.nationalRegistration` | `organisations.national_registration_number` | none | If all legal identifiers absent: block READY_TO_SUBMIT |
| `operator.identification.tin` | `organisations.tax_identifier` | none | Optional fallback when EORI/VAT unavailable |
| `operator.address.countryIso` | `organisations.country_iso` | ISO-3166 enforcement | Null or non-ISO value blocks submission |
| `consignment.items[].hsCode` | `shipment_lines.hs_code` | strip separators | Must match Annex-I scope; invalid blocks submission |
| `consignment.items[].cnCode` | `shipment_lines.cn_code` or `annex_i_products.cn_code` | derive from product if absent | Null allowed only if HS path legal; else warning + block by profile |
| `consignment.items[].originCountry` | `shipment_lines.origin_country_iso` | ISO-3166 enforcement | Invalid value blocks submission |
| `plot.geolocation.polygon` | `plot_geometry_version.geography` where kind=POLYGON | export WGS84 coordinates | Invalid geometry blocks submission; requires corrected version |
| `plot.geolocation.point` | `plot_geometry_version.geography` where kind=POINT | serialize lat/lon decimals | If point mode not legally eligible, block submission |
| `deforestation.status` | `plot_risk_screenings.risk_tier` + profile rule | map LOW/STANDARD/HIGH to XSD enum | Missing screening for required workflow blocks submission |
| `deforestation.datasetVersion` | `risk_datasets.version_string` (per run snapshot) | concatenate provider:name:version list | Any missing dataset provenance blocks submission |
| `consignment.items[].quantity` | `shipment_lines.quantity_kg` | unit conversion to XSD unit if required | Non-positive quantity blocks submission |
| `consignment.items[].unit` | `shipment_lines.quantity_unit` | normalize to accepted unit enum | Unknown unit blocks submission |
| `declaration.reference.previousDdsRef` | `dds_records.supersedes_dds_record_id` -> prior `dds_records.traces_reference_number` | lookup prior accepted reference | Required for amend/retract; missing link blocks call |
| `declaration.type` | `dds_records.declaration_type` / simplified workflow classifier | FULL_DDS vs SIMPLIFIED_REFERENCE_PASS_THROUGH mapping | Invalid declaration type blocks submission |

### 21.7 TRACES response contract
Response fields that Tracebud must persist:
- `submitDds` success: TRACES reference number, acceptance timestamp, status code.
- `amendDds` success: all submit fields plus prior reference linkage and successor linkage confirmation.
- `retractDds` success: reference number, retraction status, effective timestamp.

On any SOAP fault, Tracebud must persist the named fault class and correlate it to the request envelope hash in `traces_api_logs`.

### 21.8 Payload chunking strategy (enterprise rule)
At READY_TO_SUBMIT, Tracebud estimates XML payload size and total vertex count.
If TRACES NT constraints are exceeded (about 25MB or vertex limits), Tracebud splits one internal shipment into multiple TRACES NT submissions.
`shipment_headers` remains the internal parent and `dds_records` stores all returned TRACES reference numbers.

## 22. Simplified Declaration Flow
Role engine classifies workflow as MICRO_SMALL_PRIMARY_OPERATOR.
System validates legal eligibility snapshot.
System collects only permitted simplified-path data.
In manual-assist mode, user submits via EU interface and returns declaration identifier.
In API-direct mode, Tracebud submits and stores returned identifier.
Declaration ID becomes available to downstream workflows as an immutable reference artifact.
The amended regime requires this as a one-time simplified declaration pathway for eligible micro and small primary operators, with postal address allowed only where the simplified pathway specifically permits it.[9][10][2]

## 23. Downstream Retention and Trader Workflows
Tracebud should model downstream and trader responsibilities as retention and reference-pass-through workflows, not as fresh due-diligence origination flows. That distinction is important because the amended EUDR reduces the burden downstream and limits the full reference-number handling obligation to the first downstream actor.[2][8][6]
### 23.1 Downstream workflow
First downstream operators must collect and retain upstream reference numbers and declaration identifiers. Subsequent downstream operators should inherit already-covered traceability history, but the product should not force them through a fake DDS origination flow just to satisfy schema symmetry.[8][2]
### 23.2 Trader workflow
Traders should retain supplier/customer records and chain references where required, but they should not be modeled as DDS originators unless the workflow also makes them the first placer on the market.[6][8]

## 24. Evidence Parsing Pipeline
Parsing should be asynchronous, append-only, and reversible by supersession rather than overwrite. This is especially important for land title, consent, harvest records, and corporate registration evidence because those documents often arrive in low-confidence or partial formats.[7]
### 24.1 Parse lifecycle
Upload arrives.
File hash is computed.
Record is stored with parse_status = PENDING.
Worker changes status to IN_PROGRESS.
OCR / extraction runs.
parse_result is stored.
parse_confidence is computed.
If confidence is below threshold, set MANUAL_REQUIRED.
Reviewer confirms, corrects, or rejects.
Provenance event is appended at each step.
### 24.2 Required provenance fields
Every provenance event should store actor type, actor ID where available, payload, timestamp, and source channel. Without this, you cannot defend auditability for uploads or changes.[7]

## 25. Duplicate Detection
Duplicate detection must be operationalized, not just scored.
### 25.1 Producer duplicate scoring
Signals:
national ID hash
full name fuzzy match
phone number
GPS proximity
district and country match
Thresholds:
>= 0.85 → SUSPECTED_DUPLICATE_HIGH
0.60 to < 0.85 → SUSPECTED_DUPLICATE_MEDIUM
< 0.60 → distinct
### 25.2 Plot duplicate scoring
Signals:
polygon overlap ratio
centroid distance
same producer
same commodity
similar area band
similar capture provenance
Thresholds:
overlap >= 0.98 → probable duplicate pending review
0.90 to < 0.98 → review required
< 0.90 → distinct unless same import/source event strongly indicates duplication
### 25.3 Review mechanics
High-probability duplicates cannot both contribute to the same batch until resolved. Merge must create canonical linkage and never destructively overwrite the original records.

## 26. Billing and Metering Model
Billing must be compatible with compliance-critical access. Failed payment may block future sealing, but it cannot erase historical auditability or producer records.[11]
### 26.1 Billable events
Event
Trigger
Amount
Who pays
SHIPMENT_FEE_T2
Tier 2 seals a shipment header in a billable workflow
€0.50
Tier 2 org or sponsor
SHIPMENT_FEE_T3
Tier 3 initiates DDS/downstream workflow
€0.50
Tier 3 org or sponsor
MONTHLY_BASE_T2
Tier 2 active paid cycle
plan rate
Tier 2 org
MONTHLY_BASE_T3
Tier 3 active paid cycle
plan rate
Tier 3 org
SPONSOR_SEAT
active sponsored org
custom
Tier 4 org

### 26.2 Billing invariants
Failed payment blocks future sealing, not historical audit access.
Billing never silently reopens a sealed or submitted compliance object.
Sponsor coverage must be explicitly attached to network relationship policy.
Credits are consumed before card charges where enabled.

### 26.3 Stripe integration specification
Stripe mapping:
- One Stripe Product per commercial tier subscription family.
- One Stripe Price per band/interval/currency.
- Stripe product/price IDs are configured per environment and referenced in billing policy config.

Subscription lifecycle:
`INCOMPLETE -> ACTIVE -> PAST_DUE -> CANCELED` with webhook-driven reconciliation.

Required webhook handlers:
- `invoice.payment_failed`
- `customer.subscription.deleted`
- `invoice.paid`

Rules:
- Webhook processing must be idempotent by Stripe event ID with replay-protection window >= 7 days.
- `billing_events` creation and domain-side effect must be atomic through outbox or transactional boundary.
- Retry policy before suspension: minimum 3 attempts over configurable dunning window.

MVP billing constraints (Section 51 alignment):
- MVP enables only Tier 2 billables: `SHIPMENT_FEE_T2` and `MONTHLY_BASE_T2`.
- Tier 3 subscription lifecycle, `SPONSOR_SEAT`, and advanced dunning automation are Release 2+.
- During MVP, Stripe webhook handling is limited to `invoice.paid` and `invoice.payment_failed`; other webhook families may be accepted but must be treated as no-op with audit logging.

## 27. Notifications and Communication
Compliance-blocking events should notify both in-app and by email, and optionally by webhook where configured. This includes missing evidence, shipment blocked, payment failed, submission rejected, and credential expiring.[11]

### 27.1 Channel and configuration model
Per-organisation configuration must define enabled channels (`IN_APP`, `EMAIL`, `WEBHOOK`) per event type with fallback order.

### 27.2 Delivery logging schema
SQL

notification_delivery_log
id                 UUID PK NOT NULL
organisation_id    UUID FK → organisations.id NOT NULL
event_type         TEXT NOT NULL
channel            ENUM NOT NULL (IN_APP, EMAIL, WEBHOOK)
recipient_ref      TEXT NOT NULL
payload_hash       TEXT NOT NULL
delivery_status    ENUM NOT NULL (PENDING, SENT, FAILED, RETRYING, DROPPED)
attempt_count      INTEGER NOT NULL DEFAULT 0
next_retry_at      TIMESTAMPTZ NULLABLE
last_error         TEXT NULLABLE
created_at         TIMESTAMPTZ NOT NULL
updated_at         TIMESTAMPTZ NOT NULL

### 27.3 Webhook payload schemas
All payloads include:
- `event_id`, `event_type`, `occurred_at`, `organisation_id`, `request_id`, `version`

Mandatory trigger payload families:
- `missing_evidence`: `entity_type`, `entity_id`, `missing_items[]`, `due_date`
- `shipment_blocked`: `shipment_header_id`, `blocking_issues[]`
- `payment_failed`: `billing_event_id`, `amount`, `currency`, `retry_at`
- `submission_rejected`: `dds_record_id`, `reference_number`, `rejection_reason`
- `credential_expiring`: `credential_id`, `credential_type`, `expires_at`
- DDS transition events: `from_status`, `to_status`, `dds_record_id`
- billing events: `billing_event_id`, `event_type`, `status`, `amount_eur`

### 27.4 Retry policy and failures
- In-app: no retry queue required; must persist unread state.
- Email/webhook retries: exponential backoff with capped retries (default 6).
- Permanent failures write final `notification_delivery_log` state and open `compliance_issues` WARNING when event is compliance-critical.

## 28. Onboarding and Invitation Flows
Explicit onboarding is required because producer onboarding, cooperative onboarding, and sponsor onboarding have different legal and operational consequences.
### 28.1 Organisation onboarding
Create organisation.
Select commercial tier.
Assign billing owner.
Assign organization type.
Collect legal identifiers and jurisdiction.
Attach data residency and retention policy.
Create first admin membership.
### 28.2 Producer onboarding
Create or link producer.
Capture consent grant if data will be shared beyond direct sourcing relationship.
Capture identity data, wallet, and GeoID if available.
Start duplicate detection.
Create plot or queue plot capture.
Trigger evidence request if required by workflow.
Bulk-demand mode: cooperatives/exporters may select multiple producers and trigger a `request_campaigns` run to request missing plot geometry or evidence in mass.
### 28.3 Invitation flow
Invitation is generated for a person or producer-admin link.
Token expires.
Acceptance creates member record.
Revocation terminates future access but not historical retention rights.

## 29. Data Residency, GDPR, and Cryptographic Shredding
Regulated personal data and compliance evidence must reside in approved EU-hosted regions.
Approved EU hosting regions must be explicitly enumerated in deployment policy and limited to EU jurisdictions for personal and compliance data.

End-of-relationship workflow is mandatory and must execute in the following order:
- termination trigger is recorded with reason code
- organisation-level access revocation is applied
- portability export offer is generated where applicable
- retention-window calculation is evaluated for all linked records
- GDPR erasure request handling is executed for erasable data
- legal-retention override logic is applied for records under mandatory retention

Termination of organisation membership must never delete producer records. It revokes only the organisation permission layer; producer identity and producer-owned consent grants remain intact unless independently revoked.

When consent is revoked and a producer invokes GDPR erasure, Tracebud cannot hard-delete records tied to submitted DDS objects within the retention window.
Instead, Tracebud applies cryptographic shredding:
- set `producers.anonymized_at`
- null or irreversibly overwrite direct PII (`full_name`, `phone_e164`, `national_id_hash`)
- retain plot geography and TRACES-linked references for mandatory audit retention

### 29.3 Breach Detection and Notification
A data breach event is any confirmed or suspected unauthorized access, disclosure, alteration, or destruction of personal data held by Tracebud.
Tracebud's 72-hour notification obligation starts when Tracebud becomes aware of the breach, not when the breach occurred.

SQL

data_breach_events
id                           UUID PK NOT NULL
detected_at                  TIMESTAMPTZ NOT NULL
reported_by_id               UUID FK → persons.id NULLABLE
breach_type                  ENUM NOT NULL (UNAUTHORISED_ACCESS, DATA_LEAK, ACCIDENTAL_DISCLOSURE, RANSOMWARE, OTHER)
affected_entity_types        TEXT[] NOT NULL
estimated_record_count       INTEGER NULLABLE
affected_org_ids             UUID[] NOT NULL DEFAULT '{}'
dpa_notified_at              TIMESTAMPTZ NULLABLE
dpa_reference                TEXT NULLABLE
affected_persons_notified_at TIMESTAMPTZ NULLABLE
containment_note             TEXT NULLABLE
status                       ENUM NOT NULL (DETECTED, UNDER_ASSESSMENT, NOTIFIED, CLOSED)
created_at                   TIMESTAMPTZ NOT NULL
updated_at                   TIMESTAMPTZ NOT NULL

Automated controls on create:
1. Create a `compliance_issues` record with severity BLOCKING for each affected organisation.
2. Notify all OWNER and ADMIN members of affected organisations in-app and by email immediately.
3. Start a 72-hour countdown from `detected_at`; if `dpa_notified_at` remains NULL at deadline, escalate to Tracebud ops alerting.

Affected producer notifications require human breach-scope review before dispatch; `affected_persons_notified_at` records completion time.

## 30. Reporting, Audit, and Substantiated Concerns
Tracebud should produce annual reporting support exports for non-SME operators, and it should have a formal substantiated-concerns workflow because the platform’s credibility depends on traceable incident handling.[7]
### 30.1 Required reporting outputs
commodity breakdown
country breakdown
volume by period
DDS count
declaration count
risk-tier distribution
block/hold reasons
substantiated concerns count
### 30.2 Substantiated-concern workflow
Concern is created.
Issue is triaged.
Evidence is requested if needed.
Investigation status is updated.
Outcome is recorded.
Audit event is appended.
### 30.3 Compliance package format
Definition:
A compliance package is a deterministic, immutable, signed artifact generated at shipment seal and regenerated as a new artifact when DDS acceptance state changes.

Format and signing:
- JSON-LD payload
- signature algorithm: Ed25519
- signing key: organisation-scoped key material stored in `api_credentials`
- signature scope: canonical serialized payload (sorted keys, no extraneous whitespace)

Required contents:
- `shipment_headers` snapshot at package generation time
- linked `shipment_lines` and `shipment_line_coverages`
- resolved `root_plot_ids` and geometry-version snapshots
- evidence metadata (`file_hash`, parse confidence, parse status), excluding raw files
- linked `dds_records` or `simplified_declarations` payload snapshots
- `role_decision_trace`
- risk and yield engine profile versions used
- package generation timestamp and Tracebud system version

Storage and integrity:
- immutable object storage location
- package SHA-256 stored in `shipment_headers.compliance_package_hash`
- `compliance_package_hash` must be set atomically with sealing

Retention:
`max(5 years from DDS acceptance date, retention_until of the longest-lived linked evidence document)`.

Regeneration rule:
Packages are never overwritten in place. If an amendment is accepted, create a new package and link via `supersedes_id`. Prior package remains immutable.

### 30.4 Portability export format and schema
Format:
- JSON-LD for all export types.

Supported export types:
- `IDENTITY_ONLY`
- `PLOT_ONLY`
- `VOLUME_HISTORY`
- `COMPLIANCE_PACKAGES`
- `FULL`

Top-level payload:
`export_id`, `export_type`, `producer_id`, `geoid_external_id`, `generated_at`, `source_org_id`, `data`, `signature`.

Interoperability/import contract:
- Export includes schema_version and field dictionaries for receiving cooperative import.
- Receiving system must validate signature, schema_version, and required identity anchors before import.

## 31. Non-Functional Requirements
These need to exist in the spec. Without them, “build-signoff” is incomplete.
Field data capture UI feedback must meet p99 <= 200ms for core input actions.
Sync queue flush after reconnect must complete within <= 5 minutes under normal network conditions.
Compliance-critical service path uptime target is 99.9% SLA.
Baseline scale assumptions: 100k producers and 500k plots per major sponsor network.
Recovery Point Objective (compliance data): RPO < 1 hour.
Recovery Time Objective (compliance systems): RTO < 4 hours.
Personal and compliance data residency scope is EU-only.

All compliance-critical actions must be auditable.
All submission payloads must be reproducible from stored snapshots.
All versioned profiles must be immutable after activation.
The system must support offline capture and later deterministic reconciliation.
Encryption at rest must be mandatory for personal and compliance data.
API credentials must never be stored in plaintext.
A change to regulatory profile must not mutate historical records.
### 31.2 Data isolation and tenant security
Tenant isolation controls are mandatory and layered:
- PostgreSQL RLS is required for all tables that contain `organisation_id`.
- Application-layer `organisation_id` predicates are mandatory on all data-access paths; RLS is defense-in-depth, not a substitute.
- Each request-scoped DB session must set active `organisation_id` context for RLS evaluation.
- Application code must not use superuser/bypass-RLS DB connections.
- Sponsor-admin scope may expand read access to `network_relationships.member_org_id` for the governing sponsor network; writes remain blocked except explicit delegated admin actions.
- Cross-org visibility (evidence requests, downstream references) is allowed only with active `consent_grants` checks in query predicates.
- Any new producer/plot/batch/shipment/evidence table must include non-null `organisation_id` and an RLS policy before merge.

## 32. API Contract
### 32.1 Auth model
- JWT bearer tokens issued after email + MFA authentication.
- Scoped API keys for programmatic access.
- Webhooks are signed with HMAC-SHA256 using rotating secrets stored in `api_credentials`.
- Sponsor-admin JWTs include `sponsor_org_id` scope claim.

### 32.2 Versioning
- URL path versioning (`/v1/`).
- Breaking changes require a new API version.
- Minimum deprecation notice: 6 months.
- Current active version: `v1`.

### 32.3 Idempotency
- All POST and PATCH endpoints accept `Idempotency-Key`.
- `Idempotency-Key` maps to `client_event_id`.
- Duplicate requests within 24 hours return original response without re-processing.

### 32.4 Rate limits
- Tier 1: 60 requests/minute
- Tier 2: 300 requests/minute
- Tier 3: 600 requests/minute
- Tier 4 sponsor: 1200 requests/minute
- 429 responses must include `Retry-After`.

### 32.5 Error taxonomy
All errors return:
- `error_code` (machine-readable)
- `message` (human-readable)
- `field_errors` (array, when validation fails)
- `request_id` (trace/support correlation)

### 32.6 Endpoint groups
For each endpoint, document method, path, auth scope, idempotency requirement, and key request/response fields.

- Producer and org onboarding
  - `POST /v1/organisations`
  - `POST /v1/producers`
  - `POST /v1/organisations/{id}/members/invitations`
  - `POST /v1/requests/campaigns`
  - `GET /v1/requests/campaigns/{id}`
  - `GET /v1/requests/campaigns/{id}/targets`
- Plot capture and geometry versioning
  - `POST /v1/plots`
  - `POST /v1/plots/{id}/geometry-versions`
- Evidence upload and parse status
  - `POST /v1/evidence-documents` (multipart)
  - `GET /v1/evidence-documents/{id}/parse-status`
- Consent grant management
  - `POST /v1/consent-grants`
  - `PATCH /v1/consent-grants/{id}/revoke`
- Batch creation, input linking, lineage lock
  - `POST /v1/batches`
  - `POST /v1/batches/{id}/inputs`
  - `POST /v1/batches/{id}/lock-lineage`
- Review workflows (yield and dedup)
  - `POST /v1/yield-exception-requests/{id}/approve`
  - `POST /v1/yield-exception-requests/{id}/reject`
  - `POST /v1/dedup-review-tasks/{id}/merge`
  - `POST /v1/dedup-review-tasks/{id}/mark-distinct`
  - `POST /v1/dedup-review-tasks/{id}/escalate`
- Shipment assembly and sealing
  - `POST /v1/shipment-headers`
  - `POST /v1/shipment-headers/{id}/lines`
  - `POST /v1/shipment-headers/{id}/seal`
- DDS submission, amendment, retraction
  - `POST /v1/dds-records/{id}/submit`
  - `POST /v1/dds-records/{id}/amend`
  - `POST /v1/dds-records/{id}/retract`
- Sync queue flush and conflict resolution
  - `POST /v1/sync/flush`
  - `POST /v1/sync-conflicts/{id}/resolve`
- Portability export request and download
  - `POST /v1/portability-requests`
  - `GET /v1/portability-requests/{id}/download`
- Full compliance record export (continuity/BCP)
  - `POST /v1/compliance-exports`
  - `GET /v1/compliance-exports/{id}`
  - `GET /v1/compliance-exports/{id}/download`
- Audit event and access-log export
  - `GET /v1/audit-events/export`
  - `GET /v1/access-logs/export`
- Annual reporting snapshots
  - `POST /v1/annual-reporting-snapshots/generate`
  - `GET /v1/annual-reporting-snapshots/{id}`
- Compliance issue lifecycle
  - `POST /v1/compliance-issues`
  - `PATCH /v1/compliance-issues/{id}/assign-owner`
  - `PATCH /v1/compliance-issues/{id}/resolve`
  - `PATCH /v1/compliance-issues/{id}/escalate`
  - `GET /v1/compliance-issues/{id}`
- Billing and payment methods
  - `GET /v1/billing-events`
  - `POST /v1/billing/payment-methods`
  - `PATCH /v1/billing/payment-methods/{id}/set-default`
- Webhook registration and delivery logs
  - `POST /v1/webhooks`
  - `GET /v1/webhooks/{id}/deliveries`

### 32.7 Endpoint contract template (normative)
Each endpoint spec block must define:
- method and path
- auth scope
- idempotency requirement
- request schema
- success response schema
- error cases (with `error_code`, status, and field bindings)

### 32.8 Endpoint contract catalog (normative)
Every endpoint listed in Section 32.6 must have a contract row.

| Endpoint | Auth scope | Idempotency | Request schema (minimum) | Success response (minimum) |
|---|---|---|---|---|
| `POST /v1/organisations` | `OWNER` | Required | `legal_name`, `country_iso`, `commercial_tier` | `organisation_id`, `created_at` |
| `POST /v1/producers` | `OWNER, ADMIN, COMPLIANCE_MANAGER, FIELD_AGENT` | Required | `owner_org_id`, `full_name`, `country_iso` | `producer_id`, `verification_status` |
| `POST /v1/organisations/{id}/members/invitations` | `OWNER, ADMIN` | Required | `email`, `role` | `invitation_id`, `expires_at` |
| `POST /v1/requests/campaigns` | `OWNER, ADMIN, COMPLIANCE_MANAGER` | Required | `request_type`, `campaign_name`, `targets[]`, `description_template`, `due_date` | `campaign_id`, `status`, `total_targets`, `created_requests` |
| `GET /v1/requests/campaigns/{id}` | `OWNER, ADMIN, COMPLIANCE_MANAGER` | Not required | path `id` | `campaign_id`, `status`, `counters` |
| `GET /v1/requests/campaigns/{id}/targets` | `OWNER, ADMIN, COMPLIANCE_MANAGER` | Not required | path `id`, pagination params | `items[]`, `page_info` |
| `POST /v1/plots` | `OWNER, ADMIN, COMPLIANCE_MANAGER, FIELD_AGENT` | Required | `producer_id`, `commodity_id`, `country_iso`, `geolocation_mode` | `plot_id`, `deforestation_check_status` |
| `POST /v1/plots/{id}/geometry-versions` | `OWNER, ADMIN, COMPLIANCE_MANAGER, FIELD_AGENT` | Required | path `id`, `geometry`, `capture_method` | `geometry_version_id`, `version_number` |
| `POST /v1/evidence-documents` | `OWNER, ADMIN, COMPLIANCE_MANAGER, FIELD_AGENT` | Required | multipart file + `document_type`, `entity_ref` | `evidence_id`, `parse_status=PENDING` |
| `GET /v1/evidence-documents/{id}/parse-status` | `OWNER, ADMIN, COMPLIANCE_MANAGER, FIELD_AGENT, VIEWER` | Not required | path `id` | `evidence_id`, `parse_status`, `parse_confidence` |
| `POST /v1/consent-grants` | `OWNER, ADMIN, COMPLIANCE_MANAGER` | Required | `producer_id`, `grantee_org_id`, `purpose_code`, `data_scope[]` | `consent_grant_id`, `granted_at` |
| `PATCH /v1/consent-grants/{id}/revoke` | `OWNER, ADMIN, COMPLIANCE_MANAGER` | Required | path `id`, `revocation_reason` | `consent_grant_id`, `revoked_at` |
| `POST /v1/batches` | `OWNER, ADMIN, COMPLIANCE_MANAGER` | Required | `commodity_id`, `batch_reference`, `quantity_kg` | `batch_id`, `yield_check_status` |
| `POST /v1/batches/{id}/inputs` | `OWNER, ADMIN, COMPLIANCE_MANAGER` | Required | path `id`, `source_type`, `source_id`, `quantity_kg` | `batch_input_id`, `batch_id` |
| `POST /v1/batches/{id}/lock-lineage` | `OWNER, ADMIN, COMPLIANCE_MANAGER` | Required | path `id` | `batch_id`, `lineage_locked=true`, `root_plot_ids[]` |
| `POST /v1/yield-exception-requests/{id}/approve` | `OWNER, ADMIN, COMPLIANCE_MANAGER` | Required | path `id`, `approved_factor`, `resolution_note` | `id`, `status=APPROVED`, `reviewed_at` |
| `POST /v1/yield-exception-requests/{id}/reject` | `OWNER, ADMIN, COMPLIANCE_MANAGER` | Required | path `id`, `resolution_note` | `id`, `status=REJECTED`, `reviewed_at` |
| `POST /v1/dedup-review-tasks/{id}/merge` | `OWNER, ADMIN, COMPLIANCE_MANAGER` (`FIELD_AGENT` if delegated) | Required | path `id`, `survivor_entity_id`, `resolution_note` | `id`, `status=MERGED`, `reviewed_at` |
| `POST /v1/dedup-review-tasks/{id}/mark-distinct` | `OWNER, ADMIN, COMPLIANCE_MANAGER` (`FIELD_AGENT` if delegated) | Required | path `id`, `resolution_note` | `id`, `status=DISTINCT`, `reviewed_at` |
| `POST /v1/dedup-review-tasks/{id}/escalate` | `OWNER, ADMIN, COMPLIANCE_MANAGER` (`FIELD_AGENT` if delegated) | Required | path `id`, `escalation_reason` | `id`, `status=ESCALATED` |
| `POST /v1/shipment-headers` | `OWNER, ADMIN, COMPLIANCE_MANAGER` | Required | `shipment_reference`, `workflow_type` | `shipment_header_id`, `package_status=DRAFT` |
| `POST /v1/shipment-headers/{id}/lines` | `OWNER, ADMIN, COMPLIANCE_MANAGER` | Required | path `id`, `commodity_id`, `hs_code`, `quantity_kg` | `shipment_line_id`, `line_number` |
| `POST /v1/shipment-headers/{id}/seal` | `OWNER, ADMIN, COMPLIANCE_MANAGER` | Required | path `id`, optional `seal_note` | `shipment_header_id`, `package_status=SEALED`, `sealed_at` |
| `POST /v1/dds-records/{id}/submit` | `OWNER, ADMIN, COMPLIANCE_MANAGER` | Required | path `id`, optional `submission_mode_override` | `dds_record_id`, `submission_status`, `traces_submission_id` |
| `POST /v1/dds-records/{id}/amend` | `OWNER, ADMIN, COMPLIANCE_MANAGER` | Required | path `id`, amendment payload | `dds_record_id`, `submission_status=AMENDED_SUBMITTED` |
| `POST /v1/dds-records/{id}/retract` | `OWNER, ADMIN, COMPLIANCE_MANAGER` | Required | path `id`, `retraction_reason` | `dds_record_id`, `submission_status=WITHDRAWAL_REQUESTED` |
| `POST /v1/sync/flush` | `OWNER, ADMIN, COMPLIANCE_MANAGER, FIELD_AGENT` | Required | `client_event_batch[]`, `hlc_timestamp` | `accepted_count`, `conflict_count`, `rejected_count` |
| `POST /v1/sync-conflicts/{id}/resolve` | `OWNER, ADMIN, COMPLIANCE_MANAGER, FIELD_AGENT` | Required | path `id`, `resolution_strategy`, optional merge payload | `conflict_id`, `resolution_status` |
| `POST /v1/portability-requests` | `OWNER, ADMIN, COMPLIANCE_MANAGER` | Required | `producer_id`, `request_type` | `portability_request_id`, `status` |
| `GET /v1/portability-requests/{id}/download` | `OWNER, ADMIN, COMPLIANCE_MANAGER` | Not required | path `id` | file stream or `download_url`, `expires_at` |
| `POST /v1/compliance-exports` | `OWNER, ADMIN, COMPLIANCE_MANAGER` | Required | `export_type=FULL_COMPLIANCE_RECORD`, `from_date`, `to_date` | `export_id`, `status=QUEUED`, `expires_at` |
| `GET /v1/compliance-exports/{id}` | `OWNER, ADMIN, COMPLIANCE_MANAGER` | Not required | path `id` | `export_id`, `status`, `progress` |
| `GET /v1/compliance-exports/{id}/download` | `OWNER, ADMIN, COMPLIANCE_MANAGER` | Not required | path `id` | file stream or `download_url`, `expires_at` |
| `GET /v1/audit-events/export` | `OWNER, ADMIN, COMPLIANCE_MANAGER` | Not required | `from_date`, `to_date`, filters | `export_job_id` or stream |
| `GET /v1/access-logs/export` | `OWNER, ADMIN` | Not required | `from_date`, `to_date`, filters | `export_job_id` or stream |
| `POST /v1/annual-reporting-snapshots/generate` | `OWNER, ADMIN, COMPLIANCE_MANAGER` | Required | `reporting_year` | `snapshot_id`, `status` |
| `GET /v1/annual-reporting-snapshots/{id}` | `OWNER, ADMIN, COMPLIANCE_MANAGER, VIEWER, BILLING_CONTACT` | Not required | path `id` | `snapshot_id`, `snapshot_data`, `status` |
| `POST /v1/compliance-issues` | `OWNER, ADMIN, COMPLIANCE_MANAGER` (`FIELD_AGENT` if delegated) | Required | `entity_type`, `entity_id`, `issue_type`, `severity`, `description` | `id`, `status=OPEN`, `created_at` |
| `PATCH /v1/compliance-issues/{id}/assign-owner` | `OWNER, ADMIN, COMPLIANCE_MANAGER` | Required | path `id`, `owner_person_id`, `resolution_path` | `id`, `owner_person_id`, `status` |
| `PATCH /v1/compliance-issues/{id}/resolve` | `OWNER, ADMIN, COMPLIANCE_MANAGER` | Required | path `id`, `resolution_note` | `id`, `status=RESOLVED`, `resolved_at` |
| `PATCH /v1/compliance-issues/{id}/escalate` | `OWNER, ADMIN, COMPLIANCE_MANAGER` | Required | path `id`, `escalation_reason` | `id`, `status=ESCALATED` |
| `GET /v1/compliance-issues/{id}` | `OWNER, ADMIN, COMPLIANCE_MANAGER, FIELD_AGENT` | Not required | path `id` | `id`, `status`, `severity`, `owner_person_id` |
| `GET /v1/billing-events` | `OWNER, ADMIN, BILLING_CONTACT` | Not required | date filters, pagination | `items[]`, `totals`, `page_info` |
| `POST /v1/billing/payment-methods` | `OWNER, BILLING_CONTACT` (`ADMIN` if delegated) | Required | `provider`, `tokenized_payment_ref`, `billing_email` | `payment_method_id`, `status`, `is_default` |
| `PATCH /v1/billing/payment-methods/{id}/set-default` | `OWNER, BILLING_CONTACT` (`ADMIN` if delegated) | Required | path `id` | `payment_method_id`, `is_default=true` |
| `POST /v1/webhooks` | `OWNER, ADMIN` | Required | `endpoint_url`, `event_types[]`, `secret_rotation_policy` | `webhook_id`, `status` |
| `GET /v1/webhooks/{id}/deliveries` | `OWNER, ADMIN` | Not required | path `id`, pagination | `items[]`, `delivery_status`, `attempt_count` |

### 32.9 Webhook event catalog
Webhook events must include all mandatory triggers in Section 27 plus DDS state transitions and billing lifecycle events.

### 32.10 Error code taxonomy
Error envelope:
`{ error_code, message, field_errors, request_id }`

Core error codes:
- `AUTH-001 INVALID_TOKEN` (401)
- `AUTH-002 INSUFFICIENT_SCOPE` (403)
- `VAL-001 FIELD_REQUIRED` (400)
- `VAL-002 FIELD_INVALID` (400)
- `TEN-001 TENANT_SCOPE_VIOLATION` (403)
- `CON-001 CONSENT_REQUIRED` (403)
- `SYNC-001 IDEMPOTENCY_REPLAY` (409)
- `SYNC-002 CONFLICT_REVIEW_REQUIRED` (409)
- `GEO-001 GEOMETRY_INVALID` (422)
- `GEO-002 GEOMETRY_VARIANCE_EXCEEDED` (422)
- `YLD-001 BENCHMARK_UNAVAILABLE` (422)
- `DDS-001 INVALID_STATE_TRANSITION` (409)
- `DDS-002 SUBMISSION_REJECTED` (422)
- `EXT-001 TRACES_AUTH_FAILED` (502)
- `EXT-002 TRACES_VALIDATION_FAULT` (502)
- `BIL-001 PAYMENT_FAILED` (402)
- `OPS-001 INTERNAL_ERROR` (500)

Normative rule:
No API endpoint may return unstructured errors for compliance-critical operations.

## 33. Build Phases
A sane implementation sequence is:
Identity, organisations, producers, consent
Plot capture, geometry versioning, evidence ingestion
Batch lineage and yield engine
Shipment model and downstream retention
DDS / simplified declaration integration
Sync, notifications, billing, audit, reporting
Hardening and compliance QA

## 34. Architectural Decisions and Outcomes
Here is a full breakdown of the final locked decisions based on the amended regulation text and the live TRACES NT WSDL.
Decision 1 — TRACES NT payload schema
Locked to SOAP/WSDL v1, EUDR submission namespace. The live TRACES NT Business API is a SOAP/XML service at namespace http://ec.europa.eu/tracesnt/certificate/eudr/submission/v1, not a REST/JSON API. Three operations exist: submitDds, amendDds, and retractDds.
Spec change: The traces_api_logs table must store SOAP request/response envelopes, not JSON payloads. The adapter layer must handle SOAP faults including BusinessRulesValidationException and DdsPermissionDeniedException as named fault types. The full XSD schema at ?xsd=3 defines the actual payload fields.
Decision 2 — EU information system credential method
Locked to WS-Security UsernameToken + hashed password over HTTPS + WebServiceClientId header. Spec change: Stored credentials are a TRACES NT UsernameToken pair plus a WebServiceClientId. The credential vault must encrypt both values separately, because WebServiceClientId is a static business-system registration with the EC, not an operator-level credential.
Decision 3 — Postal address mode country scope
Restricted to low-risk country + micro/small primary operator pathway only. Postal address substitution applies only where the actor qualifies as a micro or small primary operator in a country classified low-risk under Article 29, and only within the simplified declaration pathway.
Spec change: plots.geolocation_mode = POSTAL_ADDRESS is valid if and only if the associated producer workflow is MICRO_SMALL_PRIMARY_OPERATOR and the country is currently classified LOW in the active risk benchmark. This requires a database constraint CHECK (geolocation_mode != 'POSTAL_ADDRESS' OR postal_address_legal_basis IS NOT NULL) combined with a service-layer validation rule. The postal address "must clearly match the actual location".
Decision 4 — point_buffer_ha_default
Locked as a Product Default; not a legal constant. The law says nothing about buffer size used for deforestation screening purposes.
Spec change: Store point_buffer_ha_default in the versioned risk_engine_profiles config table. Default value is 1.0 and tagged explicitly as source: TRACEBUD_PRODUCT_POLICY. The explainability payload must emit this distinction on every point-based screening run.
Decision 5 — Non-SME trader registration
Locked as Mandatory registration in information system. Regulation (EU) 2025/2650 explicitly adds registration of non-SME downstream operators and non-SME traders in the information system as a legal obligation.
Spec change: Added information_system_registration_id and information_system_registration_status fields to organisations for non-SME Tier 3 actors. The role engine checks enterprise_size when assigning TRADER or DOWNSTREAM_OPERATOR workflows and flags non-SME actors for registration completion before sealing.
Decision 6 — Enterprise-size proof evidence
Locked evidence type; configurable review model. Enterprise size under EUDR maps directly to the definitions in EU Directive 2013/34/EU (micro/small definitions).
Accepted evidence:
Primary: Most recent filed statutory financial statements (balance sheet + P&L)
Secondary: External auditor attestation letter confirming size classification
Partial-commodity carve-out: Management accounts segmented by commodity + auditor sign-off
Transitional: Self-declaration with statutory accounts to follow within 90 days
Spec change: Added enterprise_size_evidence_doc_ids, enterprise_size_verified_at, and enterprise_size_verified_by to the organisations table or as a standalone enterprise_size_assessments record. Self-declaration alone must not unlock the simplified path without a subsequent evidence review stage.
Decision 7 — Producer portability export: self-serve or review-gated
Locked as tiered by data category.
Data category
Recommended model
Reason
Producer's own identity, plots, consent status
Self-serve, immediate
GDPR Art.20 spirit; mission-aligned; no cooperative commercial data
Evidence documents producer uploaded
Self-serve, immediate
Producer's own submissions
Batch contributions, volume history
Review-gated (48h SLA)
Contains cooperative commercial aggregation data
Compliance packages referencing the producer
Review-gated (48h SLA)
May contain third-party operator DDS references
Cross-cooperative linkages
Not portable without explicit consent of second cooperative
Network data governance principle

Spec change: Replace the single portability export concept with an explicit `portability_requests` workflow table with `request_type` (FULL / IDENTITY_ONLY / PLOT_ONLY), `status`, `triggered_by`, `reviewed_by`, and `export_url`. Identity and plot exports auto-approve; volume and compliance exports enter a 48-hour review queue unless the owning cooperative has pre-granted auto-approval in their governance settings.

## 35. Mobile Application Technical Design
Platform decision:
- React Native is the selected mobile framework to align with existing TypeScript code, shared validation logic, and current offline module patterns.
- Minimum supported OS versions: iOS 16+ and Android 10+.

### 35.1 Offline storage model
- Local SQLite stores field-capture entities: `producers`, `plots`, `evidence_documents`, `pending_sync`.
- Local-only tables: device settings, sync backoff state, upload retry state.
- Synced tables: producer/plot/evidence records and queue metadata.
- Schema migrations use versioned migration files applied at app launch before queue processing.

### 35.2 Sync trigger model
Sync attempts are triggered when:
1) app returns to foreground with pending queue items
2) connectivity is restored after offline period
3) user manually triggers sync
4) periodic background sync runs every 15 minutes when connected

Failure policy:
- exponential backoff
- max 4 retries per item
- after max retries, surface error state to user and keep item in recoverable queue

### 35.3 HLC timestamp generation
- Client HLC uses device wall clock and logical counter.
- Current serialized format: `<wall_ms>:<logical_counter>` (canonical for v1.6).
- Logical counter increments when consecutive events share the same wall-clock millisecond.
- Stable per-device UUID must still be persisted for audit/device lineage, but it is not embedded in the v1.6 HLC string.

### 35.4 Conflict surfacing
When server returns `sync_conflicts` with `resolution_status = REVIEWER_REQUIRED`:
- mobile app must surface a high-priority notification
- user is routed to conflict resolution UI
- submissions for affected entity remain blocked until conflict is resolved

### 35.5 Evidence capture and cache policy
- Photo/document capture computes and stores file hash locally before upload.
- Failed uploads are retried from local copy until success or terminal retry state.
- Max local evidence cache size: 2 GB per device.
- Eviction policy: LRU for successfully uploaded files older than 30 days; never evict files with pending/failed upload state.

### 35.6 Offline capability boundaries
Can complete fully offline:
- producer capture
- plot geometry capture
- evidence photo capture
- consent recording

Requires connectivity:
- DDS submission
- yield engine run
- deforestation screening
- dedup scoring

## 36. User Interface and Experience Specification

### 36.0 Canonical role-to-persona mapping
UI persona labels must map to Section 8.1 canonical roles as follows:

| UI persona label | Canonical role(s) |
|---|---|
| Compliance Manager | `COMPLIANCE_MANAGER` |
| Field Agent | `FIELD_AGENT` |
| Organisation Admin | `OWNER`, `ADMIN` |
| Billing Owner | `BILLING_CONTACT` |
| Read-only Viewer | `VIEWER` |
| Sponsor Admin (network context) | `OWNER` or `ADMIN` in sponsor org + `actor_type = SPONSOR_ADMIN` audit context |

Normative rule:
API scopes, audit events, and permission checks must use canonical role names; persona labels are presentation-only.

### 36.1 Tier 1 Farmer Mobile App
- Supported platforms: iOS 16+ and Android 10+.
- Localization: app must support English plus the primary language of each active deployment country. Language is set per producer record using `preferred_language`.
- Literacy/connectivity assumptions: users may have low literacy; all critical actions must be completable with icon-led UI and audio confirmation where available; no critical action may require reading long paragraph text.
- Required screens and flows:
  - registration and wallet setup
  - view own plots
  - view own evidence
  - view consent grants and revoke
  - view portability export request status
  - receive and respond to evidence requests
- Offline behavior:
  - offline-capable screens: own profile snapshot, own plots (cached), own evidence metadata (cached), consent history (cached), pending evidence requests (cached)
  - stale data indicator must be shown when local data age exceeds profile-defined freshness window
  - sync status must surface queue depth, last successful sync timestamp, and current sync error state
- Accessibility baseline: WCAG 2.1 AA minimum for all interactive elements.

Normative rule:
No Tier 1 compliance-critical user journey may require uninterrupted connectivity or dense text comprehension.

### 36.2 Field Agent and Cooperative Mobile App
- GPS polygon and point capture flow:
  - polygon capture records sequential GPS points while agent walks boundary
  - weak-signal mode allows buffering points with quality flags
  - minimum valid polygon point count is 4 points with closed ring
  - incomplete captures are saved as draft geometry when connectivity drops and resume from last point
- Evidence photo capture:
  - minimum capture resolution: 1280x720 equivalent
  - SHA-256 hash computed on-device before upload
  - failed uploads retry automatically on reconnect
- Bulk producer onboarding flow:
  - field-day batch form supports repeated producer creation with shared contextual defaults (district, commodity scope, field agent)
  - each record validates required identity and consent fields before queueing
- Dedup warning surfacing:
  - `SUSPECTED_DUPLICATE_HIGH` shows hard warning and disables local merge in field
  - `SUSPECTED_DUPLICATE_MEDIUM` shows soft warning and allows provisional capture with review flag
  - only desk reviewers may confirm canonical merge
- Conflict notification:
  - when sync returns `REVIEWER_REQUIRED`, app pushes high-priority conflict alert
  - affected entity enters blocked-submit mode until conflict resolution is recorded

Normative rule:
Field agents may capture and queue data during uncertainty, but canonical merge and conflict closure authority remains review-gated.

### 36.3 Compliance Manager Web App (Tier 2 and Tier 3)
- Dashboard KPIs:
  - pending compliance issues
  - shipments by status
  - yield check failures
  - DDS submission queue
  - open requests with due dates
- Shipment assembly flow:
  1. select eligible batches
  2. allocate coverage to shipment lines
  3. validate role classification and blocking issues
  4. seal shipment
  - blocking states prevent next transition and surface remediation actions
- DDS preparation and submission flow:
  - `MANUAL_ASSIST`: generate package, operator submits externally, reference returned and linked
  - `API_DIRECT`: SOAP envelope generation, envelope preview, credential check, submission dispatch
- Yield exception review:
  - reviewer sees ratio, benchmark basis, evidence attachments, and prior decisions
  - approve/reject form captures rationale, approved factor (if any), reviewer identity
- Dedup resolution:
  - side-by-side producer/plot comparison
  - merge confirmation with canonical record selection
  - canonical rule must preserve immutable provenance and supersede duplicates
- Annual reporting snapshot:
  - generate snapshot
  - review computed dimensions
  - export immutable report artifact
- Substantiated concern case:
  - intake form
  - status transitions
  - audit trail timeline view

Normative rule:
No compliance-critical transition in web workflows may execute without explicit visibility of current blocking conditions and audit trail context.

### 36.4 Sponsor Admin Web App (Tier 4)
- Sponsor-only screens:
  - network overview: member org status, network compliance health, billing coverage usage
  - delegated admin actions console with explicit action scope
  - `data_visibility_policy` configuration UI with canonical JSONB keys
  - risk and yield engine profile management for sponsor-governed networks
- Delegated actions must render explicit policy scope and write auditable action records before execution.

Normative rule:
Sponsor-admin UX must enforce policy-scoped action boundaries at interaction time, not only at API response time.

## 37. Yield Benchmark Data Management

### 37.1 Bootstrap dataset
Before Phase 3 begins, the following benchmark coverage must exist.

| Commodity | Geography | Source | yield_lower_kg_ha | yield_upper_kg_ha | seasonality_factor | Review cadence |
|---|---|---|---:|---:|---:|---|
| Cocoa | Ghana | NATIONAL_STATS | 250 | 900 | 1.00 | annual |
| Cocoa | Cote d'Ivoire | NATIONAL_STATS | 300 | 1000 | 1.00 | annual |
| Cocoa | Cameroon | NATIONAL_STATS | 220 | 800 | 1.00 | annual |
| Cocoa | Nigeria | NATIONAL_STATS | 180 | 700 | 1.00 | annual |
| Cocoa | Indonesia | NATIONAL_STATS | 350 | 1100 | 1.00 | annual |
| Coffee Arabica | Ethiopia | NATIONAL_STATS | 300 | 1100 | 1.00 | annual |
| Coffee Robusta | Uganda | NATIONAL_STATS | 450 | 1500 | 1.00 | annual |
| Coffee Arabica | Honduras | NATIONAL_STATS | 400 | 1400 | 1.00 | annual |
| Coffee Arabica | Colombia | NATIONAL_STATS | 500 | 1700 | 1.00 | annual |
| Coffee Robusta | Vietnam | NATIONAL_STATS | 900 | 3000 | 1.00 | annual |
| Rubber | Thailand | NATIONAL_STATS | 700 | 2200 | 1.00 | annual |
| Rubber | Indonesia | NATIONAL_STATS | 600 | 2000 | 1.00 | annual |
| Rubber | Malaysia | NATIONAL_STATS | 800 | 2400 | 1.00 | annual |
| Palm oil | Indonesia | NATIONAL_STATS | 2500 | 5000 | 1.00 | annual |
| Palm oil | Malaysia | NATIONAL_STATS | 2800 | 5500 | 1.00 | annual |
| Soy | Brazil | NATIONAL_STATS | 1800 | 4200 | 1.00 | annual |
| Soy | Argentina | NATIONAL_STATS | 1700 | 4000 | 1.00 | annual |

Normative note:
Wood is excluded from yield-cap evaluation by product policy because wood plausibility is governed by chain-of-custody and legality evidence workflows rather than crop-style per-hectare seasonal yield assumptions.

### 37.2 Ingestion process
- Only Tracebud internal-org users with `ADMIN` or `COMPLIANCE_MANAGER` roles may create or update `yield_benchmarks`.
- Customer organisations cannot directly mutate `yield_benchmarks`.
- Source verification:
  - for `NATIONAL_STATS`, `USDA_FAS`, and `FAOSTAT`, `source_reference` must contain a citable URL or publication identifier
  - if missing, benchmark create/update is rejected
- Approval workflow:
  - new records are created with `active = FALSE`
  - activation (`active = TRUE`) requires a second Tracebud admin approver
  - each state change must write an `audit_events` record
- Annual review:
  - every active benchmark must be reviewed within 12 months of creation or last review
  - overdue benchmarks must trigger `compliance_issues` severity WARNING

Normative rule:
No yield benchmark may become active without dual-control approval and source traceability.

### 37.3 Fallback behavior
When no active benchmark exists for commodity/geography/season:
1. Widen geography in order: province -> country -> regional aggregate -> global FAOSTAT fallback.
2. If still unresolved, set `yield_check_status = UNAVAILABLE` and create `compliance_issues` severity WARNING.
3. `UNAVAILABLE` alone does not block batch progression; block applies only when operator has not acknowledged `UNAVAILABLE` via `yield_exception_requests`.

Normative rule:
Fallback selection order must be deterministic and logged in yield explainability payloads.

## 38. Sponsor Governance Model

### 38.1 data_visibility_policy canonical key schema
SQL

-- Canonical keys for data_visibility_policy JSONB:
-- {
--   "can_view_producer_identity": BOOLEAN,
--   "can_view_plot_geometry": BOOLEAN,
--   "can_view_batch_volumes": BOOLEAN,
--   "can_view_compliance_packages": BOOLEAN,
--   "can_override_yield_exceptions": BOOLEAN,
--   "can_manage_risk_engine_profile": BOOLEAN,
--   "network_risk_engine_profile_version": TEXT NULLABLE,
--   "auto_approve_portability_volume": BOOLEAN,
--   "billing_coverage_scope": ENUM
-- }
--
-- billing_coverage_scope ENUM values:
-- ALL_SHIPMENTS | SPONSORED_SHIPMENTS_ONLY | NONE

Normative rule:
Any missing canonical key in `network_relationships.data_visibility_policy` must be treated as FALSE/NULL-safe and may not grant implicit access.

### 38.2 Sponsor admin permission boundaries
CAN:
- View data within active `data_visibility_policy` scope.
- Approve yield exceptions when `can_override_yield_exceptions = TRUE`.
- Configure network risk profile when `can_manage_risk_engine_profile = TRUE`.
- Cover billing for member-org shipments within `billing_coverage_scope`.
- Create `compliance_issues` records against member-org entities.
- Invite member-org persons at maximum role `FIELD_AGENT` or `VIEWER`.

CANNOT:
- Submit or retract DDS on behalf of member org.
- Revoke producer consent grants.
- Modify sealed shipments or compliance packages.
- Elevate any member-org role above `FIELD_AGENT` without member-org OWNER explicit acceptance.

Audit rule:
Every sponsor-admin action against a member org must write an `audit_events` record with `actor_type = SPONSOR_ADMIN` and sponsor org ID stored in `organisation_id`.

## 39. Testing and Acceptance Criteria

### 39.1 Phase acceptance gates
Applicability:
- MVP release gate requires Phase 1-4 criteria, except tests explicitly marked Release 2+.
- Full v1 release gate requires Phase 1-7 criteria with no exceptions.

Phase 1 (Identity, organisations, producers, consent):
- RBAC matrix enforcement covered by integration tests.
- Consent create/revoke and prospective-only enforcement verified by automated tests.
- Duplicate detection validated across 50 producer-pair expected outcomes.
- Cryptographic shredding test irreversibly removes PII while preserving geometry.

Phase 2 (Plot capture, geometry, evidence):
- Offline capture/sync conflict-injection tests pass conflict strategy suite. (Release 2+)
- Geometry versioning creates immutable history on every update.
- Evidence parsing routes low-confidence to `MANUAL_REQUIRED`.
- PostGIS validation rejects topologically invalid inputs.

Phase 3 (Batch lineage and yield engine):
- Yield engine PASS/WARNING/BLOCKED verified across 20-scenario matrix (intercrop, juvenile, disaster, cross-cooperative).
- Lineage lock blocks inclusion of BLOCKED batches.
- `plot_season_volumes` accumulation remains consistent under concurrent load.

Phase 4 (Shipment model and downstream retention):
- Coverage allocation enforces quantity invariants.
- `PENDING_MANUAL_CLASSIFICATION` blocks sealing for all trigger scenarios.
- Compliance package generation is deterministic for identical inputs.

Phase 5 (DDS / TRACES integration):
- SOAP adapter serializes and validates against XSD before dispatch.
- SOAP fault-handling tests cover configured fault classes.
- DDS state machine transitions are fully covered by transition tests.
- Payload chunking splits oversized payloads and links references to parent `shipment_headers`.

Phase 6 (Sync, notifications, billing, audit):
- Billable events create correct `billing_events` records.
- Notification delivery tests cover mandatory trigger types.
- Audit events exist for all compliance-critical actions.
- HLC ordering remains correct under simulated clock skew.

Phase 7 (Hardening and compliance QA):
- End-to-end compliance scenario passes without manual intervention.
- GDPR erasure flow completes without breaking linked DDS records.
- Penetration tests include RLS bypass, consent circumvention, RBAC escalation, and SOAP credential exposure checks.

Normative rule:
A phase may not be marked complete until all acceptance-gate criteria for that phase pass in CI-traceable evidence.

### 39.2 Regression baseline
After Phase 7, the full end-to-end compliance scenario becomes mandatory regression coverage before any production deployment.

Normative rule:
Production release eligibility requires a passing regression baseline run for the mandatory end-to-end scenario.

## 40. Regulatory Profile Change Management

### 40.1 Profile lifecycle
- New `regulatory_profiles` records are created in draft state and are never applied to live workflows until ACTIVE.
- ACTIVE transition requires:
  1. legal review sign-off recorded in `audit_events` with `actor_type = SYSTEM` and `legal_review_reference` text payload
  2. Tracebud ops approval recorded in `audit_events`
  3. minimum 30-day notice period communicated to all active organisations before default activation
- `effective_to` on prior profile and `effective_from` on successor profile must be set atomically.

### 40.2 In-flight record behavior on profile change
- DRAFT records remain on the profile version under which they were opened; system must warn operator and offer opt-in re-evaluation.
- `SEALED`, `SUBMITTED`, and `ACCEPTED` records are never altered; `regulatory_profile_version` remains immutable.
- Risk/yield profile changes require new profile versions; migration occurs only through explicit operator opt-in or Tracebud ops action with audit trail.

### 40.3 Emergency profile update
For immediate-effect legal changes:
- 30-day notice may be waived only by Tracebud ops decision with recorded justification.
- All organisations must be notified immediately through all configured channels.
- In-flight shipments for affected commodity auto-transition to `PENDING_MANUAL_CLASSIFICATION`.
- A `compliance_issues` record with severity BLOCKING is created per affected organisation.

Normative rule:
Emergency regulatory overrides must be explicitly time-bounded, justified, and fully auditable.

## 41. Anti-Fraud Detection Model

### 41.1 Plot coordinate spoofing
Signal:
- Plot GPS coordinates place plot in country with lower risk tier than declared producer `country_iso`.

Detection:
- On each deforestation run, compare `plots.country_iso` to country derived from geometry centroid.
- If mismatch, create `compliance_issues` severity WARNING and set `deforestation_check_status = UNDER_REVIEW`.

Rule:
- A plot with unresolved declared-vs-derived country mismatch cannot contribute to sealed shipments.

### 41.2 Ghost producer detection
Signal:
- Multiple producers share same `national_id_hash`, or producers missing hash share near-identical GPS + `full_name` fuzzy match > 0.90.

Detection:
- Existing duplicate engine flags `SUSPECTED_DUPLICATE_HIGH`.
- Additional enforcement: batch cannot be lineage-locked while any contributing producer has `duplicate_status = SUSPECTED_DUPLICATE_HIGH` and related `dedup_review_tasks` remains OPEN.

### 41.3 Evidence document forgery signals
Add parse signals in `evidence_documents.parse_result` JSONB:
- `metadata_timestamp_plausible`: BOOLEAN
- `issuer_name_match`: BOOLEAN
- `document_age_within_policy`: BOOLEAN

If any signal is FALSE, `parse_confidence` must be capped at 0.50 and `parse_status` must transition to `MANUAL_REQUIRED`.

### 41.4 Cooperative-level collusion
Signal:
- One organisation submits more than N batches in rolling 30 days where `yield_check_ratio > 1.00` for same commodity and country.

Threshold:
- N is configurable in `yield_engine_profiles`; default N = 3.

Detection:
- After each yield check, count prior matching batches in rolling window.
- If threshold exceeded, create `compliance_issues` severity WARNING and flag organisation for manual review.
- Signal does not auto-block individual batches; it creates a human-investigation case.

Normative rule:
Fraud signals may raise review gates and workflow holds, but final adverse determinations require auditable human adjudication.

## 42. Open Questions Register
The following questions are intentionally deferred and must be resolved before dependent phase work begins.

| # | Question | Blocks | Must resolve before |
|---|---|---|---|
| OQ-01 | What is the live TRACES NT WSDL endpoint URL for April 2026 production and sandbox? | Section 21 adapter build | Phase 5 start |
| OQ-02 | Does TRACES NT `submitDds` accept chunked submissions under one reference number, or does each payload chunk generate a separate reference? | Section 21.8 payload chunking | Phase 5 start |
| OQ-03 | Is the AgStack GeoID API publicly accessible or does it require a bilateral agreement with AgStack? | Section 8.2 GeoID integration | Phase 1 start |
| OQ-04 | Which EU hosting regions are approved for `data_residency_zone`? (`eu-west-1`, `eu-central-1`, others?) | Section 29 data residency controls | Infrastructure setup |
| OQ-05 | What is the enterprise-size evidence review SLA for transitional self-declarations, and who is the internal reviewer? | Decision 6 and Section 10 onboarding controls | Phase 1 org onboarding |
| OQ-06 | Mobile platform baseline confirmation and release profile hardening (React Native selected): any exception cases? | Section 35 mobile technical design | Phase 1 start |
| OQ-07 | Is compliance package signature Tracebud-internal Ed25519 only, or must any workflow support qualified e-signature under eIDAS? | Section 30.3 compliance package | Phase 4 shipment sealing |
| OQ-08 | Does information-system registration (Decision 5) require a Tracebud-assisted flow, or self-service outside Tracebud? | Section 10 org schema and Decision 5 implementation | Phase 4 |
| OQ-09 | Does EUDR require plot-level traceability through processing facilities for coffee washing stations and palm oil mills, or is facility-level aggregation with farmer name lists sufficient? | Section 52.2 intermediary facility model | Before Release 3 scope lock |
| OQ-10 | Does EUDR permit customary tenure documentation as sufficient legal land use evidence, or is formal title required? | Section 53.2 customary tenure handling | Before legal evidence policy freeze |

## 43. TRACES NT Adapter Maintenance and Monitoring

### 43.1 Schema version monitoring
The TRACES adapter must monitor live XSD drift continuously through scheduled checks.

SQL

traces_schema_versions
id                UUID PK NOT NULL
xsd_version_hash  TEXT NOT NULL
fetched_at        TIMESTAMPTZ NOT NULL
diff_detected     BOOLEAN NOT NULL DEFAULT FALSE
diff_summary      TEXT NULLABLE
reviewed_by_id    UUID FK → persons.id NULLABLE
reviewed_at       TIMESTAMPTZ NULLABLE
adapter_updated   BOOLEAN NOT NULL DEFAULT FALSE
status            ENUM NOT NULL (CURRENT, DIFF_DETECTED, REVIEWED, ADAPTER_UPDATED)
created_at        TIMESTAMPTZ NOT NULL

Monitoring job requirements:
- Cadence: weekly.
- Trigger: scheduled system job fetches live `?xsd=3` and compares to last validated hash.
- Idempotency key: `traces_xsd_monitor:<week_iso>:<xsd_hash>`.
- Retry policy: up to 3 retries with exponential backoff on network failure.
- Alert channel: Tracebud ops notification and internal incident channel on diff detection.
- Audit event: write `audit_events` with `event_type = TRACES_XSD_MONITOR_RUN`.

Rules:
- If `diff_detected = TRUE` and `reviewed_at` is NULL after 48 hours, create `compliance_issues` severity BLOCKING for internal Tracebud org with `issue_type = TRACES_SCHEMA_DRIFT`.
- While unresolved BLOCKING `TRACES_SCHEMA_DRIFT` exists, no new `API_DIRECT` DDS submissions may be dispatched; `MANUAL_ASSIST` package preparation/export remains allowed.
- Existing in-flight submissions already in `SUBMITTED` state are not affected.
- `adapter_updated` must be set to TRUE only after engineer validation against new XSD and deployed adapter update.

### 43.2 Submission success rate monitoring
After each `traces_api_logs` write, compute rolling 7-day submission success rate per organisation.

Rules:
- Success denominator: all `submitDds`/`amendDds`/`retractDds` attempts in rolling window.
- Success numerator: attempts with successful terminal status.
- If success rate < 80%, create `compliance_issues` severity WARNING and notify OWNER and ADMIN members of that organisation.

### 43.3 TRACES NT maintenance window handling
SQL

traces_maintenance_windows
id            UUID PK NOT NULL
starts_at     TIMESTAMPTZ NOT NULL
ends_at       TIMESTAMPTZ NOT NULL
announced_at  TIMESTAMPTZ NOT NULL
source_url    TEXT NULLABLE
affected_ops  TEXT[] NOT NULL
created_at    TIMESTAMPTZ NOT NULL

Rules:
- During active maintenance window, `API_DIRECT` submissions are queued and not dispatched; `dds_records` remain `READY_TO_SUBMIT`.
- Operators with queued submissions are notified via configured channels.
- After window ends, queued submissions dispatch automatically in FIFO order with exponential backoff for residual errors.

Normative rule:
Adapter dispatch logic must be maintenance-aware and never silently drop or reorder queued compliance submissions.

## 44. Yield Engine Post-Launch Calibration Protocol

### 44.1 Observed yield data collection
SQL

yield_observations
id                     UUID PK NOT NULL
batch_id               UUID FK → batches.id NOT NULL
organisation_id        UUID FK → organisations.id NOT NULL
commodity_id           UUID FK → commodities.id NOT NULL
country_iso            CHAR(2) NOT NULL
province               TEXT NULLABLE
harvest_season         TEXT NOT NULL
observed_ratio         NUMERIC(6,4) NOT NULL
benchmark_id           UUID FK → yield_benchmarks.id NOT NULL
engine_profile_version TEXT NOT NULL
intercropped           BOOLEAN NOT NULL
created_at             TIMESTAMPTZ NOT NULL

Rules:
- `yield_observations` are created automatically for every yield result in `PASS` or `WARNING`.
- `BLOCKED` results are excluded until resolution via appeal/exception process.
- Observations are calibration inputs only and must not auto-mutate benchmark values.

### 44.2 Calibration review cadence
After each harvest season:
1. Compute p90 `observed_ratio` per commodity/country/province where `n >= 30`.
2. If p90 > 1.0, flag corresponding benchmark for upward revision.
3. Tracebud compliance analyst reviews flags and proposes revised `yield_upper_kg_ha`.
4. Revised benchmark follows dual-approval flow (`active = FALSE` until second admin sign-off).
5. Calibration run output is written to `audit_events` with `event_type = YIELD_CALIBRATION_RUN`.

### 44.3 False positive remediation
If calibration confirms benchmark was too low and caused incorrect `BLOCKED` outcomes:
- Do not auto-unblock batches.
- Each batch requires `yield_exception_requests` review.
- Analyst may approve retroactive factor adjustment with calibration reference note.
- Create `substantiated_concerns` record per affected organisation with `concern_type = BENCHMARK_CALIBRATION_ERROR` and `status = ACTION_TAKEN`.
- Notify affected operators via configured channels.

Normative rule:
Calibration may improve future benchmark accuracy, but retrospective compliance effects require explicit human-reviewed remediation.

## 45. Tracebud Legal Status and Data Processing Obligations

### 45.1 Tracebud as data processor
Tracebud acts as GDPR Article 28 data processor for customer-scoped personal data.

SQL

dpa_acceptances
id               UUID PK NOT NULL
organisation_id  UUID FK → organisations.id NOT NULL
accepted_by_id   UUID FK → persons.id NOT NULL
dpa_version      TEXT NOT NULL
accepted_at      TIMESTAMPTZ NOT NULL
ip_address       TEXT NULLABLE
created_at       TIMESTAMPTZ NOT NULL

Rules:
- Organisation onboarding cannot complete without `dpa_acceptances` record.
- Personal data writes are blocked until DPA acceptance exists.
- DPA version change requires re-acceptance; organisations receive 30-day grace period before compliance-critical feature restriction.

### 45.2 Tracebud as data controller
Tracebud acts as controller for:
- `persons` data used for account/billing management,
- `traces_api_logs` and `access_logs` used for service security/integrity,
- `yield_observations` used for platform calibration.

Rule:
Controller-scope retention periods, legal basis, and subject-right workflows must be config-managed and never hardcoded.

### 45.3 Sub-processor obligations
SQL

sub_processors
id               UUID PK NOT NULL
name             TEXT NOT NULL
service_type     TEXT NOT NULL
data_categories  TEXT[] NOT NULL
country_iso      CHAR(2) NOT NULL
dpa_url          TEXT NULLABLE
active_from      DATE NOT NULL
active_to        DATE NULLABLE
created_at       TIMESTAMPTZ NOT NULL

Rules:
- Sub-processors must be disclosed in DPA.
- Sub-processor changes require 30-day advance notice to all customer organisations.

### 45.4 Tracebud EUDR tool liability boundary
Normative statement for Terms and spec:

Tracebud is a compliance workflow and evidence management platform. Tracebud does not provide legal advice, does not certify EUDR compliance, and does not accept liability for DDS submissions made by operators using the platform. The operator remains solely responsible for the accuracy and completeness of every DDS they submit, whether via MANUAL_ASSIST or API_DIRECT mode. Tracebud screening outputs (deforestation risk tiers, yield check results, role classifications) are operational indicators produced by configurable algorithms and are not legal determinations. Every output must be reviewed by a qualified compliance officer before being relied upon for regulatory submission.

Rule:
This statement must be displayed at shipment sealing and recorded in `audit_events` with `event_type = OPERATOR_LIABILITY_ACKNOWLEDGED`.

## 46. Dataset Freshness and Retroactive Re-screening Protocol

### 46.1 Dataset update detection
When a new `risk_datasets` version is activated:
1. Identify plots whose `deforestation_dataset_version` does not match active provider version for their geography.
2. Queue those plots for re-screening.

SQL

deforestation_screening_runs
id                    UUID PK NOT NULL
plot_id               UUID FK → plots.id NOT NULL
triggered_by          ENUM NOT NULL (MANUAL, DATASET_UPDATE, PLOT_GEOMETRY_CHANGE, SCHEDULED_REVIEW)
dataset_versions_used JSONB NOT NULL
geometry_version_used INTEGER NOT NULL
point_buffer_ha       NUMERIC(6,3) NULLABLE
risk_score            NUMERIC(5,4) NULLABLE
risk_tier             ENUM NULLABLE (LOW, STANDARD, HIGH)
raw_intersection      JSONB NOT NULL
explainability_notes  TEXT NULLABLE
status                ENUM NOT NULL (QUEUED, RUNNING, COMPLETED, FAILED)
completed_at          TIMESTAMPTZ NULLABLE
created_at            TIMESTAMPTZ NOT NULL

### 46.2 Status change handling
If re-screening changes risk tier:

For `CLEAR -> FLAGGED` or `LOW -> HIGH`:
- set `plots.deforestation_check_status = UNDER_REVIEW`
- create `compliance_issues` severity WARNING
- notify OWNER and COMPLIANCE_MANAGER
- set 30-day review window; unresolved items escalate to BLOCKING

For `FLAGGED -> CLEAR` or `HIGH -> LOW`:
- set `plots.deforestation_check_status = CLEAR`
- re-evaluate `shipment_headers.blocking_issues` for affected draft/ready shipments
- remove resolved blocking item where applicable
- write corresponding `audit_events` entry

### 46.3 Impact on sealed and submitted records
Re-screening tier changes do NOT:
- alter sealed shipment records/compliance packages retroactively
- trigger automatic DDS amendment/withdrawal
- mutate prior screening run dataset version snapshots

Rule:
Operator decides whether voluntary DDS amendment is required; Tracebud must surface decision context via `compliance_issues` without autonomous legal action.

## 47. Platform Interoperability

### 47.1 Inbound data import
Tracebud Import Package canonical structure:

```json
{
  "format_version": "tracebud_import_v1",
  "source_system": "string",
  "exported_at": "ISO8601 timestamp",
  "producers": [],
  "plots": [],
  "evidence_references": []
}
```

Import mapping rules:
- Producer required fields: `full_name`, `country_iso`, `capture_method = BULK_IMPORT`.
- Plot required fields: producer reference, `commodity_id`, `country_iso`, `geolocation_mode`, and geometry/postal address per mode rules.
- Imported producers run duplicate detection before write; `SUSPECTED_DUPLICATE_HIGH` is held for review.
- Imported plots run geometry validation before write.
- Processing returns per-record `import_report` statuses: `IMPORTED`, `DUPLICATE_HELD`, `VALIDATION_FAILED`, `QUEUED_FOR_REVIEW`.
- Import-time duplicate scoring must use threshold override when `national_id_hash` is absent: `SUSPECTED_DUPLICATE_HIGH` threshold = 0.92 (aligns with Section 53.1).

### 47.2 Outbound data export for downstream systems
Downstream reference package:

```json
{
  "format_version": "tracebud_downstream_v1",
  "shipment_reference": "string",
  "dds_reference_numbers": ["string"],
  "declaration_identifiers": ["string"],
  "commodity_lines": [
    {
      "hs_code": "string",
      "cn_code": "string",
      "quantity_kg": "number",
      "origin_country_iso": "string",
      "coverage_summary": "string"
    }
  ],
  "valid_from": "ISO8601 date",
  "valid_to": "ISO8601 date",
  "issuing_organisation": {
    "legal_name": "string",
    "eori_or_equivalent": "string"
  }
}
```

Rule:
Package is generated at DDS `ACCEPTED` status and available via API and shipment download.

### 47.3 Competing platform portability
Portability exports must be reconstructable outside Tracebud without account lock-in.

Full portability export must include:
- all `producers` fields
- all `plot_geometry_versions` per plot
- `evidence_documents` metadata (`file_hash`, `document_type`, `parse_confidence`) without requiring raw file retrieval
- all `consent_grants` records with status and scope
- `geoid_external_id` where set
- machine-readable producer contribution summary across batches (`harvest_season`, commodity, `quantity_kg`, `yield_check_status`) excluding cooperative aggregation-sensitive data

Normative rule:
Tracebud portability payloads must be interoperable-by-design and sufficient for third-party reconstruction of producer-level compliance history.

## 48. Security Program

### 48.1 Pre-launch security requirements
Before production data onboarding:
- external penetration test must cover auth/session, RLS bypass, consent circumvention, RBAC escalation, SOAP credential exposure, mass assignment, IDOR, and sync replay/tampered HLC attacks
- all critical/high findings must be remediated pre-launch
- medium findings require approved remediation plan with timeline
- results must be retainable for enterprise NDA disclosure

### 48.2 Ongoing security program
Post-launch:
- quarterly internal security review of `access_logs`
- annual external penetration test
- bug bounty with defined scope/severity/SLAs and 90-day coordinated disclosure policy
- CI/CD vulnerability scanning; critical direct dependency CVE blocks deployment

### 48.3 Credential exposure response
If TRACES credential exposure suspected:
1. revoke `api_credentials` (set `revoked_at`)
2. notify EC helpdesk to suspend associated `WebServiceClientId`
3. create `data_breach_events` with `breach_type = UNAUTHORISED_ACCESS`
4. set affected in-flight submissions to `PENDING_CONFIRMATION` pending re-provision and operator confirmation
5. never auto-retry with old credential

### 48.4 SOC 2 Type II target
Tracebud must achieve SOC 2 Type II (Security, Availability, Confidentiality) within 18 months of production launch; audit period must begin no later than 6 months after launch.

Normative rule:
Security program requirements are release-gating controls and may not be waived without explicit executive risk acceptance and recorded justification.

## 49. Operational Model

### 49.1 Review queue SLAs
| Queue | Table | SLA | Escalation if breached |
|---|---|---|---|
| Yield exception review | `yield_exception_requests` | 5 business days | `compliance_issues` BLOCKING + operator notification |
| Evidence `MANUAL_REQUIRED` | `evidence_documents` | 3 business days | `compliance_issues` WARNING |
| Dedup HIGH review | `dedup_review_tasks` (`SUSPECTED_DUPLICATE_HIGH`) | 2 business days | batch cannot be lineage-locked |
| Dedup MEDIUM review | `dedup_review_tasks` (`SUSPECTED_DUPLICATE_MEDIUM`) | 10 business days | `compliance_issues` INFO |
| Compliance issue owner assignment | `compliance_issues` | 1 business day | escalated to owning org ADMIN |
| Substantiated concern triage | `substantiated_concerns` | 3 business days | `ESCALATED_TO_AUTHORITY` |
| Portability request volume/compliance | `portability_requests` | 48 hours | auto-approve unless manual block set |
| Enterprise size assessment | `enterprise_size_assessments` | 5 business days | `simplified_path_eligible` remains FALSE |
| Breach notification to DPA | `data_breach_events` | 72 hours from `detected_at` | automated ops alert at 60 hours |

### 49.2 SLA breach detection
Hourly scheduled job checks open queue items against SLA.

Rules:
- At 75% elapsed: reminder to assigned reviewer and org ADMIN.
- At 100% elapsed: create/escalate related `compliance_issues` and notify owning organisation.
- Job requirements:
  - cadence: hourly
  - idempotency key: `sla_monitor:<hour_iso>:<entity_type>:<entity_id>`
  - retry: 2 retries
  - audit: `audit_events` with `event_type = SLA_MONITOR_RUN`

### 49.3 Tracebud internal org model
Tracebud must exist as internal organisation with `commercial_tier = 4` and `organisation_type = SPONSOR`.

Rules:
- Tracebud employees performing ops/compliance/admin functions are members of internal org with role-scoped permissions.
- Every Tracebud employee action on customer records must write `audit_events` with Tracebud org as `organisation_id` and employee as `actor_id`.
- Tracebud employees must never use customer credentials; cross-org access uses sponsor-admin permission model only.

Normative rule:
Operational interventions are valid only when policy-scoped, auditable, and attributable to the internal Tracebud organisation context.

## 50. Go-to-Market and Network Bootstrap Constraints

### 50.1 Minimum viable network definition
Minimum viable network status requires:
- at least one Tier 2 org with >= 10 active producers with verified plots and at least one completed batch
- at least one Tier 3 org linked by `network_relationships`
- at least one end-to-end workflow (producer -> plot -> batch -> shipment -> DDS) completed without unintended manual intervention

Rule:
Product must not be represented as EUDR-compliant for operators until minimum viable network status and Phase 7 acceptance gate are both satisfied.

### 50.2 Partial data fallback
During bootstrap:
- Tier 2 orgs are not forced through DDS workflows before Tier 3 buyer linkage
- batch lineage and yield checks may run without `shipment_headers`
- captured data remains immediately allocatable to future shipments without recapture

### 50.3 Bulk data ingestion for cooperative onboarding
SQL

bulk_import_jobs
id                UUID PK NOT NULL
organisation_id   UUID FK → organisations.id NOT NULL
import_type       ENUM NOT NULL (PRODUCERS, PLOTS, EVIDENCE_METADATA)
file_storage_key  TEXT NOT NULL
file_hash_sha256  TEXT NOT NULL
total_records     INTEGER NULLABLE
processed_records INTEGER NOT NULL DEFAULT 0
success_count     INTEGER NOT NULL DEFAULT 0
failure_count     INTEGER NOT NULL DEFAULT 0
status            ENUM NOT NULL (QUEUED, PROCESSING, COMPLETED, FAILED, PARTIAL)
error_summary     JSONB NULLABLE
started_at        TIMESTAMPTZ NULLABLE
completed_at      TIMESTAMPTZ NULLABLE
created_by_id     UUID FK → persons.id NOT NULL
created_at        TIMESTAMPTZ NOT NULL
updated_at        TIMESTAMPTZ NOT NULL

Rules:
- Import pipeline must support operations up to 50,000 producer records per job with asynchronous processing.
- Progress tracking endpoint must expose status and counters.

Normative rule:
Bootstrap ingestion must be scalable, resumable, and auditable so onboarding volume never bypasses compliance controls.

## 51. MVP Scope Definition and Compliance Deadline Phasing

### 51.1 MVP definition
MVP is the minimum feature set that enables one Tier 2 cooperative to capture producer and plot data, assemble a batch, pass or acknowledge yield checks, build a shipment, and submit a DDS via `MANUAL_ASSIST` for one commodity in one country before 30 December 2026.

MVP includes:
- Section 10 identity and organisation model (`persons`, `organisations`, `org_members`, `org_invitations`)
- Section 11 producer and farmer wallet (`producers`, `producer_org_memberships`, `consent_grants`)
- Section 12 plot and geometry (`plots`, `plot_geometry_versions`)
- Section 13 evidence documents (`evidence_documents`, `document_provenance_events`) with manual upload only
- Section 14 batch lineage (`lots`, `batches`, `batch_inputs`) with yield check required and `UNAVAILABLE` permitted with manual acknowledgement
- Section 15 shipment model (`shipment_headers`, `shipment_lines`, `shipment_line_coverages`) for single commodity line
- Section 16 compliance records (`dds_records`) in `MANUAL_ASSIST` mode only
- Section 17 MVP subset only: `requests`, `request_reminders`, `compliance_issues`, `audit_events` (excluding `request_campaigns`, `request_campaign_targets`, `annual_reporting_snapshots`, `portability_requests`)
- Section 26 billing (`SHIPMENT_FEE_T2`, `MONTHLY_BASE_T2`)
- Section 28 onboarding flows
- Section 29 data residency and cryptographic shredding
- Section 31 NFR targets
- Section 32 API contract for MVP endpoint set only
- Section 39 Phase 1–4 acceptance gates

MVP excludes until post-MVP:
- `API_DIRECT` DDS submission (Section 21 SOAP adapter)
- simplified declaration flow (Section 22)
- downstream and trader workflows (Section 23)
- automated evidence parse pipeline (Section 24)
- mobile offline sync (Section 18), web-only at MVP
- deforestation risk engine automation (Section 19), manual screening result upload only
- yield engine calibration protocol (Section 44)
- sponsor governance (Section 38)
- annual reporting snapshots (Section 30)
- multi-commodity batches (Section 14.4)
- bulk import (Section 50.3)

### 51.2 Post-MVP release sequence
Release 2 (target Q1 2027):
- Section 21 SOAP adapter and `API_DIRECT` DDS submission
- Section 18 mobile offline sync with HLC
- Section 19 deforestation risk engine + dataset registry
- Section 22 simplified declaration flow

Release 3 (target Q2 2027):
- Section 24 automated evidence parse pipeline
- Section 23 downstream/trader workflows
- Section 38 sponsor governance
- Section 44 yield calibration protocol

Release 4 (target Q3 2027):
- Section 30 annual reporting snapshots
- Section 50.3 bulk import
- Section 14.4 multi-commodity batch handling
- Section 47 platform interoperability
- SOC 2 audit period begins

Rule:
No release scope may be activated until prior release acceptance gate has passed with test evidence.

### 51.3 Compliance deadline risk statement
Tracebud MVP supports `MANUAL_ASSIST` DDS preparation only. Operators using Tracebud at MVP launch are responsible for submitting prepared DDS packages through the EU Information System directly. `API_DIRECT` submission is available from Release 2. Operators with December 2026 compliance deadlines must plan for manual submission at launch. Tracebud does not guarantee `API_DIRECT` availability before the December 2026 deadline.

Normative rule:
All customer-facing launch materials must disclose MVP submission mode limitations explicitly.

## 52. Commodity-Specific Due Diligence Requirements

### 52.1 Commodity due diligence matrix
| Commodity | Required evidence types | Acceptable geolocation modes | Complexity note |
|---|---|---|---|
| Cocoa | LAND_TITLE or HARVEST_RECORD, CONSENT_FORM, SATELLITE_REPORT for plots > 4ha | POLYGON required > 4ha, POINT permitted < 4ha | High smallholder fragmentation; communal land common |
| Coffee | LAND_TITLE or HARVEST_RECORD, CONSENT_FORM | POLYGON or POINT | Mixed estate + smallholder; washing-station aggregation breaks direct plot-to-batch mapping |
| Rubber | LAND_TITLE, HARVEST_RECORD, REGISTRATION_CERT for plantations | POLYGON required | Estate-heavy; plantation boundary disputes common |
| Palm oil | LAND_TITLE, HARVEST_RECORD, AUDIT_CERTIFICATE where applicable, SATELLITE_REPORT | POLYGON required | Mill aggregation disrupts direct plot traceability; intermediary entity required |
| Soy | LAND_TITLE, HARVEST_RECORD, SATELLITE_REPORT | POLYGON required | Large-scale farms; national registry integration may be country-specific |
| Wood | HARVEST_RECORD, IMPORT_PERMIT, REGISTRATION_CERT | POLYGON required | Legal harvest licence and species evidence are first-class requirements |
| Cattle / leather | REGISTRATION_CERT (herd), slaughter certificate equivalent, LAND_TITLE for grazing land | POLYGON required for grazing land | Highest chain complexity; birth-to-slaughter tracking out of v1 |

### 52.2 Washing station and mill intermediary model
SQL

processing_facilities
id                UUID PK NOT NULL
organisation_id   UUID FK → organisations.id NOT NULL
facility_name     TEXT NOT NULL
facility_type     ENUM NOT NULL (WASHING_STATION, PALM_MILL, DRY_MILL, FERMENTATION_CENTRE, OTHER)
country_iso       CHAR(2) NOT NULL
province          TEXT NULLABLE
latitude          NUMERIC(10,7) NULLABLE
longitude         NUMERIC(10,7) NULLABLE
commodity_id      UUID FK → commodities.id NOT NULL
certification_ids UUID[] NOT NULL DEFAULT '{}'
active            BOOLEAN NOT NULL DEFAULT TRUE
created_at        TIMESTAMPTZ NOT NULL
updated_at        TIMESTAMPTZ NOT NULL

Rules:
- `batch_inputs.source_type` may include `PROCESSING_FACILITY`, referencing `processing_facilities.id`.
- Facility-sourced input must include `delivery_manifest_evidence_id` referencing `evidence_documents` of type `HARVEST_RECORD`.
- Yield engine must traverse delivery manifest contributor data to accumulate per-plot contributions.

### 52.3 legal_compliance_requirements seed data
Before Phase 1 acceptance gate, seed one `legal_compliance_requirements` record per commodity/country pair in Section 52.1 with:
- `regulatory_profile_version = 'eudr_v1_2026'`
- `requirement_type` controlled values: `PLOT_GEOMETRY`, `LAND_TITLE`, `HARVEST_RECORD`, `CONSENT`, `SPECIES_IDENTIFICATION`, `LEGAL_HARVEST_LICENCE`, `HERD_REGISTRATION`
- `optionality_level`: `MANDATORY` or `CONDITIONAL`
- `country_law_citation` where national law is stricter than EU baseline

Normative rule:
Commodity/country due-diligence seeds are mandatory preconditions for valid compliance workflow activation.

## 53. Data Infrastructure Reality Constraints

### 53.1 National ID enrollment gaps
Rules:
- Producer records without `national_id_hash` are valid and may progress through workflows.
- For producers without `national_id_hash`, duplicate engine uses name fuzzy match, phone, GPS proximity, and district match only.
- `SUSPECTED_DUPLICATE_HIGH` threshold increases from 0.85 to 0.92 when `national_id_hash` is absent.
- Onboarding without `national_id_hash` creates `compliance_issues` severity INFO (non-blocking).
- Networks may enforce stricter policy via `data_visibility_policy`; this is governance policy, not platform default.

### 53.2 Communal and customary land tenure
Acceptable legal land-use evidence when no formal title exists:
- customary tenure letter (stored as `document_type = LAND_TITLE`, `parse_result.tenure_type = CUSTOMARY`)
- long-term lease agreement (`document_type = LAND_TITLE`, `tenure_type = LEASEHOLD`)
- government farm registration (`document_type = REGISTRATION_CERT`, `registration_type = FARM_REGISTRATION`)

If none exists:
- set `legal_land_use_status = UNVERIFIED`
- create `compliance_issues` severity WARNING
- allow sealing only if operator explicitly acknowledges with `audit_events.event_type = OPERATOR_UNVERIFIED_LAND_ACKNOWLEDGED`

### 53.3 Communal plot geometry
Rules:
- For communal plots with unknown exact boundaries, `geolocation_mode = POINT` and `area_source = SELF_REPORTED` is allowed.
- Yield engine uses self-reported `area_ha` where geometry-derived area is unavailable.
- Deforestation engine applies active profile point-buffer default.
- System creates `compliance_issues` severity INFO for self-reported geometry precision.

Normative rule:
Data realism constraints must not exclude smallholders by default, but must always emit explicit quality and risk signals.

## 54. Data Escrow and Business Continuity for Customer Compliance Records

### 54.1 Compliance record export obligation
Tracebud must provide self-service full compliance export for each customer organisation:
- via API audit/export endpoints
- via web app full-organisation export
- delivery SLA: <=24h for <10,000 records, <=72h otherwise
- export format must be readable without Tracebud software (JSON-LD)

### 54.2 Continuity commitment
Normative commitment:
If Tracebud ceases operation, is acquired, or materially changes compliance-record terms, Tracebud must:
1. provide 90-day advance notice to active customer organisations
2. provide full compliance record export at no charge during notice window
3. maintain read-only access for at least 12 months after service termination

### 54.3 Data escrow for enterprise customers
SQL

data_escrow_configs
id                    UUID PK NOT NULL
organisation_id       UUID FK → organisations.id NOT NULL
storage_type          ENUM NOT NULL (S3_COMPATIBLE, AZURE_BLOB)
endpoint_url          TEXT NOT NULL
bucket_name           TEXT NOT NULL
encrypted_credentials TEXT NOT NULL
export_cadence        ENUM NOT NULL (DAILY, WEEKLY, MONTHLY)
last_export_at        TIMESTAMPTZ NULLABLE
last_export_status    ENUM NULLABLE (SUCCESS, FAILED, PARTIAL)
active                BOOLEAN NOT NULL DEFAULT TRUE
created_at            TIMESTAMPTZ NOT NULL
updated_at            TIMESTAMPTZ NOT NULL

Normative rule:
Enterprise escrow exports must be encrypted with customer-controlled keys and operate without manual Tracebud intervention.

## 55. Internal Consistency Rules

### 55.1 Known resolutions to document-level conflicts
Conflict 1 — `point_buffer_ha_default`:
- Resolution: `point_buffer_ha_default` lives only in `risk_engine_profiles` with default 1.0 tagged `TRACEBUD_PRODUCT_POLICY`; references under `regulatory_profiles.constants` are documentation errors.

Conflict 2 — `yield_exception_requests` vs `yield_appeal_tasks`:
- Resolution: both required.
- `yield_appeal_tasks` is intake/workflow.
- `yield_exception_requests` is reviewer decision output and must include `appeal_task_id UUID FK`.
- Yield algorithm reads only `yield_exception_requests.approved_factor`.

Conflict 3 — intercrop default hierarchy:
- Resolution hierarchy:
  1. `yield_benchmarks.default_intercrop_density_factor` when benchmark exists
  2. `yield_engine_profiles.default_cropping_share` fallback only when benchmark unavailable

### 55.2 Cross-section dependency map
| Upstream | Downstream dependent sections |
|---|---|
| `regulatory_profiles.constants` schema (Section 9) | 4, 6, 19, 20, 21, 22 |
| `yield_engine_profiles` schema (Section 9) | 20, 44 |
| `risk_engine_profiles` schema (Section 9) | 19, 43, 46 |
| `consent_grants` rules (Section 11) | 23, 29, 38, 53 |
| `plots.geolocation_mode` enum (Section 12) | 19, 21, 22, Decision 3 |
| `batches.yield_check_status` enum (Section 14) | 20, 17, 52 |
| `dds_records.submission_status` machine (Section 16) | 21, 43, 46 |
| RBAC matrix (Section 8.1) | 17, 21, 28, 38, 49 |
| `data_visibility_policy` keys (Section 38) | 8, 31, 49 |

### 55.3 Spec validation requirement
Before any phase acceptance sign-off, run a spec consistency check validating:
- FK references resolve to defined tables/columns
- ENUM values referenced in rules exist in schema
- each JSONB column has canonical key schema
- state machines have no orphaned states
- section cross-references resolve correctly

Normative rule:
Phase 1 engineering may not begin until the consistency check is completed and logged as a tracked task artifact.
