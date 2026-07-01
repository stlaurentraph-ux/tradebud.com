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
| 3b — local Android | `npm run qa:maestro:local:android` | Booted emulator (free) | 0 |
| 3c — local Android golden | `npm run qa:maestro:local:android:golden` | Before `main` merge / dispatch proof | 0 |
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

Android-only iteration: run static prepush always; run `npm run qa:maestro:local:android` (smoke) or `npm run qa:maestro:local:android:golden` (full path) on a booted emulator before pushing; GitHub skips macOS if already green on the PR (cost gate).

### Local Android (no Maestro Cloud, no GitHub minutes)

```bash
cd apps/offline-product

# One-time: install Maestro CLI + Android SDK; create a Pixel API 33 AVD in Android Studio.

# PR smoke (~20–40 min, matches CI smoke job):
npm run qa:maestro:local:android

# Full golden path (~45–75 min, matches push/dispatch golden job):
npm run qa:maestro:local:android:golden

# Auto-start emulator when none is booted:
MAESTRO_LOCAL_BOOT_EMULATOR=1 npm run qa:maestro:local:android

# Apple Silicon: uses arm64-v8a by default; CI uses x86_64 on macos-15-intel.
# Force CI ABI locally: MAESTRO_ANDROID_ABI=x86_64 npm run qa:maestro:local:android
```

Before merging to `main`, prefer `MAESTRO_PREPUSH_ANDROID_GOLDEN=1 npm run qa:maestro:prepush:full` on macOS with a booted emulator.

---

## GitHub workflow behavior

Workflow: `.github/workflows/offline-maestro.yml`

| Mechanism | Purpose |
|-----------|---------|
| `concurrency` + `cancel-in-progress` | Cancel superseded runs on new pushes |
| `maestro-cost-gate` job | Skip macOS when PR iOS already green + android-only delta |
| `workflow_dispatch` | Force full matrix when needed before merge |
| Push to `main` | Always runs both platforms (release gate) unless `e2eBypass.enabled` |

---

## Pilot E2E bypass (temporary)

When `maestro-golden-path-ci.json` → `e2eBypass.enabled` is `true`:

| Still runs | Skipped |
|------------|---------|
| `Maestro wiring preflight` (static guards, ~1 min Linux) | macOS golden path |
| `Maestro E2E bypass (pilot)` notice job | Android assemble + smoke + golden |
| Main `ci.yml` offline structural guards | Emulator minutes |

**Re-enable E2E:** set `e2eBypass.enabled` to `false` after Android smoke is green on PR.

**Force E2E on one run:** GitHub Actions → Offline Maestro → Run workflow → check `force_e2e`.

**Expiry:** `e2eBypass.allowedUntil` auto-disables bypass after that date (gate script ignores expired bypass).

Pilot builds use EAS `preview` profile (`distribution: internal`) — independent of Maestro CI.

---

## Merge criteria (PR)

When **e2eBypass is active:** preflight + bypass notice green is sufficient to merge Maestro-related changes.

When **e2eBypass is off:**

- iOS golden path green on **some** commit on the PR (may be skipped on later android-only pushes)
- Android **smoke** green on **latest** commit (`Maestro Android smoke (PR)`)
- Full Android golden path green on **push to main** or `workflow_dispatch` with `run_golden_path`
- Or: manual `workflow_dispatch` with both platforms green on same run

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

---

## CI noise reduction (path filters)

| Change | Effect |
|--------|--------|
| **Founder OS** path-filtered | No longer runs on every PR push |
| **Contracts** no longer uses blanket `product-os/**` | Maestro doc edits skip OpenAPI contract job |
| **Offline filter** includes `product-os/04-quality/maestro-*` | Maestro manifest edits still run Expo CI |
| **field-auth / marketing** job-level `if:` | Skipped jobs don't spin runners |
| **Uptime probes** every **6h** (was 30 min) | ~48 runs/day → 4 runs/day |
| **Deploy smokes** concurrency | Duplicate production webhooks collapse |

Guard: `npm run ci:path-filter:assert`
