# P0-02 Legal Spec Delta Patch Scaffold

## Purpose

Pre-stage legal-sensitive spec sections so signed counsel memo outcomes can be applied quickly and traceably.

## How To Use

1. Complete `product-os/04-quality/p0-02-counsel-memo-intake-template.md` with signed memo outcomes.
2. For each approved-with-conditions or not-approved finding, fill one row in the patch table below.
3. Apply wording changes in `TRACEBUD_V1_2_EUDR_SPEC.md`.
4. Record commit/log references in status docs and close `P0-02` gate.

## Pre-Labeled Legal-Sensitive Sections (from canonical spec)

- `TRACEBUD_V1_2_EUDR_SPEC.md` Section 29 (data residency and cryptographic shredding)
- `TRACEBUD_V1_2_EUDR_SPEC.md` Section 22 (simplified declaration flow constraints)
- `TRACEBUD_V1_2_EUDR_SPEC.md` Section 23 (downstream/trader workflow obligations)
- `TRACEBUD_V1_2_EUDR_SPEC.md` Section 45.4 (liability boundary statement)

## Spec Delta Patch Table

| Memo finding ID | Spec section | Existing text summary | Required legal text | Change type (`replace`/`add`/`remove`) | Owner | Status |
|---|---|---|---|---|---|---|
| | | | | | | |

## Patch Acceptance Checklist

- [ ] Every legal condition in intake template has a matching row in patch table.
- [ ] All edited sections include explicit legal qualifiers where required.
- [ ] No legal-sensitive claims remain without memo-backed wording.
- [ ] `current-focus.md` and `daily-log.md` include memo ID and patch completion note.
- [ ] `v1-6-spec-execution-board.md` P0-02 moved to complete.

## Traceability Record

- Counsel memo ID:
- Spec patch date:
- Updated sections:
- Status-log entry link/reference:

## One-Pass Closeout Runbook

For closure sequencing and required status artifacts, execute:

- `product-os/04-quality/p0-02-closeout-checklist.md`

