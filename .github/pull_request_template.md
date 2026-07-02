## Summary

<!-- What changed and why (1–3 sentences) -->

## Lane

<!-- Delete sections that do not apply -->

- [ ] **Lane 1 — Guardrails** — slice ID: `___` (e.g. `0.M.0`) — bundle: ___
- [ ] **Lane 2 — Fix** — `[fix]` regression only
- [ ] **Lane 3 — Feature** — app: `marketing` | `dashboard` | `offline` | `backend`

---

## Lane 1 — Guardrails (automation)

- **Slice ID:** `___` from `agent-queue.md`
- **Branch:** `chore/automation-___`
- **Paths touched:**

### Safety checklist

- [ ] One slice per PR; no unrelated product behavior
- [ ] Local proof = exact CI commands (`npm ci` from root first)
- [ ] No CI checks removed/weakened
- [ ] PR body notes `"enable required check after merge"` if new required check (human 0.H later)
- [ ] New secrets documented in `ci-secrets-and-fixtures.md` (not committed)
- [ ] `agent-queue.md` + `automation-ops-plan.md` tracker updated

### Verification

```bash
npm ci
# paste exact commands this slice adds:
```

- [ ] CI job(s) for this app green (human merges; agents do not merge)

---

## Lane 2 — Fix

- **Root cause:**
- **Paths touched:**

- [ ] Minimal fix (~200 lines max unless approved)
- [ ] Regression test or guard if bug class can recur
- [ ] `daily-log.md` if user-visible

---

## Lane 3 — Feature

- **In-flight ID:** IF-___ (`current-focus.md`)
- **Feature doc:** `product-os/02-features/FEAT-___.md`
- **Paths touched:**

### Quality gates

- [ ] Permissions explicit and role-scoped
- [ ] Canonical state transitions preserved
- [ ] Exception handling + recovery path
- [ ] Analytics events (or `// analytics-waiver:` with reason)
- [ ] Acceptance criteria updated in feature doc
- [ ] Field regression: `field-app-regression-ledger.md` row if bug class fix

### Structural contracts (offline sync / features)

- [ ] Registry updated if farmer artifact or sync path changed (`farmer-artifact-sync-registry.md` + `farmerArtifactRegistry.ts`)
- [ ] Restore wired via `restoreFarmerCloudState` (not screen-only patch)
- [ ] UI reload on affected screens (sync bus / focus restore)
- [ ] `npm run qa:structural` green (`qa:structural:ci` in CI)
- [ ] Cross-device step in `DEVICE_SMOKE_CHECKLIST.md` §12 when artifact is cross-device

### v1.6 (when relevant)

- [ ] GEOGRAPHY / ST_MakeValid / area variance
- [ ] HLC + idempotency (offline sync)
- [ ] O(1) lineage fields
- [ ] TRACES chunking
- [ ] GDPR shredding path

### Verification

<!-- Pick the app you touched -->

**offline:**

```bash
cd apps/offline-product
npm run qa:regression
npm run qa:structural
npm run qa:automation:phase1
```

**marketing:**

```bash
npm run lint -w tracebud-marketing
npm run build -w tracebud-marketing
```

**dashboard:**

```bash
npm run lint -w dashboard-product
npm test -w dashboard-product
```

**backend:**

```bash
npm run lint -w tracebud-backend
npm test -w tracebud-backend
```

- [ ] CI green for affected app(s)

### Offline automation phase

Phase 1: guard scripts in **report mode** unless this PR enables Phase 2 strict. See `offline-automation-runbook.md`.

---

## Parallel work note

<!-- Optional: "Safe to merge alongside feature/xxx on dashboard — different app" -->

### Maestro emulator E2E (offline — when paths trigger Offline Maestro)

- [ ] Cheap checks green first (`qa:maestro:prepush`, CI preflight)
- [ ] **Do not** add `maestro:run` label until you intend to spend Actions minutes
- [ ] After adding `maestro:run`: approve **`maestro-e2e`** environment in GitHub when prompted
- [ ] `maestro-ci-cost-runbook.md` § E2E approval gate followed
