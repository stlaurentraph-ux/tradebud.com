# Maestro boot state registry

Canonical **pre-flow app state** for Maestro CI. Prevents drift between binary install, SQLite seed, flow YAML, and testIDs.

**JSON baseline:** `apps/offline-product/qa/automation-baselines/maestro-boot-state.json`  
**Code mirror:** `apps/offline-product/features/testing/maestroBootStateRegistry.ts`  
**CI guard:** `maestro-boot-state-guard.mjs` (in `npm run qa:structural`)

## Why this exists

Maestro golden path failures clustered when:

- iOS installed a stale EAS artifact while Android built from the PR commit
- Bootstrap skipped full seed but flows still assumed English + dismissed welcome
- Guards checked YAML strings, not boot semantics
- Android emulator JS boot stalled on network auth, background bridges, and analytics

This registry is the single contract for **profile → settings → seed script → testIDs → build policy**.

## Profiles

| Profile | Use | Seed script | Build from commit |
|---------|-----|-------------|-------------------|
| `golden_path_minimal` | H25 golden path (`MAESTRO_SEED_SKIP=1`) | `seed-maestro-boot-profile.mjs` | **Yes** (both platforms) |
| `default` | Nightly plot/document flows | `seed-maestro-simulator.mjs` | No (EAS simulator OK) |

### `golden_path_minimal` settings

| Setting key | Value | Purpose |
|-------------|-------|---------|
| `tracebudAppLanguage` | `en` | Locale-safe Backup / Sync assertions |
| `account_welcome_dismissed` | `1` | Skip welcome sheet (matches `SignInSheetContext`) |

### iOS commit-built simulator

Debug+simulator Xcode builds skip JS bundling (`SKIP_BUNDLING=1` in Expo `.xcode.env`). CI assemble uses **Release** configuration and verifies `main.jsbundle` is embedded before Maestro runs.

Android `assembleDebug` also skips JS embed unless `debuggableVariants = []` is set in `app/build.gradle` after prebuild. CI verifies `assets/index.android.bundle` in the APK. **`MAESTRO_CI=1`** disables Expo Updates `ON_LOAD` checks in assembled binaries.

### Android emulator DB seed (in-app)

Default CI path (`MAESTRO_ANDROID_IN_APP_DB_SEED=1`):

1. `generate-maestro-ci-boot-db.mjs` applies `golden_path_minimal` settings at assemble time.
2. APK bundles `assets/maestro/tracebud_offline.db`.
3. `maestroCiBootDatabase.android.ts` copies from `android/app/src/main/assets/maestro/tracebud_offline.db` before `initDatabase()` when `EXPO_PUBLIC_MAESTRO_CI=1`.
4. Bootstrap **skips** host `adb` seed and warms JS only.

Legacy host seed (`MAESTRO_ANDROID_IN_APP_DB_SEED=0`) uses `seed-maestro-boot-profile.mjs` via `adb root` + `run-as cp` when needed.

### Android CI runner matrix

| Field | Value |
|-------|-------|
| Runner | `macos-15-intel` (nested HVF fails on ARM GHA) |
| Emulator arch | `x86_64` |
| GPU | `swiftshader_indirect` |

### PR vs full golden (Android)

| Trigger | Job | Flow |
|---------|-----|------|
| `pull_request` | `Maestro Android smoke (PR)` | `android-pr-smoke.yaml` (boot marker + `tab-settings`) |
| `push` / `workflow_dispatch` | `Maestro golden path (Android)` | `settings-sync-smoke-android.yaml` |

### Thin boot (`EXPO_PUBLIC_MAESTRO_CI=1`)

`maestroCiBootProfile.ts` gates a faster emulator boot path:

- Skip `hydrateSyncAuthFromSettings` in `AppStateContext`
- Skip `refreshAuth` / welcome sheet in `SignInSheetContext`
- Defer `AutoPlotUploadBridge`, push, and consent bridges via `MaestroCiLayoutBridges`
- No-op `initObservability` session analytics

### Boot-ready testID

| testID | When visible |
|--------|----------------|
| `maestro-boot-ready` | `isAppReady && !bootError` — CI builds skip welcome wait; retail also requires welcome dismissed |

Golden path flow waits on `maestro-boot-ready` before navigating tabs. Android CI renders a labeled `Text` node (UiAutomator visibility).

## How to change

1. Edit `maestro-boot-state.json` and `maestroBootStateRegistry.ts` together.
2. Update bootstrap / `generate-maestro-ci-boot-db.mjs` if seed script or profile env changes.
3. Update `.maestro/flows/settings-sync-smoke-android.yaml` if `flowTestIds` change.
4. Run `cd apps/offline-product && npm run qa:structural`.

## Guards

- `maestro-boot-state-guard.mjs` — JSON ↔ TS ↔ bootstrap ↔ flow ↔ app testID
- `maestro-golden-path-guard.mjs` — H25 workflow wiring (uses manifest `goldenPathBootProfile`)
