## Product brief

**Product name:** Tracebud Platform MVP  
**Release theme:** EUDR-first operating system for compliant supply chains

Tracebud’s current direction already points to an EUDR workflow spanning field capture, automated filing, risk checks, dashboarding, mobile collection, and sponsor-style network administration.[1]

This PRD turns that into a single ambitious but disciplined v1: one regulation, one core compliance engine, one geospatial workflow, one risk engine, one mobile field app, one enterprise admin layer, and one integrations framework.

Build-readiness delivery artifacts for this MVP are maintained in `BUILD_READINESS_ARTIFACTS.md`.

## Problem

EUDR compliance is fragmented across too many tools.

Operators and importers need to collect farm polygons, supplier records, documents, and shipment data; validate risk and completeness; resolve gaps with upstream partners; generate filing-ready due diligence statements; and maintain audit-ready records. When that work is split across spreadsheets, WhatsApp, GIS tools, consultants, and email, compliance becomes slow, opaque, and hard to scale.

## Vision

Build the first release of Tracebud as an **EUDR compliance platform**, not a point solution.

The MVP should let a network sponsor, importer, exporter, cooperative, or field agent manage the full EUDR loop from source data collection to submission readiness, filing, collaboration, and audit.

## Goals

- Support **EUDR only** in v1.
- Make Tracebud usable by both direct operators and multi-organization sponsor networks.
- Cover the full operational loop: data capture, validation, risk assessment, collaboration, filing, and audit retention.
- Include native mobile for field collection.
- Include multi-tenant admin for enterprise and network sponsors.
- Include ERP/API integration foundations.
- Be sellable as a real platform release, not a prototype.

## Non-goals

- Support for regulations beyond EUDR in v1.
- A general-purpose no-code workflow builder for any business process.
- Full BI/data warehouse analytics in v1.
- Unlimited satellite providers in v1.
- A broad app-store-style integrations catalog in v1.
- Full mobile parity for enterprise admin workflows.
- End-user consumer experiences.

## Users

### Network sponsor

A sponsor manages many organizations across a sourcing network. Tracebud materials already describe sponsor-style flows with centralized dashboards and support for sponsored exporter and importer organizations.[1]

Their job is to onboard organizations, monitor compliance, define templates, and intervene when risk or completeness drops.

### EU importer or downstream operator

This user needs shipment readiness, supplier-level monitoring, filing readiness, and audit retention.

They care most about pre-flight checks, risk dashboards, issue resolution, and final filing outputs.

### Exporter or cooperative admin

This user aggregates farm and shipment data from upstream producers.

They care most about supplier onboarding, batch readiness, exception resolution, data quality, and submitting complete upstream evidence.

### Field agent

This user collects polygons, photos, and farmer data in origin locations. Tracebud materials already position GPS polygon capture and offline mobile collection as a core part of the product.[1]

They need a reliable, simple mobile workflow that works in low-connectivity environments.

## Core value proposition

**Tracebud helps supply-chain organizations achieve EUDR readiness and filing confidence from one platform.**

The platform replaces scattered workflows with:
- Structured origin data collection.
- Geospatial verification.
- Risk scoring.
- Guided remediation.
- Filing preparation.
- Multi-party collaboration.
- Network-level oversight.

## Product principles

- **EUDR-first depth over multi-regulation breadth.**
- **Operational before ornamental**: users must complete work, not just view dashboards.
- **Opinionated flexibility**: configurable templates, not infinite customization.
- **Network-native**: design for many organizations, not one company only.
- **Mobile-first for origin data**.
- **Auditability by default**.

## Scope

| Capability | MVP scope |
|---|---|
| Automated regulatory filing | EUDR due diligence workflow, filing package generation, TRACES NT submission middleware, filing status tracking |
| Geospatial mapping tools | Plot creation, polygon capture, map validation, evidence photos, farm-to-shipment linkage |
| Satellite or risk scoring | One provider flow for deforestation/risk screening plus Tracebud risk rules |
| Advanced dashboards | Operational dashboard, compliance dashboard, supplier risk dashboard, sponsor network dashboard |
| Multi-tenant administration | Tenant isolation, delegated admin, sponsor views, org hierarchy, role-based access |
| ERP integrations | Public API plus 1–2 priority integrations for master data and shipment sync |
| Two-way chat threads | Record-linked conversations with attachments and status |
| Workflow builders | Template-based workflow configuration with stages, conditions, SLAs, and assignments |
| Native mobile apps | Native iOS/Android field app for collection, offline sync, and media capture |

## Release thesis

This MVP is ambitious because it includes the full EUDR operating loop.

It stays disciplined by cutting breadth in four ways:
- Only EUDR.
- Only one primary geospatial and satellite risk flow.
- Only operational and compliance dashboards first.
- Only template-based workflow configuration first.

## Key journeys

### Field-to-farm journey

A field agent receives assignments, opens the mobile app, captures a farmer profile, records plot polygons, takes geotagged photos, and syncs when online.

A cooperative admin reviews the incoming records, corrects issues, and marks the farm ready for compliance review.

### Farm-to-shipment journey

An exporter aggregates farms into lots or shipment-relevant sourcing groups, attaches required supporting records, and runs completeness and rule validation.

Tracebud surfaces gaps like missing polygon coverage, missing evidence, invalid commodity data, or unresolved risks.

### Shipment-to-filing journey

An importer or compliance officer assembles a shipment dossier, runs a pre-flight check, reviews risk outputs, resolves blockers, and generates the EUDR filing package.

The system then pushes the filing through the TRACES NT middleware path and records the status, timestamp, payload, and audit history. Tracebud materials already explicitly reference automated TRACES NT submission and zero-risk pre-flight checks.[1]

### Sponsor oversight journey

A sponsor tenant views all participating organizations, monitors readiness and risk across them, and uses delegated admin tools to intervene or support weaker nodes in the network.

Tracebud materials already reflect centralized sponsor dashboards and network-sponsored organizations.[1]

## Functional requirements

### Identity and access

- Support multi-tenant architecture.
- Support sponsor tenants and standard organization tenants.
- Support users belonging to multiple tenants.
- Support role-based access control.
- Support delegated admin.
- Support SSO-ready architecture, with SSO optional in MVP if timeline requires.
- Support audit logs for access-sensitive actions.

**Roles in MVP**
- Sponsor admin
- Org admin
- Compliance manager
- Reviewer
- Field manager
- Field agent
- Supplier user
- Read-only auditor

### Tenant and organization model

- Tenant types: sponsor, importer, exporter/cooperative, field partner.
- Sponsor can create, invite, and manage subordinate organizations.
- Tenant switching supported in web app.
- Shared records visible only through explicit cross-tenant permissions.
- Strong tenant isolation for data and documents.

### Supplier and network management

- Create supplier organizations and sub-suppliers.
- Store organization profile, commodity focus, country, and contact points.
- Track onboarding status.
- Track required tasks per supplier.
- View supplier compliance health at org and record level.
- Support one sourcing network graph in MVP: sponsor → org → supplier/farm records.

### Geospatial mapping

Tracebud materials already highlight GPS polygon capture with offline mobile support.[1]

**MVP requirements**
- Create and edit farm plots.
- Capture polygons in mobile app.
- Upload/import coordinates manually in web for back-office correction.
- Validate polygon closure and area.
- Associate photos and notes to plot.
- Show map preview in web and mobile.
- Mark plots as draft, submitted, verified, rejected.
- Link plots to farmer, supplier, and shipment records.

### Mobile app

Tracebud materials already position offline mobile capture as a core farmer workflow.[1]

**MVP requirements**
- Native iOS and Android app.
- Secure login.
- Assignment inbox.
- Farmer and plot creation.
- Offline-first local storage.
- Background sync and conflict handling.
- Photo capture with metadata.
- GPS-assisted polygon drawing.
- Validation prompts before submission.
- Basic language support architecture.
- Minimal admin-only functionality; focus on field collection.

### EUDR compliance engine

**MVP requirements**
- EUDR-specific data model for operator, supplier, farm, commodity, shipment, evidence, and filing package.
- Required field validation.
- Completeness scoring.
- Policy/rule engine for blocking vs warning issues.
- Country/risk-tier configuration.
- Shipment dossier assembly.
- Evidence bundle generation.
- Filing package generation.
- Audit retention configuration.

**Rule examples**
- Missing polygon.
- Missing farm-to-shipment linkage.
- Missing commodity classification.
- Missing supporting documents.
- Risk score exceeds threshold.
- Required reviewer approval absent.

### Risk engine

Tracebud materials already refer to multi-supplier risk dashboards and shipment-level screening tied to EUDR workflows.[1]

**MVP requirements**
- One satellite or external risk screening provider.
- Internal risk rules engine.
- Risk score at plot, supplier, and shipment level.
- Risk labels: low, medium, high, blocked.
- Explainability summary per score.
- Manual override with reason and audit trail.
- Re-run screening when critical data changes.

### Filing engine

Tracebud materials already describe automated TRACES NT submission and pre-flight checks as core platform capabilities.[1]

**MVP requirements**
- Filing-ready package builder for EUDR.
- Pre-flight validation before submission.
- TRACES NT middleware connector.
- Submission lifecycle states: draft, ready, submitted, accepted, failed, needs review.
- Payload and response logging.
- Retry flow for failed submissions.
- Human-readable submission report.
- Downloadable audit package.

### Workflow configuration

This is a **complex workflow builder**, but disciplined for v1.

**MVP approach**
- Templates, not open canvas design.
- Admin configures:
  - workflow stages,
  - entry conditions,
  - required tasks,
  - approvals,
  - assignments,
  - due dates,
  - escalation rules,
  - blocking conditions.
- Templates can vary by:
  - tenant type,
  - country,
  - commodity,
  - supplier type,
  - shipment type,
  - risk band.

**Not in v1**
- Visual drag-and-drop BPMN designer.
- Arbitrary scripting.
- End-user custom node development.

### Chat and collaboration

**MVP requirements**
- Two-way chat threads attached to:
  - supplier,
  - farm,
  - plot,
  - shipment,
  - filing,
  - issue/exception.
- Attach files and images.
- Mention users.
- Resolve/unresolve conversations.
- Keep message history immutable.
- Optional email notifications.
- Thread status: open, waiting on partner, resolved.

### Dashboards

Tracebud materials already point to multi-supplier and network-wide compliance dashboards.[1]

**MVP dashboard set**
- Personal work dashboard: tasks, blockers, overdue items.
- Org compliance dashboard: readiness, missing data, filing status.
- Supplier dashboard: onboarding, completeness, unresolved issues.
- Risk dashboard: by supplier, shipment, country, org.
- Sponsor dashboard: all-tenant rollup, weak nodes, overdue filings.
- Mobile collection dashboard: assignments, sync failures, submission rates.

### Integrations and API

Tracebud materials emphasize ERP integration and API-first interoperability.[1]

**MVP requirements**
- Public API with authentication and scoped tokens.
- Webhooks for key events (status changed, issue raised, submission result).
- ERP integration adapters for 1–2 target systems.
- Bulk import/export for onboarding.
- Idempotent ingestion endpoints.
- Integration error monitoring and retries.

### Evidence and document management

- Store structured and unstructured evidence.
- Version files.
- Enforce required document sets by workflow template.
- Virus scan and file type validation.
- Immutable retention copy for submitted filings.
- Signed audit package export.

### Alerts and notifications

- In-app notifications for assigned tasks and blockers.
- Optional email notifications.
- Escalation alerts for SLA breaches.
- Submission status alerts.
- Risk threshold breach alerts.

### Audit and traceability

- Full event trail for record creation, edits, approvals, overrides, submissions, and permission changes.
- Exportable audit log by shipment or filing.
- User and timestamp attribution for all critical actions.

## Data model (MVP-level entities)

- Tenant
- Organization
- User
- Role assignment
- Supplier
- Farmer
- Plot
- Polygon geometry
- Evidence asset
- Risk assessment
- Workflow template
- Workflow instance
- Task
- Issue/exception
- Shipment dossier
- Filing package
- Submission transaction
- Chat thread
- Chat message
- Audit event

## UX requirements

### Web app

- Fast list/detail workflows for suppliers, plots, shipments, and filings.
- Clear status system and blocker visibility.
- Guided remediation from dashboard alerts.
- Sponsor/global views separated from org-local views.
- Chat panel embedded in relevant records.

### Mobile app

- Extremely low-friction data collection.
- Clear offline state indicators.
- Draft/save/submit behavior understandable in poor connectivity.
- Media capture and map workflows optimized for field conditions.

## NFRs

- Security baseline aligned with enterprise SaaS expectations.
- Tenant data isolation and access control enforcement.
- Encryption at rest and in transit.
- High availability target suitable for compliance-critical workflows.
- Reliable background job processing for integrations and submissions.
- Scalable to network sponsor usage across many orgs.
- Observability: logs, metrics, traces, alerting.
- Disaster recovery and backup strategy.

## Compliance and legal considerations

- EUDR data retention and auditability requirements supported.
- Clear provenance records for evidence and edits.
- Consent and data handling controls for farmer/person data where applicable.
- Region-aware data hosting considerations if needed by customers.

## Success metrics

### Adoption

- Number of active organizations onboarded.
- Number of active sponsor networks.
- Monthly active web users by role.
- Monthly active field agents.

### Operational throughput

- Number of farms or plots captured.
- Number of shipments processed.
- Percent of records passing pre-flight without manual intervention.

### Compliance outcomes

- Number of EUDR filing packages generated.
- Submission success rate to TRACES NT.
- Mean time to resolve compliance blockers.
- Share of high-risk shipments resolved before submission.

### Product quality

- Mobile sync success rate.
- API integration success rate.
- Dashboard freshness SLA attainment.

## Milestones

### Milestone 1: Foundation

- Multi-tenant identity and org model.
- Core supplier/farm/plot entities.
- Basic web shell and role model.
- Mobile auth and local data layer.

### Milestone 2: Field and geospatial core

- Mobile farm and polygon capture.
- Web review and verification workflow.
- Evidence management baseline.

### Milestone 3: Compliance and risk core

- EUDR data model completion.
- Rule engine and completeness checks.
- Risk provider integration and scoring.

### Milestone 4: Filing and workflow orchestration

- Filing package generation.
- TRACES NT middleware connector.
- Template-based workflow configuration.
- Issue management and chat threads.

### Milestone 5: Dashboards and sponsor layer

- Org and sponsor dashboards.
- Delegated admin and cross-org oversight.
- SLA/escalation alerts.

### Milestone 6: Integrations and hardening

- ERP/API integrations.
- Webhooks and ingestion reliability.
- Security hardening, audit exports, release readiness.

## Risks and mitigations

- **Risk:** MVP breadth causes schedule overrun.  
  **Mitigation:** lock to EUDR only, single risk provider, template workflows only.

- **Risk:** TRACES NT integration complexity.  
  **Mitigation:** middleware abstraction and staged rollout with sandbox-first approach.

- **Risk:** Mobile offline edge cases harm trust.  
  **Mitigation:** explicit sync diagnostics, conflict UX, and field pilots early.

- **Risk:** Multi-tenant sponsor permissions become fragile.  
  **Mitigation:** strict permission model, audit-first design, and extensive access tests.

- **Risk:** Data quality from upstream users is inconsistent.  
  **Mitigation:** guided forms, required validations, exception workflows, and chat resolution.

## Open questions

- Which 1–2 ERP targets are highest priority for launch customers?
- Will SSO be mandatory for initial enterprise deals?
- Which satellite or risk data provider is chosen for v1?
- What legal packaging is needed for audit exports by market?
- Is there a hard requirement for multilingual field UI in first release regions?

## Appendix A: Source grounding from current Tracebud materials

This PRD is grounded in existing Tracebud positioning and documented architecture direction.

[1] Tracebud platform docs and product pages describing:
- EUDR workflow and automated filing pipeline.
- TRACES NT submission integration.
- Risk dashboards and shipment pre-flight checks.
- Geospatial polygon capture and mobile offline collection.
- Multi-tenant sponsor and sponsored organization model.
- ERP integration and API-first architecture.

_Note:_ The appendix intentionally references existing project materials as the source of truth and avoids inventing product directions outside current Tracebud framing.
