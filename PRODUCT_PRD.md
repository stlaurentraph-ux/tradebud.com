# Tracebud Product PRD (Detailed)

## Purpose

This document captures the detailed product requirements for implementation across the Tracebud ecosystem, while `REQUIREMENTS.md` remains the strategic/commercial source.
The master v1.2 operating specification is `TRACEBUD_V1_2_EUDR_SPEC.md`.
For MVP scope boundaries and release thesis, see `MVP_PRD.md`.
For role-by-role activation/remediation JTBD definitions, see `JTBD_PRD.md`.

## Scope

This PRD operationalizes the four-tier model already defined in `REQUIREMENTS.md`:

- Tier 1: Farmers & Micro-Producers
- Tier 2: Exporters & Cooperatives
- Tier 3: EU Importers & Roasters
- Tier 4: Network Sponsors

It defines product surfaces, workflows, entities, permissions, exception handling, lifecycle states, integrations, and delivery requirements.

## Product Surfaces

- Farmer mobile app (offline-first capture)
- Exporter/cooperative dashboard
- Importer/roaster dashboard
- Network sponsor console
- Internal Tracebud admin console

## Canonical Tier-to-Product Behavior

- **Tier 1:** free onboarding/capture baseline, simplified declaration path for eligible users
- **Tier 2:** aggregation + validation + batch prep + origin shipment fees
- **Tier 3:** importer compliance workflows + TRACES NT + destination shipment fees + retention
- **Tier 4:** sponsor-level network oversight, custom support/integrations

## Core User Roles

- Farmer
- Field Agent / Enumerator
- Cooperative Operator
- Exporter Operator
- Exporter Compliance Admin
- Importer Analyst
- Importer Compliance Admin
- Sponsor Viewer
- Sponsor Admin
- Internal Support Operator
- Platform Super Admin

## Jobs-to-be-Done Summary

- Capture once in the field, reuse across downstream compliance workflows.
- Convert upstream farmer/plot evidence into shipment-ready compliance artifacts.
- Let importers evaluate, pre-flight, and submit with clear blockers and audit traceability.
- Let sponsors monitor portfolio-level health across sponsored organizations.

## Core Lifecycle

1. Onboarding (user/org)
2. Farmer creation/linkage
3. Farm/plot capture
4. Polygon + evidence collection
5. Sync + validation
6. Aggregation
7. Compliance checks
8. Batch creation
9. Shipment & DDS
10. Importer pre-flight
11. TRACES NT submission (eligible tiers)
12. Retention + audit + sponsor oversight

## Core Entities

- User, Organization, Membership
- Farmer, Farm, Plot, PolygonRevision
- PhotoEvidence, DocumentEvidence
- Commodity, Supplier
- Batch, Shipment, DDSRecord
- RiskResult, TRACESSubmission
- SponsorRelationship
- IntegrationEvent
- AuditLogEntry
- BillingEvent

## Ownership and Data Governance

Every entity must define:

- creator
- owner
- editors
- approvers
- downstream consumers
- revocation authority
- archive/delete authority

Cross-tenant access is relationship-based and permissioned (sponsorship, supplier relationships, delegated admin, explicit sharing).

## Permission Model

Actions must be explicitly permissioned:

- create, view, edit
- request review, approve, reject
- submit, export
- archive, delete
- support impersonation
- tenant administration

## State Models (minimum)

- Farmer: draft → active/incomplete → under review → approved/rejected → archived
- Plot: draft → captured → synced/validated/conflicted → superseded/archived
- Document: uploaded → pending → approved/rejected → expired/superseded
- Batch: draft → assembling → validated/blocked → approved/locked → shipped/archived
- Shipment: draft → preparing/blocked → ready for DDS → pre-flight pass/fail → submitted/failed → archived
- Submission: queued → sending → accepted/rejected → retrying/resolved/canceled

## Readiness and Quality

Expose at farmer/supplier/batch/shipment levels:

- completeness score
- validation score
- evidence freshness
- risk level
- filing readiness
- explicit blocking reasons

## Decision Engine Outputs

For each rule/model output:

- status (pass/warn/fail/inconclusive)
- trigger source
- evidence inputs
- confidence
- next action
- human review requirement
- override policy

Overrides require actor + reason + timestamp + audit record.

## Exception Handling (first-class)

Must support:

- offline / partial sync
- duplicate detection
- geometry conflicts
- evidence rejection/expiry
- validation failures
- batch/shipment blockers
- pre-flight fail
- TRACES timeout/reject
- integration outage

Each exception path must provide next action and recovery owner.

## Collaboration and Notifications

Collaboration:

- assignment
- reviewers
- comments/notes
- request-for-fix
- approvals
- escalation history

Notifications:

- sync result
- incompleteness
- evidence status
- blocked workflows
- submission result
- sponsor/network risk alerts
- integration failures

## Mobile Requirements (non-negotiable)

- secure local session
- language
- farmer/farm/plot management
- GPS + polygon capture
- photo evidence capture
- offline drafting and queued sync
- conflict resolution prompts
- clear local-vs-synced state

## Dashboard Requirements

Exporter/Coop:

- bulk review/actions
- readiness scoring
- dedupe/conflict review
- yield-cap views
- batch builder
- shipment preparation

Importer:

- supplier portfolio
- shipment pipeline
- pre-flight clarity
- submission timeline/retries
- audit retrieval

Sponsor:

- sponsored org registry
- org health and risk hotspots
- onboarding and SLA visibility
- delegated admin

## Integrations (detailed specs required)

- TRACES NT
- AgStack GeoID
- Cool Farm Tool
- EcoVadis
- Sustainalytics
- additional quote-gated connectors

Each integration must define auth, triggers, retries, error modes, and monitoring.

## API Requirements

Versioned, documented, permission-aware APIs across:

- auth/identity
- org/membership
- farmer/farm/plot/evidence
- aggregation/batches/shipments/DDS
- risk/submission
- sponsor management
- reporting/billing/audit

## Billing and Entitlements

Entitlements must govern:

- visible features/workflows
- integration depth
- support levels
- billable event mapping
- quote-gated modules

Shipment billing events must be tied to explicit technical events.

## Quote Flow Requirements

The quote flow must be productionized (not simulated):

- validate
- persist lead
- route to sales/onboarding
- retain plan context metadata
- provide confirmation UX

## Non-Functional Requirements

- mobile startup performance
- map responsiveness
- sync latency and reliability
- bulk operation performance
- report generation latency
- submission processing latency
- availability targets for critical workflows

## Delivery Artifacts

Required artifacts for build-readiness:

- role matrix
- JTBD matrix
- journey maps
- state machines
- entitlement matrix
- error/exception catalog
- event tracking plan
- acceptance criteria pack
- consolidated artifact pack: `BUILD_READINESS_ARTIFACTS.md`

## Build-Readiness Rule

This PRD is build-ready only when role journeys can be executed on paper without ambiguity over ownership, permissions, readiness criteria, exceptions, and recovery paths.
