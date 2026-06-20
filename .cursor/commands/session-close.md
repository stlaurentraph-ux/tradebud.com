# session-close

Update status docs before ending any agent session (all lanes).

## Start closeout (all lanes)

1. **`current-focus.md`** — resolve **In-flight** row (`done`, `blocked`, or `parked`); do not leave stale `in_progress`.
2. **`agent-queue.md`** — move slice **In progress → Done** (or back to Ready if abandoned); clear duplicate **In progress** rows.

## Lane-specific closeout

### Lane 1 — Guardrails

Skip canonical spec read-order unless product behavior changed.

- [ ] `agent-queue.md` — slice → **Done** (or back to Ready if abandoned); clear **In progress**
- [ ] `automation-ops-plan.md` §5 — update slice Status (`ready` → `done`)
- [ ] `current-focus.md` — clear automation In-flight row if used
- [ ] `daily-log.md` — slice ID, branch, commands added, next Ready slice
- [ ] `done-log.md` — if milestone (e.g. Bundle A complete)

### Lane 2 — Fix

- [ ] `daily-log.md` if user-visible behavior changed
- [ ] Regression guard/test added if bug class can recur
- [ ] Link Sentry issue in PR if applicable

### Lane 3 — Features

Read canonical docs if spec behavior changed:

1. `TRACEBUD_V1_2_EUDR_SPEC.md`
2. `REQUIREMENTS.md`
3. `MVP_PRD.md`
4. `PRODUCT_PRD.md`
5. `JTBD_PRD.md`
6. `BUILD_READINESS_ARTIFACTS.md`

- [ ] **In-flight** row → `done`, `blocked`, or `parked`
- [ ] FEAT doc acceptance criteria if slice completed
- [ ] `daily-log.md`, `done-log.md`, `current-focus.md` priorities

## All lanes

- [ ] `agent-queue.md` synced (no stale **In progress** >7 days)
- [ ] v1.6 validation noted if spatial / HLC / lineage / TRACES / GDPR touched
- [ ] ADR update if architecture decision changed

## Next agent hint

Append to `daily-log.md` **Next step:** the next Ready slice from active bundle (`agent-queue.md`) or next In-flight priority from `current-focus.md`.
