# Tracebud JTBD PRD — Role-Based Activation, Remediation, and Compliance Workflows

## Product context

The MVP release boundary and platform scope for these role workflows is defined in `MVP_PRD.md`.
The master v1.2 operating specification is `TRACEBUD_V1_2_EUDR_SPEC.md`.

Tracebud is currently structured around four role-led tiers: Tier 1 for farmers and micro-producers, Tier 2 for exporters and cooperatives, Tier 3 for EU importers and roasters, and Tier 4 for sponsors or enterprise-style organizations managing wider supply networks. The existing product promise already includes offline mobile capture, GPS and polygon mapping, farmer data ownership, farmer aggregation, yield-cap anti-laundering validation, pre-export EUDR preparation, TRACES NT submission support, multi-supplier dashboards, delegated administration, and audit-ready retention.[3][1][2]

## Problem

Tracebud currently supports the capture, validation, aggregation, and compliance use of upstream data, but the missing operational layer is a formal product workflow for activating external parties in bulk and chasing missing evidence in a structured, auditable way. Exporters need to activate many farmers for mapping and evidence collection, importers need to activate many exporters for traceability readiness, and both sides need one-click remediation when mapping, legal documents, or other required items are missing.[1][2][3]

## Goal

The product should make supplier and farmer chasing a **core workflow**, not off-platform email work. The goal is to reduce manual outreach, speed up record completion, improve shipment and filing readiness, and preserve a clear audit trail of who requested what, when, and whether the missing item was completed.[2][3][1]

## Scope

This PRD covers the JTBD for farmer, field agent, exporter or cooperative operator, exporter compliance admin, importer operator, importer compliance admin, sponsor admin, and platform admin roles. It also introduces a shared cross-tier capability called **Requests & Remediation** to support bulk activation, targeted evidence requests, reminders, escalations, and status tracking across Tier 2 and Tier 3 workflows.[3][1][2]

## Success metrics

Success should be measured by faster onboarding completion, higher mapping completion rates, shorter time-to-remediation for missing records, improved shipment or filing readiness, and stronger audit traceability across origin and compliance flows. Secondary indicators should include fewer manual follow-up emails, fewer unresolved blockers at shipment review, and higher visibility into supplier and farmer completion status.[1][2][3]

## Shared module

**Module name:** Requests & Remediation.[2][3][1]

**Purpose:** Give exporters and importers a standard way to activate external parties in bulk and remediate missing data directly from the workflow that discovered the gap.[3][1][2]

**Core requirements:**
- Bulk request sending with contact lists, app links, onboarding documentation, and role-specific instructions.[1][2][3]
- One-click targeted requests for missing mapping, ground-truth photos, land-tenure evidence, legal documents, or other required fields.[2][3][1]
- Status tracking across sent, opened, started, completed, overdue, and escalated states.[3][1][2]
- Reminder rules, due dates, and escalation logic.[1][2][3]
- Templates by issue type and user type.[2][3][1]
- Audit logging linking requests, responses, approvals, shipment records, and filing records.[3][1][2]

## Farmer

**User role:** Farmer / Micro-Producer.[1][2][3]

**Context:** Tier 1 is positioned as free onboarding for farmers and micro-producers, with offline app support, GPS polygon capture, farmer data wallet controls, and simplified low-risk declaration support where applicable.[2][3][1]

**Triggers:**
- The farmer is invited into a sourcing or compliance network.[3][1][2]
- The farmer is asked to map a plot or complete missing evidence.[1][2][3]

**JTBD:**
- When I join Tracebud, I want to register quickly so I can participate without setup friction or repeated paperwork.[2][3][1]
- When my farm must be mapped, I want a simple mobile workflow for capturing my plot and required proof so my origin data can be reused downstream.[3][1][2]
- When I receive a follow-up request, I want clear instructions and a direct action path so I can complete the missing requirement without confusion.[1][2][3]

**Desired outcomes:**
- Faster farmer activation.[2][3][1]
- Higher mapping completion.[3][1][2]
- Fewer incomplete farmer records.[1][2][3]

**Product requirements:**
- Mobile-first onboarding.[2][3][1]
- Offline support.[3][1][2]
- Plain-language request instructions.[1][2][3]
- Clear missing-item checklist and completion confirmation.[2][3][1]

## Field agent

**User role:** Field Agent / Enumerator.[3][1][2]

**Context:** Field workflows already depend on offline mobile use, plot capture, GPS polygoning, and evidence collection in low-connectivity contexts.[1][2][3]

**Triggers:**
- The agent is onboarding farmers in the field.[2][3][1]
- The agent must resolve incomplete records after an initial visit.[3][1][2]

**JTBD:**
- When I am collecting farmer data, I want to onboard many farmers quickly so field productivity stays high.[1][2][3]
- When I finish capture, I want immediate validation feedback so I know the record is good enough before I leave.[2][3][1]
- When a farmer record remains incomplete later, I want to help resolve the exact missing item without restarting the process.[3][1][2]

**Desired outcomes:**
- Better first-pass data quality.[1][2][3]
- Fewer repeat farm visits.[2][3][1]
- Faster sync-to-ready time.[3][1][2]

**Product requirements:**
- Offline queueing and sync visibility.[1][2][3]
- On-device validation hints.[2][3][1]
- Easy reopening of incomplete farmer tasks.[3][1][2]

## Exporter ops

**User role:** Exporter / Cooperative Operator.[1][2][3]

**Context:** Tier 2 is positioned around farmer aggregation, unlimited cooperative data, yield-cap validation, and automated batch management with pre-export EUDR preparation.[2][3][1]

**Triggers:**
- New farmers or suppliers need onboarding.[3][1][2]
- Existing records are incomplete.[1][2][3]
- A batch is being prepared for shipment.[2][3][1]

**JTBD:**
- When I need origin data at scale, I want to send a bulk request to farmers or field contacts with the app link and onboarding documentation so I can activate mapping without manual one-by-one outreach.[3][1][2]
- When a farmer or supplier record is incomplete, I want to click a button and request the exact missing item so I can unblock shipment preparation quickly.[1][2][3]
- When I prepare export batches, I want to aggregate trusted farmer and plot records into shipment-ready structures so origin proof is consistent and reusable.[2][3][1]

**Desired outcomes:**
- Faster farmer activation.[3][1][2]
- Higher completeness of origin records.[1][2][3]
- Less spreadsheet and email coordination.[2][3][1]

**Product requirements:**
- Bulk contact import and segmentation.[3][1][2]
- Reusable onboarding templates.[1][2][3]
- Missing-item request actions from farmer, supplier, and batch views.[2][3][1]
- Request status dashboard for outstanding upstream blockers.[3][1][2]

## Exporter compliance

**User role:** Exporter Compliance Admin.[1][2][3]

**Context:** Tier 2 already promises yield-cap anti-laundering validation, pre-export EUDR data preparation, and per-shipment due-diligence support on paid tiers.[2][3][1]

**Triggers:**
- A batch enters compliance review.[3][1][2]
- Required evidence is missing.[1][2][3]
- A shipment is moving toward importer-facing readiness.[2][3][1]

**JTBD:**
- When a batch enters review, I want to see compliance blockers immediately so I can stop bad shipments early.[3][1][2]
- When upstream evidence is missing, I want to launch remediation directly from the blocker so my team does not manually translate system gaps into email requests.[1][2][3]
- When issues are resolved, I want the audit trail to show what was requested and completed so due diligence is defensible later.[2][3][1]

**Desired outcomes:**
- Lower review time per shipment.[3][1][2]
- Fewer unresolved evidence gaps.[1][2][3]
- Stronger auditability.[2][3][1]

**Product requirements:**
- Compliance blocker tagging.[3][1][2]
- One-click remediation request creation.[1][2][3]
- Review logs tied to shipment and supplier history.[2][3][1]

## Importer ops

**User role:** Importer Operator / Analyst.[3][1][2]

**Context:** Tier 3 is positioned around multi-supplier sourcing oversight, automated TRACES NT submission support, zero-risk pre-flight checks, and audit-ready retained records.[1][2][3]

**Triggers:**
- New exporters or suppliers are onboarded.[2][3][1]
- Supplier records are incomplete.[3][1][2]
- Products must be assessed for traceability readiness.[1][2][3]

**JTBD:**
- When I onboard suppliers, I want to send a bulk request explaining how to make products traceable, including required documentation and instructions, so supplier activation is standardized.[2][3][1]
- When a supplier file is missing something, I want to trigger a targeted remediation request for the exact missing item so my team avoids custom follow-up emails.[3][1][2]
- When suppliers respond, I want their progress to update readiness views automatically so I can focus on the suppliers still blocking filing readiness.[1][2][3]

**Desired outcomes:**
- Standardized supplier onboarding.[2][3][1]
- Better network-level visibility.[3][1][2]
- Faster progress from supplier activation to filing readiness.[1][2][3]

**Product requirements:**
- Supplier campaign workflows.[2][3][1]
- Product- or supplier-level missing-item actions.[3][1][2]
- Network dashboard with completion and blocker status.[1][2][3]

## Importer compliance

**User role:** Importer Compliance Admin.[2][3][1]

**Context:** Tier 3 already centers on zero-risk pre-flight checks, TRACES NT middleware, and long-term audit-ready data retention.[3][1][2]

**Triggers:**
- A shipment is moving toward EU filing.[1][2][3]
- A supplier record fails pre-flight review.[2][3][1]
- An auditor or regulator asks for evidence later.[3][1][2]

**JTBD:**
- When a shipment is prepared for filing, I want automated pre-flight validation so I catch failures before submission.[1][2][3]
- When supplier records are incomplete, I want remediation actions inside the filing workflow so exception handling stays in one system.[2][3][1]
- When I need to defend a filing later, I want retained records of source data, requests, responses, and approvals so the due-diligence path is fully reconstructable.[3][1][2]

**Desired outcomes:**
- Fewer failed filings.[1][2][3]
- Less time lost to exception handling.[2][3][1]
- Stronger legal defensibility.[3][1][2]

**Product requirements:**
- Blocking pre-flight workflow.[1][2][3]
- Embedded remediation queue.[2][3][1]
- Filing-linked audit history and retention.[3][1][2]

## Sponsor admin

**User role:** Sponsor Admin / Network Sponsor.[1][2][3]

**Context:** Tier 4 is positioned around multi-tenant administration, sponsorship of exporter and importer organizations, centralized dashboards, and advanced cross-network compliance workflows.[2][3][1]

**Triggers:**
- A sponsor manages multiple exporter or importer organizations.[3][1][2]
- The sponsor must standardize onboarding, quality, or compliance across the network.[1][2][3]

**JTBD:**
- When I manage many partner organizations, I want centralized visibility across them so I can identify weak adoption or compliance performance quickly.[2][3][1]
- When I sponsor onboarding at scale, I want shared templates, rules, and escalation logic so each organization does not reinvent outreach workflows.[3][1][2]
- When some partners lag behind, I want sponsor-level dashboards and controls so I can intervene before network-wide performance suffers.[1][2][3]

**Desired outcomes:**
- More consistent data quality across tenants.[2][3][1]
- Lower operational variance across partner orgs.[3][1][2]
- Better sponsor-level governance.[1][2][3]

**Product requirements:**
- Cross-org templates.[2][3][1]
- Centralized request analytics.[3][1][2]
- Delegated admin with tenant-safe controls.[1][2][3]

## Platform admin

**User role:** Platform Admin / Support.[2][3][1]

**Context:** The platform supports multiple roles, multiple organizations, multiple compliance steps, and both field-side and filing-side workflows.[3][1][2]

**Triggers:**
- Customers report onboarding, sync, request, or compliance issues.[1][2][3]
- Internal teams must diagnose workflow failures quickly.[2][3][1]

**JTBD:**
- When a customer is blocked, I want visibility into the full workflow state so support can identify whether the problem is capture, mapping, outreach, validation, or filing.[3][1][2]
- When a process breaks, I want operational logs and status traces so recovery does not depend on manual reconstruction.[1][2][3]
- When the product scales, I want configurable templates, permissions, and rules so common customer needs do not require custom engineering each time.[2][3][1]

**Desired outcomes:**
- Faster support resolution.[3][1][2]
- Better workflow observability.[1][2][3]
- Lower operational complexity.[2][3][1]

**Product requirements:**
- End-to-end workflow state visibility.[3][1][2]
- Request event logs.[1][2][3]
- Admin-configurable templates and rules.[2][3][1]

## Functional requirements

The product must support **bulk activation** for both exporters contacting farmers and importers contacting exporters or suppliers. The product must support **targeted remediation** from any blocked record, including mapping gaps, legal-document gaps, missing photos, and other evidence gaps. The product must support **status-aware orchestration**, including reminders, escalations, and audit logging across the request lifecycle.[3][1][2]

## Non-functional needs

Because Tracebud already serves field and compliance contexts, request workflows should be low-friction, mobile-friendly, role-aware, and compatible with low-connectivity environments where relevant. Because Tracebud also emphasizes audit readiness, every request action and response should be durable, timestamped, attributable, and linked to the affected record, batch, or filing.[1][2][3]
