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
| `pull_request` | `Maestro Android APK assemble` (parallel) + `Maestro Android smoke (PR)` | `android-pr-smoke.yaml` |
| `push` / `workflow_dispatch` | assemble artifact + `Maestro golden path (Android)` | `settings-sync-smoke-android.yaml` |

Smoke job downloads the prebuilt APK (no Gradle in the 30m emulator cap). Assemble runs in a separate 45m job with Gradle cache.

### Thin boot (`EXPO_PUBLIC_MAESTRO_CI=1`)

`maestroCiBootProfile.ts` gates a faster emulator boot path:

- Skip `hydrateSyncAuthFromSettings` in `AppStateContext`
- Skip `refreshAuth` / welcome sheet in `SignInSheetContext`
- Defer `AutoPlotUploadBridge`, push, and consent bridges via `MaestroCiLayoutBridges`
- No-op `initObservability` session analytics

**PR smoke:** `MAESTRO_SKIP_BOOTSTRAP_WARM=1` + `stopApp: true` — single cold Maestro launch.  
**Full golden:** bootstrap warm + `stopApp: false` — reuse RN process (matches iOS).

### Boot-ready testID

| testID | When visible |
|--------|----------------|
| `maestro-boot-ready` | `isAppReady && !bootError` — CI builds skip welcome wait; retail also requires welcome dismissed |
| `maestro-boot-error` | `isAppReady && bootError` (CI builds only) — fail-fast anchor so Maestro flows don't wait 15+ min for `maestro-boot-ready` when SQLite/init throws |

Golden path flow waits on `maestro-boot-ready` before navigating tabs. Android CI renders a labeled `Text` node (UiAutomator visibility).

## How to change

1. Edit `maestro-boot-state.json` and `maestroBootStateRegistry.ts` together.
2. Update bootstrap / `generate-maestro-ci-boot-db.mjs` if seed script or profile env changes.
3. Update `.maestro/flows/settings-sync-smoke-android.yaml` if `flowTestIds` change.
4. Run `cd apps/offline-product && npm run qa:structural`.

## Guards

- `maestro-boot-state-guard.mjs` — JSON ↔ TS ↔ bootstrap ↔ flow ↔ app testID
- `maestro-golden-path-guard.mjs` — H25 workflow wiring (uses manifest `goldenPathBootProfile`)

## Android CI failure mode catalog (PR #318, H25)

Symptom → root cause → fix → guard mapping for recurring Android Maestro failures.

| ID | Symptom | Root cause | Fix | Guard |
|----|---------|------------|-----|-------|
| H1 | `HVF error: HV_UNSUPPORTED` / `Timeout waiting for emulator to boot` | `MAESTRO_ANDROID_ABI=arm64-v8a` on `macos-15-intel` — HVF cannot emulate arm64 on Intel | Switch to `x86_64` + `-gpu swiftshader_indirect` | Manifest `androidEmulator.emulatorArch: x86_64` + guard checks `arch: x86_64` |
| H2 | `assertNewArchitectureEnabledTask` failed — Reanimated/Worklets require New Arch | `android/gradle.properties` missing `newArchEnabled=true` | `app.json` sets `newArchEnabled: true`; assemble script upserts it in `gradle.properties` | Assemble script `upsert('newArchEnabled', 'true')` |
| H3 | `Missing assets/maestro/tracebud_offline.db in APK` | DB not copied to `android/app/src/main/assets/maestro/` before gradle assemble | Assemble script copies DB + preflight checks APK via `unzip -l` | Assemble script preflight |
| H4 | `Unable to resolve module ../../assets/maestro/tracebud_offline.db` (iOS) | `generate-maestro-ci-boot-db.mjs` not run before bundle | Generator runs in assemble before `expo export:embed` | Assemble script ordering |
| H5 | `adb run-as com.tracebud.app mkdir -p files/SQLite` failed | Legacy host-adb seed uses `run-as` which fails on CI emulator | `MAESTRO_ANDROID_IN_APP_DB_SEED=1` — DB bundled in APK, copied via `FileSystem.bundleDirectory` | Bootstrap defaults to in-app seed |
| H6 | Bootstrap warm-up timeout → 4h31m Maestro burn | No fail-fast; Maestro waited 45m for boot marker that never appeared | `MAESTRO_JS_BOOT_FAIL_FAST=1` + `MAESTRO_JS_BOOT_FAIL_FAST_MS` — bootstrap exits 1 on timeout | Bootstrap `wait_for_android_js_boot` fail-fast logic |
| H7 | `bash: apps/offline-product/scripts/...: No such file or directory` (exit 127) | `bash apps/offline-product/scripts/...` inside `working-directory: apps/offline-product` → doubled path | Use `bash scripts/...` (relative to working-directory) | `maestro-golden-path-guard.mjs` S1 doubled-path regex |
| H8 | `Failure [not installed for 0]` / `DELETE_FAILED_INTERNAL_ERROR` | Intermittent adb `pm uninstall`/`pm clear` on dirty emulator | Bootstrap uses `\|\| true` fallbacks | N/A — symptom, not root cause |
| H9 | `APK missing assets/maestro/tracebud_offline.db` (smoke) but assemble preflight passed | `actions/download-artifact@v4` with `merge-multiple:false` places APK in `maestro-android-apk/` subdirectory; bootstrap checked parent path | Set `merge-multiple: true` on download steps + bootstrap fallback to subdirectory | Download step `merge-multiple: true` + bootstrap `APK_SUBDIR` fallback |
| H10 | `APK missing assets/maestro/tracebud_offline.db` (smoke on macOS) but DB IS in APK (diagnostic shows it); also `Missing embedded JS bundle` (assemble on Ubuntu) but bundle IS in APK | `set -o pipefail` + `cmd \| grep -q` → `grep -q` exits early on match → upstream (`unzip` on macOS, `printf` on Ubuntu) gets SIGPIPE → pipefail returns rightmost non-zero → false "missing". OS-specific: BSD unzip exits 141; GNU printf errors "Broken pipe". A captured-variable + `printf \| grep -q` fix MOVED the SIGPIPE from unzip to printf (regression on 352b911e) | Use a here-string (`grep -qE '...' <<< "$APK_LIST"`) — a redirection, not a pipeline, so pipefail doesn't apply and there is no SIGPIPE | Bootstrap + assemble preflight use `grep -q ... <<< "$APK_LIST"` |
| H11 | Android smoke: `Assert that ".*Maestro boot ready.*" is visible... FAILED` after 15 min; logcat shows `[MaestroBoot] app state ready bootError=true` with NO error message | `AppStateContext` only logged boot errors when `__DEV__` is true; CI production builds silently swallow the error (Sentry disabled in CI) → marker stays hidden → Maestro waits full timeout with zero diagnostic | Always log boot error in Maestro CI builds (`EXPO_PUBLIC_MAESTRO_CI=1`); render `maestro-boot-error` testID marker when `bootError=true`; flows check boot-error with 30s timeout before long boot-ready wait | `AppStateContext` CI error logging + `MaestroBootReadyMarker` error branch + flow fail-fast `extendedWaitUntil` on `maestro-boot-error` |
| H12 | macOS golden path: `Scrolling DOWN until id: settings-cloud-parity-section is visible... FAILED` (15s timeout) after boot+settings tab succeeded | iOS 26 (macos-latest) taller layout + safe-area/font metrics push Backup card further below the fold; 15s scroll timeout insufficient on CI simulator | Bump `scrollUntilVisible` timeout 15s → 30s for `settings-cloud-parity-section` | `settings-sync-smoke.yaml` scroll timeout 30000 |
