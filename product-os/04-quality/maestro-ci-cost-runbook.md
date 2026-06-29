# Maestro CI cost runbook (H25)

**Goal:** Catch Maestro regressions locally (free) before burning GitHub Actions macOS/Android minutes.

**Canonical manifest:** `maestro-golden-path-ci.json` → `costGate`, `prepushScript`

---

## Cost pyramid

| Tier | Command | When | Billed minutes |
|------|---------|------|----------------|
| 1 — static | `npm run qa:maestro:preflight` | Every Maestro touch | 0 (local) / ~1 min (Linux CI) |
| 2 — regression | `npm run qa:regression` | Every offline PR | 0 local / Linux CI |
| 3 — local iOS E2E | `npm run qa:maestro:prepush:full` | **Before push** (macOS) | 0 |
| 4 — GitHub Android | PR workflow (cost-gated) | After push | Linux ~2h |
| 5 — GitHub macOS | PR workflow (cost-gated) | First green or iOS delta | **macOS ~10× multiplier** |

---

## Mandatory rule (humans + agents)

**Do not push Maestro / golden-path changes until prepush passes.**

```bash
cd apps/offline-product

# Always (any OS, ~2 min):
npm run qa:maestro:prepush

# Before push on macOS (~15–30 min):
npm run qa:maestro:prepush:full
```

Android-only iteration: run static prepush always; run `npm run qa:maestro:golden-path:android` locally when possible; GitHub skips macOS if already green on the PR (cost gate).

---

## GitHub workflow behavior

Workflow: `.github/workflows/offline-maestro.yml`

| Mechanism | Purpose |
|-----------|---------|
| `concurrency` + `cancel-in-progress` | Cancel superseded runs on new pushes |
| `maestro-cost-gate` job | Skip macOS when PR iOS already green + android-only delta |
| `workflow_dispatch` | Force full matrix when needed before merge |
| Push to `main` | Always runs both platforms (release gate) |

---

## Merge criteria (PR)

- iOS golden path green on **some** commit on the PR (may be skipped on later android-only pushes)
- Android golden path green on **latest** commit
- Or: manual `workflow_dispatch` with both green on same run

---

## Agent checklist (Lane 1 / Maestro slices)

1. Edit flows, boot marker, or CI scripts
2. `npm run qa:maestro:prepush` (minimum before push)
3. On macOS agent: `npm run qa:maestro:prepush:full` when changing E2E behavior
4. Push once — avoid retry loops on GitHub
5. Do not merge until both platforms green per criteria above

---

## Billing hygiene

- Check **GitHub → Settings → Billing → Actions** monthly
- Prefer local `prepush:full` over repeated PR pushes
- Use `gh run list --workflow=offline-maestro.yml` to see run count
