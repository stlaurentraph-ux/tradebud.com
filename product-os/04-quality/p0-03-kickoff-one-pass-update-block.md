# P0-03 Kickoff One-Pass Update Block

## Purpose

Fill this once when pilot kickoff is confirmed, then paste outputs across pilot evidence and status logs without retyping.

## Step 1: Fill Once (single source of truth)

- Kickoff date/time (UTC): `<YYYY-MM-DDTHH:MM:SSZ>`
- Kickoff calendar date (UTC): `<YYYY-MM-DD>`
- Pilot start date (UTC): `<YYYY-MM-DD>`
- Planned end date (UTC): `<YYYY-MM-DD>`
- Tier 2 cooperative: `<COOPERATIVE_NAME>`
- Tier 3 buyer: `<BUYER_NAME>`
- Planned farmer count: `<N>=20`
- Pilot owner: `<OWNER>`
- Operations owner: `<OWNER>`
- Data/analytics owner: `<OWNER>`

## Step 2: Paste into `p0-03-pilot-kickoff-checklist.md`

### Kickoff Record block

- Pilot start date (UTC): `<YYYY-MM-DD>`
- Planned end date (UTC): `<YYYY-MM-DD>`
- Tier 2 cooperative: `<COOPERATIVE_NAME>`
- Tier 3 buyer: `<BUYER_NAME>`
- Planned farmer count: `<N>=20`
- Kickoff approved by: `<OWNER>`

## Step 3: Paste into `p0-03-pilot-evidence-log.md`

### Pilot Metadata block

- Pilot status: `active`
- Pilot start date (UTC): `<YYYY-MM-DD>`
- Pilot planned end date (UTC): `<YYYY-MM-DD>`
- Tier 2 cooperative: `<COOPERATIVE_NAME>`
- Tier 3 buyer: `<BUYER_NAME>`
- Pilot owner: `<OWNER>`

### Weekly Checkpoint first row

| Week ending (UTC) | Active farmers | Batches completed | Buyer interactions | Risks/blockers | Actions |
|---|---:|---:|---:|---|---|
| `<YYYY-MM-DD>` | `<N>` | `0` | `0` | `kickoff_complete` | `start weekly cadence` |

## Step 4: Paste into status logs

### `current-focus.md` line

- P0-03 pilot kickoff is active (`<YYYY-MM-DD>` to `<YYYY-MM-DD>`) with Tier 2 cooperative `<COOPERATIVE_NAME>`, Tier 3 buyer `<BUYER_NAME>`, and planned farmer cohort `<N>=20`; evidence log initialized.

### `daily-log.md` entry

### `<YYYY-MM-DD>` (execution: P0-03 pilot kickoff confirmed)
- Focus: start P0-03 pilot execution with real partner commitments and weekly evidence cadence.
- Files changed: `product-os/04-quality/p0-03-pilot-kickoff-checklist.md`, `product-os/04-quality/p0-03-pilot-evidence-log.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/daily-log.md`.
- Decisions: kickoff confirmed with Tier 2 cooperative `<COOPERATIVE_NAME>` and Tier 3 buyer `<BUYER_NAME>`; pilot window set to `<YYYY-MM-DD>` through `<YYYY-MM-DD>`; weekly checkpoint cadence initiated.
- Risks: pilot outcomes remain dependent on sustained participant engagement and workflow adherence through full 3-month window.
- Blockers: none at kickoff.
- Next step: run week-1 checkpoint and update acceptance evidence counters.
