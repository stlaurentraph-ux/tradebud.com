# P0-03 Closeout One-Pass Update Block

## Purpose

Fill this once at pilot completion, then paste closeout updates across evidence, execution board, and status logs in one pass.

## Step 1: Fill Once (single source of truth)

- Closeout date/time (UTC): `<YYYY-MM-DDTHH:MM:SSZ>`
- Closeout calendar date (UTC): `<YYYY-MM-DD>`
- Pilot report location: `<URL_OR_PATH>`
- Tier 2 cooperative: `<COOPERATIVE_NAME>`
- Tier 3 buyer: `<BUYER_NAME>`
- Final active farmers: `<N>`
- Final completed batches: `<N>`
- Final buyer interactions: `<N>`
- P0-03 closure decision: `<closed|partially_closed_with_followups>`
- Closed by: `<OWNER>`
- Spec delta summary note: `<SHORT_NOTE>`

## Step 2: Paste into `p0-03-pilot-evidence-log.md`

### Board Acceptance Evidence final values

| Requirement | Evidence source | Current value | Status |
|---|---|---|---|
| Tier 2 cooperative active | kickoff record / signed confirmation | `<COOPERATIVE_NAME>` | `met` |
| Farmer participation (`>=20`) | participant roster + activity logs | `<N>` | `<met|pending>` |
| Completed batch (`>=1`) | batch workflow evidence | `<N>` | `<met|pending>` |
| Tier 3 buyer participation | buyer workflow evidence | `<BUYER_NAME>` | `<met|pending>` |

### Closeout Record block

- Pilot report location: `<URL_OR_PATH>`
- `P0-03` closure decision: `<closed|partially_closed_with_followups>`
- Closure date (UTC): `<YYYY-MM-DD>`
- Closed by: `<OWNER>`

## Step 3: Paste into execution board

Update `product-os/01-roadmap/v1-6-spec-execution-board.md` row `P0-03` done-state note with:

- Pilot report `<URL_OR_PATH>` delivered on `<YYYY-MM-DD>`, final counters: farmers `<N>`, batches `<N>`, buyer interactions `<N>`, spec deltas `<SHORT_NOTE>`.

## Step 4: Paste into status logs

### `current-focus.md` line

- P0-03 pilot gate closed on `<YYYY-MM-DD>` with report `<URL_OR_PATH>`; final counters farmers `<N>`, batches `<N>`, buyer interactions `<N>`, and spec-delta follow-up `<SHORT_NOTE>`.

### `done-log.md` line

- P0-03 pilot gate closure delivered: 3-month pilot completed with Tier 2 cooperative `<COOPERATIVE_NAME>` and Tier 3 buyer `<BUYER_NAME>`, report `<URL_OR_PATH>`, and closure metrics farmers `<N>`, batches `<N>`, buyer interactions `<N>`.

### `daily-log.md` entry

### `<YYYY-MM-DD>` (execution: P0-03 pilot closeout)
- Focus: close P0-03 with final evidence reconciliation and status-board alignment.
- Files changed: `product-os/04-quality/p0-03-pilot-evidence-log.md`, `product-os/01-roadmap/v1-6-spec-execution-board.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: pilot report `<URL_OR_PATH>` recorded; final counters farmers `<N>`, batches `<N>`, buyer interactions `<N>`; closure decision `<closed|partially_closed_with_followups>`.
- Risks: any unmet acceptance metric remains explicitly tracked with owner and due date if partial closure is used.
- Blockers: none (or list residual blockers if partial closure).
- Next step: execute post-pilot spec delta application and confirm follow-up owners/dates.
