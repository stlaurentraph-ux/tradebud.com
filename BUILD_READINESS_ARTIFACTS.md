## Build Readiness Artifacts Pack

## Scope base

This pack assumes **EUDR only** for v1 and treats Tracebud as a multi-tenant platform serving farmers or field agents, exporters or cooperatives, EU importers, and network sponsors.[1]

It is optimized for the currently signaled product surface: field data capture, shipment preparation, filing middleware, risk dashboards, delegated administration, and enterprise-grade integrations.[1]

***

## Role matrix

The current Tracebud direction already implies four major operating contexts: field collection, exporter/cooperative operations, importer compliance operations, and sponsor-level network oversight.[1]

The role set below turns that into build-ready product actors.

| Role | Tenant type | Primary goal | Core actions | Approval power | Notes |
|---|---|---|---|---|---|
| Field Agent | Exporter / Cooperative / Field Partner | Capture farmer, farm, polygon, and photo evidence | Create records, edit assigned records, submit for review | No | Mobile-first role aligned to offline GPS polygon capture. [1] |
| Field Manager | Exporter / Cooperative | Coordinate field collection quality and throughput | Create assignments, review submissions, return corrections | Limited, field data only | Owns collection SLAs and backlog. |
| Supplier User | Supplier org | Provide requested upstream data and evidence | Upload docs, answer requests, respond in threads | No | External collaborator role. |
| Org Admin | Exporter / Cooperative / Importer | Configure tenant, users, templates, suppliers | Manage users, workflows, org settings, imports | Yes, org-scoped | Core operational admin. |
| Compliance Analyst | Importer / Exporter | Validate readiness and resolve exceptions | Review records, run checks, open issues, build dossiers | No final filing approval | Main queue-based back-office role. |
| Compliance Manager | Importer | Approve filing readiness and submit | Approve, override with reason, submit filing, monitor status | Yes, filing-scoped | Owns shipment-level signoff. |
| Risk Reviewer | Importer / Sponsor | Review scored risks and decide escalation | Inspect risk outputs, request evidence, override with reason | Yes, risk-scoped | Optional specialized role for larger tenants. |
| Sponsor Admin | Sponsor | Manage many organizations across a network | Create orgs, view cross-tenant dashboards, assign remediation | Yes, sponsor-scoped | Mirrors the network sponsor model already described. [1] |
| Auditor / Read Only | Any | Inspect evidence, status, and logs | View records, exports, history | No | For internal audit or external review. |

### Responsibility model

- **Field Agent** owns raw origin capture.
- **Field Manager** owns collection quality.
- **Supplier User** owns upstream responses.
- **Compliance Analyst** owns completeness and issue handling.
- **Compliance Manager** owns filing decision.
- **Sponsor Admin** owns cross-network oversight.

***

## JTBD matrix

The jobs below are grounded in the current Tracebud promise: collect field data, prepare EUDR evidence, score risk, submit via TRACES NT, and monitor network readiness.[1]

These JTBD statements should drive roadmap tradeoffs, UX prioritization, and analytics.

| Actor | When... | I want to... | So I can... | Main trigger | Success signal |
|---|---|---|---|---|---|
| Field Agent | I am visiting a farm with weak connectivity | capture polygon, photos, and farmer details offline | submit trustworthy source data without waiting for signal | New assignment | Record syncs with no missing required evidence |
| Field Manager | a collection wave is underway | see assignment progress and rejected submissions | fix bottlenecks before shipment deadlines | Daily operations review | High first-pass approval rate |
| Supplier User | a buyer requests evidence | upload the required documents and answer questions in one place | avoid repeated back-and-forth by email or chat apps | Request received | Request marked complete |
| Exporter / Cooperative Admin | I am preparing a shipment | aggregate source data and validate completeness | send a dossier upstream without compliance gaps | Shipment planned | Shipment reaches ready-for-review |
| Compliance Analyst | I receive a new shipment package | run checks and resolve blockers quickly | move compliant shipments toward filing | Shipment enters review | Low blocker aging |
| Compliance Manager | a shipment is almost ready | run pre-flight and approve submission confidently | reduce failed filings and audit risk | Submission deadline | First-pass filing success |
| Risk Reviewer | a plot or shipment is flagged | inspect why the risk score is high | decide whether to block, request evidence, or override | Risk threshold exceeded | Clear disposition with rationale logged |
| Sponsor Admin | several orgs are operating in my network | compare readiness and intervene where needed | raise overall compliance quality across tenants | Weekly governance review | Fewer overdue orgs and unresolved blockers |
| Auditor | I need to inspect a filed shipment | review evidence, actions, and submission history | confirm the process was controlled and traceable | Audit event | Complete audit trail export |

### Prioritized jobs

Top v1 jobs:
- Capture trustworthy field data offline.
- Assemble shipment-ready EUDR evidence.
- Run pre-flight and submit with confidence.
- Monitor supplier and org risk centrally.[1]

***

## Journey maps

These are the four critical v1 journeys because they map directly to the current Tracebud product promise across mobile capture, EUDR preparation, risk review, filing, and sponsor oversight.[1]

Each journey should become a design lane, QA lane, and analytics lane.

### Supplier onboarding

| Stage | Primary actor | User goal | System behavior | Failure points |
|---|---|---|---|---|
| Invite | Org Admin | Add supplier org | Create supplier profile and send onboarding link | Wrong contact, duplicate org |
| Intake | Supplier User | Submit required company and origin info | Present checklist and save progress | Missing required fields |
| Evidence | Supplier User | Upload requested documents | Validate file types and completeness | Bad files, stale docs |
| Review | Compliance Analyst | Approve or request correction | Show checklist, comments, and status | Ambiguous review criteria |
| Activate | Org Admin | Enable supplier for shipments | Mark supplier active and usable in shipment flows | Open blockers not visible |

### Field capture

| Stage | Primary actor | User goal | System behavior | Failure points |
|---|---|---|---|---|
| Assign | Field Manager | Send collection work | Create mobile assignment with due date | Assignment not synced |
| Collect | Field Agent | Capture farmer, farm, polygon, photos | Offline-first data capture with validation | GPS inaccuracy, missing media |
| Submit | Field Agent | Hand off completed record | Queue sync and show pending state | Sync conflict |
| Review | Field Manager / Analyst | Validate field evidence | Approve, reject, or return with comments | Incomplete polygon or poor photo quality |
| Verify | Compliance team | Mark record ready for use | Lock approved evidence and expose downstream | Missing link to supplier |

### Shipment readiness

| Stage | Primary actor | User goal | System behavior | Failure points |
|---|---|---|---|---|
| Create | Exporter Admin | Open shipment dossier | Create shipment and link supplier lots | Missing mandatory references |
| Aggregate | Exporter Admin | Attach farms, plots, docs | Build dossier completeness score | Missing source linkage |
| Validate | Compliance Analyst | Run rules and risk checks | Show blockers, warnings, and score breakdown | Too many unclear exceptions |
| Remediate | Supplier / Analyst | Fix issues fast | Threaded comments and reassignment | Slow partner response |
| Approve | Compliance Manager | Mark ready for filing | Enforce approvals and immutable history | Override without rationale |

### Filing submission

| Stage | Primary actor | User goal | System behavior | Failure points |
|---|---|---|---|---|
| Pre-flight | Compliance Manager | Confirm filing readiness | Run zero-risk and completeness checks | Hidden blockers |
| Generate | System / Manager | Build submission payload | Produce filing package and evidence bundle | Data transform mismatch |
| Submit | System | Send to filing middleware | Log request, timestamp, response, retries | Middleware outage |
| Monitor | Compliance Analyst | Track outcome | Show accepted, failed, pending, needs review | Weak status clarity |
| Retain | Auditor / Manager | Keep audit-ready history | Persist payload, evidence, and events | Incomplete retention controls |

### Sponsor oversight

| Stage | Primary actor | User goal | System behavior | Failure points |
|---|---|---|---|---|
| View | Sponsor Admin | See network status | Roll up org health and overdue items | Cross-tenant filters unclear |
| Drill in | Sponsor Admin | Inspect weak orgs | Open org, supplier, or shipment detail | Permission gaps |
| Intervene | Sponsor Admin | Trigger remediation | Assign tasks or escalate to org admin | Ownership ambiguity |
| Track | Sponsor Admin | Monitor improvement | Trend dashboards and aging views | No closed-loop reporting |

***

## State machines

State machines are required because this MVP includes regulated submission, offline capture, cross-tenant collaboration, and risk-based blocking; those flows cannot rely on loose status labels.[1]

Below are the minimum authoritative v1 state models.

### Supplier onboarding

```text
draft -> invited -> in_progress -> submitted -> under_review -> approved -> active
                                                   -> changes_requested -> in_progress
under_review -> rejected
active -> suspended
```

**Rules**
- Only Org Admin can move `draft -> invited`.
- Only Supplier User or Org Admin can move `in_progress -> submitted`.
- Only reviewer roles can move `submitted -> under_review`.
- `approved` is not enough for transaction use; supplier becomes usable only at `active`.

### Plot record

```text
draft -> captured -> synced -> under_review -> verified
                                 -> rejected -> draft
verified -> archived
```

**Rules**
- `captured` may exist only on mobile local device.
- `synced` means server has accepted payload.
- `verified` locks geometry and evidence against casual edits.
- Any post-verification edit creates a new review cycle.

### Shipment dossier

```text
draft -> collecting_data -> validating -> blocked
                           -> ready_for_approval -> approved_for_filing -> filed
blocked -> collecting_data
filed -> filing_failed
filed -> filing_accepted
```

**Rules**
- `blocked` means at least one blocking validation exists.
- `approved_for_filing` requires all mandatory approvals.
- `filed` means submission attempted, not necessarily accepted.
- `filing_failed` may be retried without recreating shipment if payload version is unchanged.

### Filing package

```text
draft -> generated -> preflight_passed -> submitted -> accepted
                             -> preflight_failed
submitted -> failed
submitted -> needs_manual_review
failed -> regenerated
```

**Rules**
- Payload version increments at every `generated`.
- `submitted` stores exact payload hash.
- `accepted` is terminal for that package version.
- `regenerated` creates a new package version linked to the same shipment.

### Issue / exception

```text
open -> assigned -> waiting_on_partner -> updated -> resolved
resolved -> reopened
open -> dismissed
```

**Rules**
- Every blocking validation spawns an issue or links to an existing issue.
- `dismissed` requires rationale and role-based permission.
- Reopening retains full history.

### Chat thread

```text
open -> waiting_internal
open -> waiting_partner
waiting_internal -> resolved
waiting_partner -> resolved
resolved -> reopened
```

***

## Entitlement matrix

The current Tracebud direction already distinguishes product value by actor and network level, including field capture, importer filing, and sponsor-wide administration.[1]

This matrix converts that into v1 permission intent.

| Capability | Field Agent | Field Manager | Supplier User | Org Admin | Compliance Analyst | Compliance Manager | Sponsor Admin | Auditor |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Create farmer/farm/plot | Yes | Yes | No | Yes | No | No | No | No |
| Edit assigned field records | Yes | Yes | No | Yes | No | No | No | No |
| Approve field records | No | Yes | No | Yes | Limited | No | No | No |
| Upload supplier evidence | No | No | Yes | Yes | Yes | Yes | No | No |
| Create shipment | No | No | No | Yes | Yes | Yes | No | No |
| Link suppliers and plots to shipment | No | No | No | Yes | Yes | Yes | No | No |
| Run validations | No | Limited | No | Yes | Yes | Yes | Read only | No |
| Override blocking rule | No | No | No | No | No | Yes | Yes | No |
| Submit filing | No | No | No | No | No | Yes | No | No |
| View org dashboard | No | Yes | Limited | Yes | Yes | Yes | No | Yes |
| View network dashboard | No | No | No | No | No | No | Yes | Limited |
| Manage users | No | No | No | Yes | No | No | Sponsor scope | No |
| Configure workflows | No | No | No | Yes | No | No | Sponsor template scope | No |
| Start chat thread | Yes | Yes | Yes | Yes | Yes | Yes | Yes | No |
| Resolve issue thread | No | Yes | No | Yes | Yes | Yes | Yes | No |
| Export audit bundle | No | No | No | Yes | Yes | Yes | Yes | Yes |
| View audit log | No | No | No | Yes | Yes | Yes | Yes | Yes |

### Entitlement principles

- **Least privilege by default.**
- **Approval and override rights are separate from edit rights.**
- **Sponsor access is supervisory unless explicit delegated edit permission is granted.**

***

## Error catalog

This MVP needs a formal exception model because it spans mobile offline capture, risk scoring, rule validation, document ingestion, and regulated submission middleware.[1]

Each error should map to a product state, a user-facing message, and an operational recovery path.

| Code | Area | Trigger | User-facing meaning | Severity | Recovery path |
|---|---|---|---|---|---|
| GEO-001 | Polygon capture | Polygon not closed | “Complete the plot boundary before submitting.” | Blocking | Return to map editor |
| GEO-002 | Polygon capture | Area too small / invalid geometry | “This boundary looks invalid. Review points and try again.” | Blocking | Redraw or correct coordinates |
| MOB-001 | Mobile sync | No network on submit | “Saved offline. We’ll sync when connection returns.” | Warning | Auto-retry in background |
| MOB-002 | Mobile sync | Conflict on same record | “Another update exists. Review and merge changes.” | Blocking | Open conflict resolution |
| DOC-001 | Evidence | Unsupported file type | “This file type is not supported.” | Blocking | Re-upload supported format |
| DOC-002 | Evidence | Missing required document | “A required evidence file is still missing.” | Blocking | Show checklist gap |
| VAL-001 | Completeness | Mandatory field absent | “Complete all required fields before continuing.” | Blocking | Link to missing fields |
| VAL-002 | Linkage | Shipment has unlinked source data | “Some shipment lines are not linked to source plots.” | Blocking | Open linkage view |
| RISK-001 | Risk engine | External screening unavailable | “Risk screening is temporarily unavailable.” | Blocking for filing | Retry or queue for re-run |
| RISK-002 | Risk engine | Score above permitted threshold | “This shipment needs risk review before filing.” | Blocking | Route to reviewer |
| WF-001 | Workflow | Required approval missing | “This step needs approval before proceeding.” | Blocking | Request approver action |
| CHAT-001 | Collaboration | Attachment upload failed | “Attachment failed to upload.” | Warning | Retry upload |
| FIL-001 | Pre-flight | Filing package incomplete | “Pre-flight found blocking issues.” | Blocking | Open blocker list |
| FIL-002 | Submission | Middleware timeout | “Submission timed out. We’re retrying safely.” | Critical | Automatic idempotent retry |
| FIL-003 | Submission | External rejection | “Submission was rejected. Review response details.” | Blocking | Create review task |
| AUTH-001 | Permissions | User lacks entitlement | “You don’t have permission to perform this action.” | Blocking | Request access |
| TEN-001 | Tenant access | Cross-tenant resource denied | “This record is not available in your current organization.” | Blocking | Switch tenant or request permission |

### Exception handling rules

- Blocking errors prevent state transition.
- Warning errors allow progress but create a visible flag.
- Critical integration errors create operational alerts and retry jobs.
- Every external submission failure must preserve exact request and response history.

***

## Event plan

This event plan covers both **product analytics** and **operational telemetry**.

It should be implemented consistently across web, mobile, and backend workflow processing.

### Naming rules

- Use `object_action` format.
- Use past tense only for completed backend events.
- Include `tenant_id`, `org_id`, `user_id`, `role`, `platform`, and `workflow_template_id` whenever available.

### Core events

| Event name | Trigger | Required properties | Purpose |
|---|---|---|---|
| `login_completed` | User signs in | method, tenant_id, role | Auth usage |
| `tenant_switched` | User changes active tenant | from_tenant_id, to_tenant_id | Multi-tenant behavior |
| `supplier_created` | Supplier record created | supplier_id, tenant_type | Onboarding funnel |
| `supplier_submitted` | Supplier intake submitted | supplier_id, checklist_score | Intake completion |
| `supplier_approved` | Supplier approved | supplier_id, reviewer_role | Approval rate |
| `assignment_created` | Field assignment created | assignment_id, assignee_id, due_date | Mobile operations |
| `plot_capture_started` | Mobile map capture begins | plot_id, offline_mode | Geo UX funnel |
| `plot_capture_completed` | Polygon saved | plot_id, point_count, area, offline_mode | Geo completion |
| `record_synced` | Mobile record reaches server | record_type, record_id, sync_latency | Offline reliability |
| `record_sync_failed` | Mobile sync fails | record_type, reason_code | Failure monitoring |
| `shipment_created` | Shipment opened | shipment_id, org_id | Core pipeline |
| `shipment_validation_run` | Rule engine executed | shipment_id, blocker_count, warning_count | Readiness funnel |
| `risk_screening_completed` | Risk engine returns result | subject_type, subject_id, risk_band, provider | Risk analytics |
| `issue_created` | Exception opened | issue_id, object_type, severity | Quality backlog |
| `thread_message_sent` | Chat message posted | thread_id, object_type, sender_role | Collaboration usage |
| `preflight_completed` | Filing pre-flight run | filing_package_id, pass_fail, blocker_count | Filing readiness |
| `filing_generated` | Payload created | filing_package_id, version | Submission prep |
| `filing_submitted` | Submission sent | filing_package_id, version, idempotency_key | Submission audit |
| `filing_response_received` | Middleware response received | filing_package_id, response_status | Submission outcomes |
| `filing_accepted` | Filing marked accepted | filing_package_id, external_ref | Success metric |
| `filing_failed` | Filing marked failed | filing_package_id, reason_code | Failure analysis |
| `audit_bundle_exported` | Export created | shipment_id, requester_role | Audit demand |
| `dashboard_viewed` | Dashboard opened | dashboard_type, tenant_type | Engagement |

### Derived funnels

- Supplier created -> supplier submitted -> supplier approved -> supplier active.
- Assignment created -> plot capture completed -> record synced -> plot verified.
- Shipment created -> validation run -> preflight completed -> filing submitted -> filing accepted.
- Issue created -> waiting on partner -> updated -> resolved.

### Operational alerts

Create alerting, not just analytics, for:
- repeated sync failures,
- risk provider outage,
- submission timeout rate spikes,
- high blocker aging,
- tenant permission errors above baseline.

***

## Acceptance pack

Acceptance criteria should be written per feature slice, not by engineering component.

Each criterion below is written so product, design, engineering, and QA can test the same thing.

### Identity and tenanting

- A user with access to multiple organizations can switch active organization without logging out.
- A user cannot access records from a different tenant unless explicitly permitted.
- Sponsor admins can view sponsored organizations in a rollup dashboard.
- Audit logs record user login, tenant switch, permission denial, and admin changes.

### Supplier onboarding

- Org Admin can create a supplier and send an onboarding request.
- Supplier User can save progress and return later.
- Required evidence checklist updates in real time as files and fields are added.
- Reviewer can approve, reject, or request changes with mandatory comment on rejection.
- Only active suppliers are selectable in shipment flows.

### Mobile field capture

- Field Agent can log in and receive assignments.
- Field Agent can create a farmer, farm, polygon, and photo set with no network.
- App clearly shows `saved locally`, `syncing`, and `synced` states.
- Invalid polygons cannot be submitted for review.
- After sync, web users can see submitted records without data loss.

### Plot review

- Reviewer can inspect polygon, metadata, and attached photos in one screen.
- Reviewer can approve or return a plot with reason.
- Returned plots become editable again for the assigned field user.
- Verified plots cannot be silently edited; changes start a new review cycle.

### Shipment dossier

- Org user can create a shipment and attach suppliers, source plots, and evidence.
- System calculates completeness and shows missing mandatory elements.
- Validation distinguishes blockers from warnings.
- Shipment cannot advance to approval while blockers remain open.

### Risk scoring

- User can trigger risk screening for a shipment or linked plot set.
- Returned score includes band, explanation, timestamp, and provider reference.
- High-risk or blocked results create a visible exception.
- Manual override requires authorized role plus mandatory rationale.

### Filing

- Authorized user can generate a filing package from an approved shipment.
- Pre-flight check must run before submission.
- Submission creates immutable log entries with package version and timestamp.
- Failed submissions show actionable response details.
- Accepted submissions store external reference and final status.

### Chat and issues

- Users can start a thread from shipment, issue, supplier, or plot records.
- Messages preserve author, time, and attachments.
- Thread status can be changed to waiting on partner or resolved.
- Resolution does not delete or alter message history.

### Sponsor oversight

- Sponsor Admin can see organization-level readiness, risk, and overdue issues.
- Sponsor Admin can filter by organization, country, commodity, and risk band.
- Sponsor Admin cannot edit tenant data unless delegated permissions exist.
- Sponsor remediation actions are logged.

### Audit and export

- Authorized users can export a shipment audit bundle containing evidence, approvals, issues, and submission history.
- Export includes current status and package version.
- Audit bundle respects tenant-level access controls.
- All exports are logged.

***

## QA scenarios

Use these as mandatory end-to-end release tests.

### Scenario 1

A field agent captures a farm offline, syncs later, reviewer approves, exporter links it to a shipment, compliance manager submits filing, and accepted status returns successfully.

### Scenario 2

A shipment fails pre-flight because one source plot is missing, the issue is routed upstream, evidence is fixed, validation is rerun, and the shipment proceeds to filing.

### Scenario 3

A risk screening returns high risk, reviewer requests more evidence, compliance manager overrides with rationale, and the override appears in the audit export.

### Scenario 4

A sponsor admin monitors two organizations, identifies one overdue org, drills in, assigns remediation, and tracks closure without improper cross-tenant editing.

### Scenario 5

A filing times out, the platform retries safely, prevents duplicate submission, and preserves complete submission history.

***

## Ownership model

| Artifact | Product | Design | Engineering | QA | Data |
|---|---:|---:|---:|---:|---:|
| Role matrix | A | C | C | C | I |
| JTBD matrix | A | C | I | I | I |
| Journey maps | A | A | C | C | I |
| State machines | A | C | A | C | I |
| Entitlement matrix | A | I | A | C | I |
| Error catalog | A | I | A | A | I |
| Event plan | A | I | C | I | A |
| Acceptance pack | A | C | C | A | I |

Legend: A = accountable, C = contributor, I = informed.

***

## Definition of done

This pack is complete when:
- every critical entity has an agreed state machine,
- every user-facing role has clear permissions,
- every top workflow has a mapped journey,
- every critical failure has a recovery path,
- every major funnel has events,
- every launch feature has testable acceptance criteria.

