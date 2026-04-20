# P1 External Decision Gates One-Pass Update Block

## Purpose

Fill this once per P1 decision cycle, then paste aligned updates across the execution board and status logs without retyping.

Canonical flow reference:

- `product-os/04-quality/p1-external-decision-operator-runbook.md`

## Scope

This block covers:

- `P1-01` cloud provider + approved EU regions.
- `P1-02` TRACES NT sandbox/prod WSDL endpoints.
- `P1-03` mobile platform baseline.
- `P1-04` AgStack GeoID access model.
- `P1-05` legal sign-off for Section 4.3 interpretations.

## Step 1: Fill Once (single source of truth)

- Decision cycle date (UTC): `<YYYY-MM-DD>`
- Decision owner: `<OWNER>`
- Evidence register updated: `<yes|no>`
- Pending tracker updated: `<yes|no>`
- P1-01 status: `<pending|decided>`
- P1-01 decision note: `<CLOUD_PROVIDER + EU_REGIONS>`
- P1-01 evidence location: `<URL_OR_PATH>`
- P1-02 status: `<pending|decided>`
- P1-02 decision note: `<SANDBOX_URL + PROD_URL>`
- P1-02 evidence location: `<URL_OR_PATH>`
- P1-03 status: `<pending|decided>`
- P1-03 decision note: `<PLATFORM_BASELINE>`
- P1-03 evidence location: `<URL_OR_PATH>`
- P1-04 status: `<pending|decided>`
- P1-04 decision note: `<ACCESS_MODEL + DOC_SOURCE>`
- P1-04 evidence location: `<URL_OR_PATH>`
- P1-05 status: `<pending|decided>`
- P1-05 decision note: `<LEGAL_SIGNOFF_REF>`
- P1-05 evidence location: `<URL_OR_PATH>`
- Residual blockers: `<NONE_OR_LIST>`
- Next due date (UTC): `<YYYY-MM-DD>`

## Step 1.5: Evidence register sync (required)

Update `product-os/04-quality/p1-external-decision-evidence-register.md` in the same cycle:

- add/update one row per gate touched in this cycle;
- ensure any gate marked `decided` has `verification status = verified`;
- set `fresh-until` for each active evidence row;
- mark replaced rows as `superseded` instead of deleting history.

## Step 1.6: Pending tracker sync (required)

Update `product-os/04-quality/p1-pending-gate-tracker-board.md` in the same cycle:

- set owner + next SLA date for every `pending` gate;
- classify blockers using a stable blocker class;
- update escalation level based on cycle age/risk;
- add resolution note for any gate moved to `decided`.

## Step 2: Paste into execution board follow-up note

Use this line in the `P1` tracking context:

- P1 decision cycle `<YYYY-MM-DD>` by `<OWNER>`: `P1-01=<pending|decided>` (`<CLOUD_PROVIDER + EU_REGIONS>`), `P1-02=<pending|decided>` (`<SANDBOX_URL + PROD_URL>`), `P1-03=<pending|decided>` (`<PLATFORM_BASELINE>`), `P1-04=<pending|decided>` (`<ACCESS_MODEL + DOC_SOURCE>`), `P1-05=<pending|decided>` (`<LEGAL_SIGNOFF_REF>`); evidence register updated `<yes|no>`, pending tracker updated `<yes|no>`; blockers `<NONE_OR_LIST>`; next due `<YYYY-MM-DD>`.

## Step 3: Paste into `current-focus.md`

- P1 external decision gate cycle `<YYYY-MM-DD>` recorded: `P1-01 <pending|decided>`, `P1-02 <pending|decided>`, `P1-03 <pending|decided>`, `P1-04 <pending|decided>`, `P1-05 <pending|decided>`; evidence links captured, evidence register updated `<yes|no>`, pending tracker updated `<yes|no>`, and next due date set to `<YYYY-MM-DD>`.

## Step 4: Paste into `daily-log.md`

### `<YYYY-MM-DD>` (execution: P1 external decision gate cycle)
- Focus: run one-pass decision capture across all P1 external gates.
- Files changed: `product-os/04-quality/p1-external-decision-one-pass-update-block.md`, `product-os/04-quality/p1-external-decision-evidence-register.md`, `product-os/04-quality/p1-pending-gate-tracker-board.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md` (and any decision source docs updated this cycle).
- Decisions: `P1-01=<pending|decided>`, `P1-02=<pending|decided>`, `P1-03=<pending|decided>`, `P1-04=<pending|decided>`, `P1-05=<pending|decided>` with evidence locations captured, evidence register sync `<yes|no>`, and pending tracker sync `<yes|no>`.
- Risks: unresolved P1 items continue to block dependent P2/P3 drafting quality.
- Blockers: `<NONE_OR_LIST>`.
- Next step: close remaining `pending` P1 gates before the next spec hardening cycle.

## Step 5: Publish cycle snapshot (leadership rollup)

Execute:

- `product-os/04-quality/p1-cycle-snapshot-template.md`

Then paste/adapt the 3-line leadership summary into:

- `product-os/06-status/current-focus.md`
- `product-os/06-status/daily-log.md`

## Step 6: Append decision-history ledger row

Execute:

- `product-os/04-quality/p1-decision-history-ledger.md`

Required:

- append one cycle row with `decided/pending/at-risk/overdue` counts;
- record net deltas versus prior cycle;
- capture primary blocker theme and snapshot/evidence reference.

## Step 7: Publish weekly summary block

Execute:

- `product-os/04-quality/p1-weekly-summary-block-template.md`

Required:

- fill summary fields from latest snapshot + ledger rows only;
- publish the paste-ready weekly block in status logs without free-form metric rewrites.

## Step 8: Run cycle-close reconciliation

Execute:

- `product-os/04-quality/p1-cycle-close-checklist.md`

Required:

- mark cycle status `passed` only when all reconciliation checks pass;
- if failed, assign corrective owner/due date and do not mark cycle closed.
