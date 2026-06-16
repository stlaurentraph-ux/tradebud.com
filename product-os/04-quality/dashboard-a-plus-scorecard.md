# Dashboard A+ Scorecard

Last updated: 2026-06-16  
Canonical refs: `FEAT-008-dashboards.md`, `acceptance-criteria.md`, `JTBD_PRD.md`, quality gates in `.cursor/rules/quality-gates.mdc`

## Purpose

Grade **A** = English copy is centralized and main operator flows use locale helpers.  
Grade **A+** = each role dashboard is **shippable as a product slice** — copy, IA, UI, states, permissions, analytics, and JTBD outcomes together.

Score each role **0–2** per pillar (`0` missing, `1` partial, `2` done). **A+ = ≥16/18** per role with no pillar at `0` on critical-path items marked ★.

---

## Pillars (all roles)

| # | Pillar | What “2” looks like |
|---|--------|---------------------|
| 1 | **Copy & terminology** | All operator-visible strings via helpers; `en.json` parity for role surfaces; aria/toasts/errors included |
| 2 | **Information architecture** | Nav matches JTBD; no dead or misleading destinations; breadcrumbs/titles role-aware |
| 3 | **Overview / north star** ★ | Landing answers “what needs attention today?” in &lt;30s with correct KPIs for role |
| 4 | **Virgin → first value** ★ | Empty workspace guides to first successful record without hunting |
| 5 | **Mature daily use** ★ | Repeat workflows (campaign, seal, declare, govern) are ≤3 clicks from overview |
| 6 | **States & recovery** | Loading, empty, error, partial, permission-denied — designed with retry/next step |
| 7 | **Permissions & safety** | Actions hidden or disabled with explanation; no silent RBAC failures |
| 8 | **UI polish** | Responsive layout, consistent density, accessible contrast/focus on primary flows |
| 9 | **Analytics & audit** | Funnel events on onboarding + first-value milestones per role |

---

## Exporter dashboard

**JTBD:** Aggregate upstream inputs, validate lineage, seal shipment-ready packages for importer handoff.

| Pillar | Score | Evidence / gap |
|--------|-------|----------------|
| Copy | 2 | Workflow helpers + virgin/onboarding wired |
| IA | 2 | Producers → plots → harvests → packages → compliance/issues |
| Overview ★ | 2 | North star prioritizes blockers/yield before seal; KPI strip surfaces readiness counts |
| Virgin ★ | 2 | Virgin-state panel + tour (`exp_*` steps) |
| Daily use ★ | 1 | Seal path exists; issues board integration needs real-tenant QA |
| States | 2 | AsyncState wired on plot panels; deforestation decision panel localized |
| Permissions | 2 | Nav/step gates via RBAC |
| UI | 1 | Table density / mobile pass incomplete |
| Analytics | 1 | Onboarding events; seal milestone events partial |

**Critical path acceptance ★**

- [ ] Register producer → plot → batch → shipment with lineage intact
- [ ] Readiness blockers visible before seal attempt
- [ ] Importer-handoff language consistent on packages/compliance

---

## Importer dashboard

**JTBD:** Validate upstream data, run campaigns, review shared shipments, declare with evidence retained.

| Pillar | Score | Evidence / gap |
|--------|-------|----------------|
| Copy | 2 | Importer-specific shipment/compliance language in helpers |
| IA | 2 | Network → campaigns → requests → shipments → compliance → reporting |
| Overview ★ | 1 | Shared-scope summary; attention strip role-aware |
| Virgin ★ | 2 | Virgin panel + `imp_*` tour |
| Daily use ★ | 2 | Inbox fulfill, shared tab default, campaign timeline |
| States | 1 | Inbox/campaign errors mostly handled |
| Permissions | 2 | `fpic:view` gates evidence step |
| UI | 1 | Campaign wizard dense on small screens |
| Analytics | 1 | Campaign/inbox events partial |

**Critical path acceptance ★**

- [ ] Add contact → launch campaign → fulfill inbound request
- [ ] Review shared shipment readiness before declaration framing
- [ ] Reporting snapshot reachable from overview CTA

---

## Cooperative dashboard

**JTBD:** Onboard members, run field ops, aggregate lots, govern cooperative handoff.

| Pillar | Score | Evidence / gap |
|--------|-------|----------------|
| Copy | 2 | Member vs producer language in consent/producers helpers |
| IA | 2 | Members, field ops, harvests, governance |
| Overview ★ | 1 | Cooperative aggregates wired; governance alerts TBD |
| Virgin ★ | 2 | Virgin panel + `coop_*` tour |
| Daily use ★ | 1 | Field-operations queue needs field QA |
| States | 1 | Member consent pending states OK; sync errors uneven |
| Permissions | 2 | Cooperative role mix in settings |
| UI | 1 | Member directory filters need polish |
| Analytics | 1 | Onboarding only |

**Critical path acceptance ★**

- [ ] Add member with consent → register plot → field campaign
- [ ] Governance panel surfaces premium/portability actions

---

## Sponsor dashboard

**JTBD:** Govern network health, programmes, delegated scope, cross-network compliance visibility.

| Pillar | Score | Evidence / gap |
|--------|-------|----------------|
| Copy | 2 | `getSponsorPanelCopy` + sponsor onboarding steps |
| IA | 2 | Organisations, programmes, compliance health, reporting |
| Overview ★ | 2 | Sponsor dashboard + north-star panels |
| Virgin ★ | 2 | Virgin panel + `sp_*` tour |
| Daily use ★ | 1 | Programme launch + org mapping need pilot QA |
| States | 1 | Network empty states OK |
| Permissions | 2 | Sponsor view country/brand toggle |
| UI | 2 | Hero/coverage/transparency panels shipped |
| Analytics | 1 | Programme/campaign events partial |

**Critical path acceptance ★**

- [ ] Invite/classify contact → register org → launch programme
- [ ] Compliance health shows escalation clusters
- [ ] Welcome modal shows sponsor role card (fixed in A+ slice)

---

## Country reviewer dashboard

**JTBD:** Review jurisdiction queue, inspect DDS packages, clear role classification holds.

| Pillar | Score | Evidence / gap |
|--------|-------|----------------|
| Copy | 1 | Shares importer onboarding persona; reviewer labels partial |
| IA | 1 | Queue + packages; reviewer-specific nav thinner |
| Overview ★ | 1 | Reviewer dashboard exists; queue-empty messaging basic |
| Virgin ★ | 2 | Virgin panel with queue entry points |
| Daily use ★ | 1 | Role-decisions path wired; queue volume untested |
| States | 1 | Queue empty state OK |
| Permissions | 2 | Reviewer role scoped |
| UI | 1 | Package review density |
| Analytics | 0 | No reviewer funnel events |

**Critical path acceptance ★**

- [ ] Open compliance queue when items arrive
- [ ] Resolve manual classification before downstream submit

---

## Cross-cutting lanes (not role-specific)

| Lane | A | A+ target | Owner |
|------|---|-----------|-------|
| App shell aria | partial | breadcrumb, nav, mobile menu via `getAppChromeCopy` | dashboard |
| `en.json` parity CI | 220 keys | full helper manifest | dashboard |
| Founder OS | hardcoded | `getFounderOsCopy` | internal |
| Auth confirm / request intent | wired | `getAuthCopy` confirm keys + `getRequestIntentCopy` loading UX | done |
| Auth mobile callback | n/a | route not present in app | — |
| Flaky page tests | failing | green CI | dashboard |

---

## How to use this scorecard

1. Pick one role (recommend **exporter** or **importer** for next pilot).
2. Run critical-path acceptance manually on a real tenant (not demo-only).
3. Update scores in this file and link evidence in `product-os/06-status/daily-log.md`.
4. Do not mark **A+** until all ★ items pass and no pillar is `0`.

## Related docs

- Feature: `product-os/02-features/FEAT-008-dashboards.md`
- QA scenarios: `product-os/04-quality/qa-scenarios.md`
- EN copy manifest: `apps/dashboard-product/lib/workflow-copy-manifest.ts`
- Parity test: `apps/dashboard-product/lib/en-copy-parity.test.ts`
