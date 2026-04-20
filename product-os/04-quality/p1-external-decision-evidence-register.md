# P1 External Decision Evidence Register

## Purpose

Track verifiable source artifacts for each `P1` gate with owner, freshness, and verification status.

## Usage Rules

- Every `P1` gate must have at least one evidence row before it can be marked `decided`.
- Use immutable or versioned references where possible.
- If evidence expires or is superseded, add a new row and mark previous row as superseded.
- Verification status must be explicit (`pending`, `verified`, `superseded`).

## Evidence Table

| Gate ID | Evidence ID | Evidence type | Source location | Captured at (UTC) | Owner | Fresh-until (UTC) | Verification status | Notes |
|---|---|---|---|---|---|---|---|---|
| P1-01 | | cloud-region decision record | | | | | `pending` | |
| P1-02 | | TRACES endpoint confirmation | | | | | `pending` | |
| P1-03 | | mobile baseline sign-off | | | | | `pending` | |
| P1-04 | | GeoID access model source | | | | | `pending` | |
| P1-05 | | legal sign-off memo/reference | | | | | `pending` | |

## Verification Checklist (per decision cycle)

- [ ] Every gate with `decided` status has `verified` evidence.
- [ ] Source locations are resolvable by a reviewer.
- [ ] Freshness windows are valid for the current planning horizon.
- [ ] Superseded evidence rows are clearly marked.
