# P0-02 Memo-Received One-Pass Closeout Block

## Purpose

Fill this once when signed counsel memo is received, then paste outputs across intake/scaffold/status artifacts in one deterministic pass.

## Step 1: Fill Once (single source of truth)

- Memo received date/time (UTC): `<YYYY-MM-DDTHH:MM:SSZ>`
- Memo calendar date (UTC): `<YYYY-MM-DD>`
- Memo ID/reference: `<MEMO_ID>`
- Counsel name: `<COUNSEL_NAME>`
- Counsel firm: `<COUNSEL_FIRM>`
- Signature date: `<YYYY-MM-DD>`
- Memo version: `<VERSION>`
- Memo file/link: `<FILE_OR_URL>`
- Closure owner: `<OWNER>`
- Execution board reference note: `<P0-02 completion note text>`

## Step 2: Paste into `p0-02-counsel-response-tracker.md`

### Memo Receipt Record block

- Memo received date/time (UTC): `<YYYY-MM-DDTHH:MM:SSZ>`
- Memo ID/reference: `<MEMO_ID>`
- Signed by: `<COUNSEL_NAME>, <COUNSEL_FIRM>`
- Signature date: `<YYYY-MM-DD>`
- File/link: `<FILE_OR_URL>`

### Follow-Up Log closing row

| Date (UTC) | Action | Channel | Outcome | Next action date | Owner |
|---|---|---|---|---|---|
| `<YYYY-MM-DD>` | `memo_received` | `email` | `received_signed_memo_<MEMO_ID>` | `n/a` | `<OWNER>` |

## Step 3: Paste into `p0-02-counsel-memo-intake-template.md`

### Memo Metadata block

- Memo ID: `<MEMO_ID>`
- Counsel name: `<COUNSEL_NAME>`
- Counsel firm: `<COUNSEL_FIRM>`
- Signature date: `<YYYY-MM-DD>`
- Version: `<VERSION>`
- Document link/location: `<FILE_OR_URL>`

### Closeout Record block

- P0-02 closure date: `<YYYY-MM-DD>`
- Closed by: `<OWNER>`
- Linked status update entry: `daily-log <YYYY-MM-DD> / execution: P0-02 memo closeout`

## Step 4: Paste into `p0-02-legal-spec-delta-patch-scaffold.md`

### Traceability Record block

- Counsel memo ID: `<MEMO_ID>`
- Spec patch date: `<YYYY-MM-DD>`
- Updated sections: `<LIST_SECTIONS>`
- Status-log entry link/reference: `daily-log <YYYY-MM-DD> / P0-02 memo closeout`

## Step 5: Paste into status logs

### `current-focus.md` line

- P0-02 legal memo gate closed: signed memo `<MEMO_ID>` (dated `<YYYY-MM-DD>`, counsel `<COUNSEL_NAME>`) received and intake/spec-delta/closeout artifacts executed with status logs updated.

### `done-log.md` line

- P0-02 legal gate closure delivered: signed counsel memo `<MEMO_ID>` (signature date `<YYYY-MM-DD>`) was received, legal decisions were mapped to spec deltas, and execution/status artifacts were reconciled.

### `daily-log.md` entry

### `<YYYY-MM-DD>` (execution: P0-02 memo closeout)
- Focus: close P0-02 after signed counsel memo receipt and reconcile legal outputs into canonical spec/status artifacts.
- Files changed: `product-os/04-quality/p0-02-counsel-response-tracker.md`, `product-os/04-quality/p0-02-counsel-memo-intake-template.md`, `product-os/04-quality/p0-02-legal-spec-delta-patch-scaffold.md`, `product-os/04-quality/p0-02-closeout-checklist.md`, `product-os/01-roadmap/v1-6-spec-execution-board.md`, `product-os/06-status/current-focus.md`, `product-os/06-status/done-log.md`, `product-os/06-status/daily-log.md`.
- Decisions: memo `<MEMO_ID>` received and intake completed; required legal wording deltas were applied and P0-02 marked complete on execution board.
- Risks: none outstanding for P0-02 once all legal conditions are represented in spec language.
- Blockers: none.
- Next step: continue remaining roadmap gates (P0-03 then P1 externals).
