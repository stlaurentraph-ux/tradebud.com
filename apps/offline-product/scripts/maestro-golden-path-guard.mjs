#!/usr/bin/env node
/**
 * Guardrail H25 — Maestro golden path on PR + Android emulator lane.
 *
 * Run: npm run qa:maestro:golden-path:assert
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.join(root, '../..');

function readRepo(relativePath) {
  const fullPath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing required file: ${relativePath}`);
  }
  return fs.readFileSync(fullPath, 'utf8');
}

function readOffline(relativePath) {
  const fullPath = path.join(root, relativePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing required file: apps/offline-product/${relativePath}`);
  }
  return fs.readFileSync(fullPath, 'utf8');
}

function loadManifest() {
  try {
    return JSON.parse(readRepo('product-os/04-quality/maestro-golden-path-ci.json'));
  } catch (error) {
    throw new Error(`Invalid maestro-golden-path-ci.json: ${error.message}`);
  }
}

function assertManifestShape(manifest) {
  if (manifest.schemaVersion !== 1 || manifest.slice !== 'H25') {
    throw new Error('manifest must be schemaVersion 1 slice H25');
  }
  if (!manifest.workflowFile || !manifest.goldenPathFlow || !manifest.goldenPathFlowAndroid) {
    throw new Error('manifest must define workflowFile, goldenPathFlow, and goldenPathFlowAndroid');
  }
  if (!manifest.goldenPathBootProfile) {
    throw new Error('manifest must define goldenPathBootProfile');
  }
  if (!manifest.ciTriggers?.includes('pull_request')) {
    throw new Error('manifest must include pull_request trigger for golden path');
  }
}

function assertAndroidSmokeFlow(manifest) {
  const flowName = manifest.goldenPathFlowAndroidSmoke;
  if (!flowName) {
    throw new Error('manifest must define goldenPathFlowAndroidSmoke');
  }
  const flow = readOffline(`.maestro/flows/${flowName}`);
  const smokeWaitMs = manifest.androidSmokeBootWaitMs;
  if (!smokeWaitMs || smokeWaitMs < 900000) {
    throw new Error('manifest androidSmokeBootWaitMs must be >= 900000');
  }
  if (!flow.includes(String(smokeWaitMs))) {
    throw new Error(`${flowName} boot timeout must match manifest androidSmokeBootWaitMs`);
  }
  if (!flow.includes('id: "maestro-boot-ready"')) {
    throw new Error(`${flowName} must wait for maestro-boot-ready testID`);
  }
  if (!flow.includes('id: "tab-settings"')) {
    throw new Error(`${flowName} must wait for tab-settings (smoke gate)`);
  }
  if (flow.includes('settings-sync-now')) {
    throw new Error(`${flowName} must not tap settings-sync-now (smoke only)`);
  }
  if (!flow.includes('clearState: false')) {
    throw new Error(`${flowName} must launchApp with clearState: false`);
  }
  if (!flow.includes('stopApp: true')) {
    throw new Error(`${flowName} must launchApp with stopApp: true (smoke cold start on CI emulator)`);
  }
}

function assertAndroidGoldenPathFlow(manifest) {
  const flowName = manifest.goldenPathFlowAndroid;
  const flow = readOffline(`.maestro/flows/${flowName}`);
  if (!flow.includes('extendedWaitUntil')) {
    throw new Error(`${flowName} must wait for boot before tapping tabs`);
  }
  if (!flow.includes('id: "maestro-boot-ready"')) {
    throw new Error(`${flowName} must wait for maestro-boot-ready testID`);
  }
  if (!flow.includes('Maestro boot ready')) {
    throw new Error(`${flowName} must wait for Maestro boot ready label (Android TextView visibility)`);
  }
  if (!flow.includes(String(manifest.goldenPathBootWaitMs))) {
    throw new Error(`${flowName} boot timeout must match manifest goldenPathBootWaitMs`);
  }
  if (!flow.includes('id: "tab-settings"')) {
    throw new Error(`${flowName} must tap tab-settings testID`);
  }
  if (!flow.includes('clearState: false')) {
    throw new Error(`${flowName} must launchApp with clearState: false`);
  }
  if (!flow.includes('stopApp: false')) {
    throw new Error(`${flowName} must launchApp with stopApp: false (preserve bootstrap warm RN process)`);
  }
}

function assertGoldenPathFlow(manifest) {
  const flow = readOffline(`.maestro/flows/${manifest.goldenPathFlow}`);
  if (!flow.includes('extendedWaitUntil')) {
    throw new Error(`${manifest.goldenPathFlow} must wait for boot before tapping tabs`);
  }
  if (!flow.includes('id: "maestro-boot-ready"')) {
    throw new Error(`${manifest.goldenPathFlow} must wait for maestro-boot-ready testID (boot profile anchor)`);
  }
  if (!flow.includes('id: "tab-settings"')) {
    throw new Error(`${manifest.goldenPathFlow} must tap tab-settings testID`);
  }
  if (!flow.includes('welcome-account-skip')) {
    throw new Error(`${manifest.goldenPathFlow} must optionally dismiss welcome-account-skip`);
  }
  if (!flow.includes('clearState: false')) {
    throw new Error(`${manifest.goldenPathFlow} must launchApp with clearState: false (bootstrap reinstalls)`);
  }
  if (!flow.includes('stopApp: false')) {
    throw new Error(`${manifest.goldenPathFlow} must launchApp with stopApp: false (preserve bootstrap warm RN process)`);
  }
  const bootWaitMs = manifest.goldenPathBootWaitMs;
  if (!bootWaitMs || bootWaitMs < 1800000) {
    throw new Error('manifest goldenPathBootWaitMs must be >= 1800000 (45m fail-fast CI cap)');
  }
  if (!flow.includes(String(bootWaitMs))) {
    throw new Error(`${manifest.goldenPathFlow} boot timeout must match manifest goldenPathBootWaitMs`);
  }
}

function assertBootstrapInitLaunch() {
  const iosBootstrap = readOffline('scripts/maestro-ci-bootstrap-simulator.sh');
  if (!iosBootstrap.includes('initialize local SQLite')) {
    throw new Error('iOS bootstrap must launch once to initialize SQLite when seed is skipped');
  }
  if (!iosBootstrap.includes('seed-maestro-boot-profile.mjs')) {
    throw new Error('iOS bootstrap must apply golden-path boot profile when MAESTRO_SEED_SKIP=1');
  }
  if (!iosBootstrap.includes('Release-iphonesimulator/Tracebud.app')) {
    throw new Error('iOS bootstrap must install Release simulator app when present');
  }
  const androidBootstrap = readOffline('scripts/maestro-ci-bootstrap-emulator.sh');
  if (
    !androidBootstrap.includes('MAESTRO_ANDROID_IN_APP_DB_SEED') &&
    !androidBootstrap.includes('force-provision SQLite before first RN launch') &&
    !androidBootstrap.includes('initialize local SQLite')
  ) {
    throw new Error('Android bootstrap must seed SQLite before first RN launch');
  }
  if (!androidBootstrap.includes('in-app bundled SQLite')) {
    throw new Error('Android bootstrap must default to in-app Maestro DB seed');
  }
  if (!androidBootstrap.includes('MAESTRO_SKIP_BOOTSTRAP_WARM')) {
    throw new Error('Android bootstrap must support MAESTRO_SKIP_BOOTSTRAP_WARM for PR smoke');
  }
  if (!androidBootstrap.includes('MAESTRO_JS_BOOT_FAIL_FAST')) {
    throw new Error('Android bootstrap must fail fast when JS boot stalls');
  }
}

function assertGoldenPathScripts() {
  const iosGolden = readOffline('scripts/maestro-ci-golden-path.sh');
  const androidGolden = readOffline('scripts/maestro-ci-golden-path-android.sh');
  const androidSmoke = readOffline('scripts/maestro-ci-golden-path-android-smoke.sh');
  if (!iosGolden.includes('MAESTRO_SEED_SKIP')) {
    throw new Error('iOS golden path must default MAESTRO_SEED_SKIP=1');
  }
  if (!androidGolden.includes('MAESTRO_SEED_SKIP')) {
    throw new Error('Android golden path must default MAESTRO_SEED_SKIP=1');
  }
  if (!androidSmoke.includes('maestro-ci-bootstrap-emulator.sh')) {
    throw new Error('Android smoke must reuse emulator bootstrap');
  }
  if (!androidSmoke.includes('android-pr-smoke.yaml')) {
    throw new Error('Android smoke must default to android-pr-smoke.yaml');
  }
  const collectArtifacts = readOffline('scripts/maestro-ci-collect-android-debug-artifacts.sh');
  if (!collectArtifacts.includes('logcat-tracebud.txt')) {
    throw new Error('maestro-ci-collect-android-debug-artifacts.sh must capture filtered logcat');
  }
  if (!androidGolden.includes('maestro-ci-collect-android-debug-artifacts.sh')) {
    throw new Error('Android golden path must collect debug artifacts on failure');
  }
}

function assertFlowsBaseline(manifest) {
  const baseline = JSON.parse(readOffline(manifest.flowsBaseline));
  if (baseline.goldenPathFlow !== manifest.goldenPathFlow) {
    throw new Error('maestro-flows goldenPathFlow must match manifest');
  }
}

function assertAndroidRunner(manifest) {
  const bootstrap = readOffline('scripts/maestro-ci-bootstrap-emulator.sh');
  const androidGolden = readOffline('scripts/maestro-ci-golden-path-android.sh');
  if (!androidGolden.includes('maestro-ci-bootstrap-emulator.sh')) {
    throw new Error('Android golden path must reuse emulator bootstrap');
  }
  if (!bootstrap.includes('MAESTRO_DRIVER_STARTUP_TIMEOUT')) {
    throw new Error('Android bootstrap must set MAESTRO_DRIVER_STARTUP_TIMEOUT');
  }
  if (!bootstrap.includes('resolve_maestro_apk_path')) {
    throw new Error('Android bootstrap must resolve Maestro APK by bundled boot DB presence');
  }
  if (!readOffline('scripts/maestro-ci-stage-android-apk.sh').includes('tracebud-maestro-ci-app-debug.apk')) {
    throw new Error('maestro-ci-stage-android-apk.sh must stage APK outside android/build churn');
  }
  if (!bootstrap.includes('MAESTRO_ANDROID_FORCE_PROVISION')) {
    throw new Error('Android bootstrap must support legacy force-provision when in-app seed disabled');
  }
  if (!readOffline('features/state/persistence.native.ts').includes('maestroCiBootDatabase')) {
    throw new Error('persistence.native.ts must copy bundled Maestro boot DB when EXPO_PUBLIC_MAESTRO_CI=1');
  }
  if (!readOffline('features/testing/maestroCiBootDatabase.android.ts').includes('maestro/tracebud_offline.db')) {
    throw new Error('maestroCiBootDatabase.android.ts must load boot DB from APK native assets');
  }
  if (!readOffline('features/testing/maestroCiBootDatabase.android.ts').includes('expo-file-system/legacy')) {
    throw new Error('maestroCiBootDatabase.android.ts must import expo-file-system/legacy (SDK 55 boot DB copy)');
  }
  const androidAssemble = readOffline('scripts/maestro-ci-assemble-android-apk.sh');
  if (!androidAssemble.includes('android/app/src/main/assets/maestro/tracebud_offline.db')) {
    throw new Error('maestro-ci-assemble-android-apk.sh must copy boot DB into Android native assets');
  }
  if (!readOffline('scripts/generate-maestro-ci-boot-db.mjs').includes('goldenPathBootProfile')) {
    throw new Error('generate-maestro-ci-boot-db.mjs must build golden-path boot DB from baseline');
  }
  if (!readOffline('app.config.js').includes('reactCompiler: false')) {
    throw new Error('app.config.js must disable reactCompiler when MAESTRO_CI=1');
  }
  const thinBootProfile = readOffline('features/testing/maestroCiBootProfile.ts');
  if (!thinBootProfile.includes('shouldUseMaestroCiThinBoot')) {
    throw new Error('maestroCiBootProfile.ts must define shouldUseMaestroCiThinBoot');
  }
  if (!readOffline('features/state/AppStateContext.tsx').includes('shouldUseMaestroCiThinBoot')) {
    throw new Error('AppStateContext must skip hydrateSyncAuthFromSettings on Maestro CI thin boot');
  }
  if (!readOffline('features/auth/SignInSheetContext.tsx').includes('shouldUseMaestroCiThinBoot')) {
    throw new Error('SignInSheetContext must skip network refreshAuth on Maestro CI thin boot');
  }
  const rootLayout = readOffline('app/_layout.tsx');
  if (!rootLayout.includes('MaestroCiLayoutBridges')) {
    throw new Error('app/_layout.tsx must defer background bridges via MaestroCiLayoutBridges on CI');
  }
  if (!readOffline('features/observability/initObservability.ts').includes('shouldUseMaestroCiThinBoot')) {
    throw new Error('initObservability must no-op on Maestro CI thin boot');
  }
  if (!bootstrap.includes('dump_tracebud_logcat')) {
    throw new Error('Android bootstrap must dump logcat after seed for Maestro diagnostics');
  }
  if (!bootstrap.includes('MAESTRO_BOOT_WARMED')) {
    throw new Error('Android bootstrap must track MAESTRO_BOOT_WARMED after JS warm-up');
  }
  if (!androidGolden.includes('dump_tracebud_logcat')) {
    throw new Error('Android golden path must dump logcat on Maestro failure');
  }
  if (!bootstrap.includes('resolve_maestro_apk_path') || !bootstrap.includes('No Maestro CI APK with assets/maestro/tracebud_offline.db')) {
    throw new Error('Android bootstrap must fail fast when prebuilt APK is missing or lacks boot DB');
  }
  if (bootstrap.includes('expo run:android')) {
    throw new Error('Android golden-path bootstrap must not fall back to expo run:android');
  }
  if (!androidGolden.includes('settings-sync-smoke-android.yaml')) {
    throw new Error('Android golden path must default to settings-sync-smoke-android.yaml');
  }
  if (!readOffline('scripts/maestro-android-db-path.mjs').includes('maestro-android-boot-schema.sql')) {
    throw new Error('Android DB seed must use maestro-android-boot-schema.sql for provision fallback');
  }
  if (!androidGolden.includes('--device')) {
    throw new Error('Android golden path must pass --device to maestro test');
  }
  const timeoutMs = manifest.androidEmulator?.driverStartupTimeoutMs;
  if (!timeoutMs || timeoutMs < 180000) {
    throw new Error('manifest androidEmulator.driverStartupTimeoutMs must be >= 180000');
  }
}

function assertIosAssembly(manifest) {
  const assembleScript = readOffline(manifest.iosSimulatorAssemblyScript);
  if (!assembleScript.includes('export:embed')) {
    throw new Error(`${manifest.iosSimulatorAssemblyScript} must run expo export:embed`);
  }
  if (!assembleScript.includes('IOS_CONFIGURATION') || !assembleScript.includes("IOS_CONFIGURATION:-Release")) {
    throw new Error(`${manifest.iosSimulatorAssemblyScript} must default IOS_CONFIGURATION to Release (Debug skips JS embed)`);
  }
  if (!assembleScript.includes('main.jsbundle')) {
    throw new Error(`${manifest.iosSimulatorAssemblyScript} must verify embedded JS bundle in .app`);
  }
  const bootstrap = readOffline('scripts/maestro-ci-bootstrap-simulator.sh');
  if (!bootstrap.includes('Release-iphonesimulator')) {
    throw new Error('iOS bootstrap must install Release simulator app from ios-build/DerivedData');
  }
}

function assertWorkflow(manifest) {
  const workflow = readRepo(manifest.workflowFile);
  const workflowBody = workflow;
  if (!workflow.includes(manifest.iosJobName)) {
    throw new Error(`${manifest.workflowFile} must define ${manifest.iosJobName} job`);
  }
  if (!workflow.includes(manifest.androidJobName)) {
    throw new Error(`${manifest.workflowFile} must define ${manifest.androidJobName} job`);
  }
  const smokeJobName = manifest.androidSmokeJobName;
  if (!smokeJobName || !workflow.includes(smokeJobName)) {
    throw new Error(`${manifest.workflowFile} must define ${smokeJobName ?? 'androidSmokeJobName'} job`);
  }
  if (!workflow.includes('run_android_smoke')) {
    throw new Error(`${manifest.workflowFile} must wire maestro-cost-gate run_android_smoke output`);
  }
  if (!workflow.includes('run_android_golden')) {
    throw new Error(`${manifest.workflowFile} must wire maestro-cost-gate run_android_golden output`);
  }
  if (!workflow.includes('maestro-ci-collect-android-debug-artifacts.sh') && !workflow.includes('ci-artifacts/maestro-android')) {
    throw new Error(`${manifest.workflowFile} Android jobs must upload Maestro debug artifacts on failure`);
  }
  const assembleJobName = manifest.androidAssembleJobName;
  if (!assembleJobName || !workflow.includes(assembleJobName)) {
    throw new Error(`${manifest.workflowFile} must define ${assembleJobName ?? 'androidAssembleJobName'} job`);
  }
  if (!workflow.includes('maestro-ci-stage-android-apk.sh')) {
    throw new Error(`${manifest.workflowFile} must stage Maestro APK after artifact download`);
  }
  if (!workflow.includes('maestro-android-apk')) {
    throw new Error(`${manifest.workflowFile} must upload/download maestro-android-apk artifact`);
  }
  if (!workflow.includes('maestro-android-assemble')) {
    throw new Error(`${manifest.workflowFile} must define maestro-android-assemble job`);
  }
  if (!workflow.includes('needs: [maestro-cost-gate, maestro-android-assemble]')) {
    throw new Error(`${manifest.workflowFile} Android smoke/golden must depend on maestro-android-assemble`);
  }
  if (!workflow.includes('maestro-ci-golden-path-android-smoke.sh')) {
    throw new Error(`${manifest.workflowFile} must run maestro-ci-golden-path-android-smoke.sh on PR`);
  }
  if (!workflow.includes('maestro-cost-gate')) {
    throw new Error(`${manifest.workflowFile} must define maestro-cost-gate job (H25 cost guard)`);
  }
  if (!workflow.includes('maestro-ci-platform-gate.mjs')) {
    throw new Error(`${manifest.workflowFile} must run maestro-ci-platform-gate.mjs on pull_request`);
  }
  if (!workflow.includes('cancel-in-progress: true')) {
    throw new Error(`${manifest.workflowFile} must cancel superseded Maestro runs (concurrency)`);
  }
  if (!workflow.includes('needs.maestro-cost-gate.outputs.run_ios')) {
    throw new Error(`${manifest.workflowFile} macOS golden path must honor cost gate run_ios`);
  }
  if (!workflow.includes('needs.maestro-cost-gate.outputs.run_android')) {
    throw new Error(`${manifest.workflowFile} Android golden path must honor cost gate run_android`);
  }
  const platformGate = readOffline(manifest.costGate?.platformGateScript ?? 'scripts/maestro-ci-platform-gate.mjs');
  if (!platformGate.includes('ANDROID_SMOKE_JOB')) {
    throw new Error('maestro-ci-platform-gate.mjs must track Android PR smoke job for cost skip');
  }
  if (!platformGate.includes('run_android_golden')) {
    throw new Error('maestro-ci-platform-gate.mjs must output run_android_golden for push/dispatch');
  }
  if (!platformGate.includes('e2eBypass')) {
    throw new Error('maestro-ci-platform-gate.mjs must honor e2eBypass from maestro-golden-path-ci.json');
  }
  if (!workflow.includes('maestro-e2e-bypass-notice')) {
    throw new Error(`${manifest.workflowFile} must define maestro-e2e-bypass-notice job for pilot e2eBypass`);
  }
  if (!workflow.includes('e2e_bypass')) {
    throw new Error(`${manifest.workflowFile} cost gate must export e2e_bypass output`);
  }
  if (manifest.e2eBypass?.enabled) {
    if (!manifest.e2eBypass.reason?.trim()) {
      throw new Error('manifest e2eBypass.enabled requires e2eBypass.reason');
    }
    if (!manifest.e2eBypass.allowedUntil) {
      throw new Error('manifest e2eBypass.enabled requires e2eBypass.allowedUntil expiry date');
    }
  }
  if (!platformGate.includes('ios_already_green_android_only_delta')) {
    throw new Error('maestro-ci-platform-gate.mjs must skip iOS when already green on android-only PR delta');
  }
  if (!workflow.includes('pull_request')) {
    throw new Error(`${manifest.workflowFile} golden path must run on pull_request`);
  }
  if (!workflow.includes('android-emulator-runner')) {
    throw new Error(`${manifest.workflowFile} must use android-emulator-runner for Android lane`);
  }
  if (!workflow.includes('maestro-ci-golden-path-android.sh')) {
    throw new Error(`${manifest.workflowFile} must run maestro-ci-golden-path-android.sh for golden path`);
  }
  if (!workflow.includes('MAESTRO_DRIVER_STARTUP_TIMEOUT')) {
    throw new Error(`${manifest.workflowFile} Android job must set MAESTRO_DRIVER_STARTUP_TIMEOUT`);
  }
  if (!workflow.includes('emulator-options')) {
    throw new Error(`${manifest.workflowFile} Android job must set emulator-options for software GPU`);
  }
  if (!workflow.includes('maestro-ci-assemble-android-apk.sh')) {
    throw new Error(`${manifest.workflowFile} must assemble Android APK via maestro-ci-assemble-android-apk.sh`);
  }
  if (!workflow.includes('maestro-ci-assemble-ios-simulator.sh')) {
    throw new Error(`${manifest.workflowFile} must assemble iOS simulator app via maestro-ci-assemble-ios-simulator.sh`);
  }
  const assembleScript = readOffline('scripts/maestro-ci-assemble-android-apk.sh');
  if (!assembleScript.includes('export:embed')) {
    throw new Error('maestro-ci-assemble-android-apk.sh must run expo export:embed');
  }
  if (!assembleScript.includes('assembleDebug')) {
    throw new Error('maestro-ci-assemble-android-apk.sh must run gradle assembleDebug');
  }
  if (!assembleScript.includes('--build-cache')) {
    throw new Error('maestro-ci-assemble-android-apk.sh must enable Gradle build cache');
  }
  if (!assembleScript.includes('org.gradle.parallel')) {
    throw new Error('maestro-ci-assemble-android-apk.sh must enable Gradle parallel builds');
  }
  if (!assembleScript.includes('MaxMetaspaceSize=1024m')) {
    throw new Error('maestro-ci-assemble-android-apk.sh must raise Gradle MaxMetaspaceSize for CI assemble');
  }
  if (!assembleScript.includes('debuggableVariants = []')) {
    throw new Error('maestro-ci-assemble-android-apk.sh must set debuggableVariants = [] (debug skips JS embed by default)');
  }
  if (!assembleScript.includes('index.android.bundle')) {
    throw new Error('maestro-ci-assemble-android-apk.sh must verify embedded index.android.bundle in APK');
  }
  if (!assembleScript.includes('MAESTRO_ANDROID_ABI') || !assembleScript.includes('x86_64')) {
    throw new Error('maestro-ci-assemble-android-apk.sh must default to x86_64 APK for CI emulator');
  }
  if (!assembleScript.includes('MAESTRO_CI')) {
    throw new Error('maestro-ci-assemble-android-apk.sh must set MAESTRO_CI=1 to disable OTA checks');
  }
  if (!assembleScript.includes('Reusing cached android/')) {
    throw new Error('maestro-ci-assemble-android-apk.sh must skip expo prebuild when android/ cache exists');
  }
  if (!assembleScript.includes('generate-maestro-ci-boot-db.mjs')) {
    throw new Error('maestro-ci-assemble-android-apk.sh must generate bundled Maestro boot DB asset');
  }
  if (!assembleScript.includes('maestro/tracebud_offline.db')) {
    throw new Error('maestro-ci-assemble-android-apk.sh must verify assets/maestro/tracebud_offline.db in APK');
  }
  if (!assembleScript.includes('EXPO_PUBLIC_MAESTRO_CI')) {
    throw new Error('maestro-ci-assemble-android-apk.sh must set EXPO_PUBLIC_MAESTRO_CI=1 for CI boot marker');
  }
  const rootLayout = readOffline('app/_layout.tsx');
  if (!rootLayout.includes('MaestroBootReadyMarker') || !rootLayout.includes('flex: 1')) {
    throw new Error('app/_layout.tsx must wrap MaestroBootReadyMarker in flex:1 root for Android visibility');
  }
  const splashClose = rootLayout.indexOf('</SplashGate>');
  const markerMount = rootLayout.lastIndexOf('<MaestroBootReadyMarker');
  if (splashClose === -1 || markerMount === -1 || markerMount < splashClose) {
    throw new Error('app/_layout.tsx must render MaestroBootReadyMarker after SplashGate (top z-order on Android)');
  }
  const iosAssemble = readOffline(manifest.iosSimulatorAssemblyScript);
  if (!iosAssemble.includes('MAESTRO_CI')) {
    throw new Error(`${manifest.iosSimulatorAssemblyScript} must set MAESTRO_CI=1 to disable OTA checks`);
  }
  if (!iosAssemble.includes('EXPO_PUBLIC_MAESTRO_CI')) {
    throw new Error(`${manifest.iosSimulatorAssemblyScript} must set EXPO_PUBLIC_MAESTRO_CI=1`);
  }
  if (!workflow.includes('MAESTRO_SEED_SKIP')) {
    throw new Error(`${manifest.workflowFile} golden path jobs must set MAESTRO_SEED_SKIP=1`);
  }
  if (!workflow.includes('MAESTRO_ANDROID_APK_PATH')) {
    throw new Error(`${manifest.workflowFile} Android job must set MAESTRO_ANDROID_APK_PATH`);
  }
  const bootDbWaitMs = manifest.bootDbWaitMs;
  if (!bootDbWaitMs || bootDbWaitMs < 120000) {
    throw new Error('manifest bootDbWaitMs must be >= 120000');
  }
  if (!workflow.includes('MAESTRO_ANDROID_IN_APP_DB_SEED')) {
    throw new Error(`${manifest.workflowFile} Android job must set MAESTRO_ANDROID_IN_APP_DB_SEED=1`);
  }
  if (!workflow.includes('MAESTRO_JS_BOOT_FAIL_FAST_MS')) {
    throw new Error(`${manifest.workflowFile} Android job must set MAESTRO_JS_BOOT_FAIL_FAST_MS`);
  }
  const androidTimeout = manifest.androidJobTimeoutMinutes;
  if (!androidTimeout || androidTimeout > 80) {
    throw new Error('manifest androidJobTimeoutMinutes must be <= 80 (emulator-only after split assemble)');
  }
  const assembleTimeout = manifest.androidAssembleJobTimeoutMinutes;
  if (!assembleTimeout || assembleTimeout > 50) {
    throw new Error('manifest androidAssembleJobTimeoutMinutes must be <= 50');
  }
  if (!workflow.includes(`timeout-minutes: ${assembleTimeout}`)) {
    throw new Error(`${manifest.workflowFile} Android assemble job timeout must match manifest androidAssembleJobTimeoutMinutes`);
  }
  const smokeTimeout = manifest.androidSmokeJobTimeoutMinutes;
  if (!smokeTimeout || smokeTimeout > 40) {
    throw new Error('manifest androidSmokeJobTimeoutMinutes must be <= 40 (PR smoke cap)');
  }
  if (!workflow.includes(`timeout-minutes: ${smokeTimeout}`)) {
    throw new Error(`${manifest.workflowFile} Android smoke job timeout must match manifest androidSmokeJobTimeoutMinutes`);
  }
  if (!workflow.includes(`timeout-minutes: ${androidTimeout}`)) {
    throw new Error(`${manifest.workflowFile} Android job timeout must match manifest androidJobTimeoutMinutes`);
  }
  const bootstrapWarmMs = manifest.androidBootstrapWarmMs;
  if (!bootstrapWarmMs || bootstrapWarmMs > 1200000) {
    throw new Error('manifest androidBootstrapWarmMs must be <= 1200000');
  }
  if (!workflow.includes(String(bootstrapWarmMs))) {
    throw new Error('workflow MAESTRO_BOOTSTRAP_WARM_MS must match manifest androidBootstrapWarmMs for golden path');
  }
  const smokeBootstrapWarmMs = manifest.androidSmokeBootstrapWarmMs;
  if (manifest.androidSmokeSkipBootstrapWarm) {
    if (!workflow.includes('MAESTRO_SKIP_BOOTSTRAP_WARM')) {
      throw new Error(`${manifest.workflowFile} Android smoke must set MAESTRO_SKIP_BOOTSTRAP_WARM=1`);
    }
    if (smokeBootstrapWarmMs) {
      throw new Error('manifest must not set androidSmokeBootstrapWarmMs when androidSmokeSkipBootstrapWarm is true');
    }
  } else if (!smokeBootstrapWarmMs || smokeBootstrapWarmMs > 900000) {
    throw new Error('manifest androidSmokeBootstrapWarmMs must be <= 900000');
  } else if (!workflow.includes(String(smokeBootstrapWarmMs))) {
    throw new Error('workflow smoke MAESTRO_BOOTSTRAP_WARM_MS must match manifest androidSmokeBootstrapWarmMs');
  }
  const smokeFailFastMs = manifest.androidSmokeJsBootFailFastMs;
  if (!smokeFailFastMs || smokeFailFastMs > 900000) {
    throw new Error('manifest androidSmokeJsBootFailFastMs must be <= 900000');
  }
  if (!workflow.includes(String(smokeFailFastMs))) {
    throw new Error('workflow smoke MAESTRO_JS_BOOT_FAIL_FAST_MS must match manifest androidSmokeJsBootFailFastMs');
  }
  if (!workflow.includes('timeout-minutes: 120') || !workflow.includes('maestro-golden-path:')) {
    throw new Error(`${manifest.workflowFile} macOS golden path must allow 120m timeout`);
  }
  if (!workflow.includes('Cache Gradle')) {
    throw new Error(`${manifest.workflowFile} Android assemble job must cache Gradle`);
  }
  if (!workflow.includes('Restore android prebuild cache')) {
    throw new Error(`${manifest.workflowFile} Android assemble must restore android prebuild cache`);
  }
  if (!workflow.includes('maestro-avd-snapshot')) {
    throw new Error(`${manifest.workflowFile} Android emulator jobs must cache AVD snapshots`);
  }
  if (!workflow.includes('maestro-ci-resolve-emulator-options.sh')) {
    throw new Error(`${manifest.workflowFile} must resolve emulator options via maestro-ci-resolve-emulator-options.sh`);
  }
  const assembleRunner = manifest.androidAssembleRunner;
  if (!assembleRunner || !workflow.includes(`runs-on: ${assembleRunner}`)) {
    throw new Error(`${manifest.workflowFile} Android assemble must use ${assembleRunner ?? 'manifest androidAssembleRunner'}`);
  }
  const iosTimeout = manifest.iosTimeoutMinutes;
  if (!iosTimeout || iosTimeout < 120) {
    throw new Error('manifest iosTimeoutMinutes must be >= 120');
  }
  if (!workflow.includes('maestro-golden-path-android')) {
    throw new Error(`${manifest.workflowFile} must define Android golden path job`);
  }
  const androidRunner = manifest.androidEmulator?.emulatorRunner;
  const androidArch = manifest.androidEmulator?.emulatorArch;
  if (!androidRunner || !workflowBody.includes(`runs-on: ${androidRunner}`)) {
    throw new Error(`${manifest.workflowFile} Android emulator jobs must use ${androidRunner ?? 'manifest emulatorRunner'}`);
  }
  if (!androidArch || !workflowBody.includes(`arch: ${androidArch}`)) {
    throw new Error(`${manifest.workflowFile} Android job must use ${androidArch ?? 'manifest emulatorArch'} emulator`);
  }
  const emulatorOptions = manifest.androidEmulator?.emulatorOptions;
  const resolveEmulatorOpts = readOffline('scripts/maestro-ci-resolve-emulator-options.sh');
  if (!emulatorOptions || !resolveEmulatorOpts.includes('swiftshader_indirect')) {
    throw new Error('maestro-ci-resolve-emulator-options.sh must use swiftshader_indirect (manifest parity)');
  }
  if (!workflow.includes('emulator_opts.outputs.options')) {
    throw new Error(`${manifest.workflowFile} must pass resolved emulator options to android-emulator-runner`);
  }

  if (
    !workflowBody.includes("github.event_name == 'pull_request'") ||
    !workflowBody.includes('maestro-golden-path:')
  ) {
    throw new Error('offline-maestro.yml must run golden path jobs on pull_request');
  }

  // S1: detect doubled-path pattern — bash apps/offline-product/scripts/... inside a job
  // whose defaults.run.working-directory is apps/offline-product. This caused H7 (exit 127).
  const doubledPathPattern = /bash\s+apps\/offline-product\/scripts\//;
  if (doubledPathPattern.test(workflow)) {
    throw new Error(
      `${manifest.workflowFile} contains 'bash apps/offline-product/scripts/...' inside a job with working-directory: apps/offline-product — this doubles the path and exits 127. Use 'bash scripts/...' or 'bash ./scripts/...' instead.`,
    );
  }
}

function assertPackageScripts(manifest) {
  const pkg = JSON.parse(readOffline('package.json'));
  if (!pkg.scripts?.['qa:maestro:golden-path:android']) {
    throw new Error('package.json must define qa:maestro:golden-path:android');
  }
  if (!pkg.scripts?.['qa:maestro:golden-path:assert']) {
    throw new Error('package.json must define qa:maestro:golden-path:assert');
  }
  for (const script of ['qa:maestro:prepush', 'qa:maestro:prepush:full', 'qa:maestro:prepush:assert', 'qa:maestro:prepush:android:smoke']) {
    if (!pkg.scripts?.[script]) {
      throw new Error(`package.json must define ${script} (H25 cost prepush)`);
    }
  }
  if (!manifest.prepushScript || !manifest.prepushRunbook) {
    throw new Error('manifest must define prepushScript and prepushRunbook');
  }
}

function main() {
  const manifest = loadManifest();
  assertManifestShape(manifest);
  assertFlowsBaseline(manifest);
  assertGoldenPathFlow(manifest);
  assertAndroidSmokeFlow(manifest);
  assertAndroidGoldenPathFlow(manifest);
  assertGoldenPathScripts();
  assertBootstrapInitLaunch();
  assertIosAssembly(manifest);
  assertAndroidRunner(manifest);
  assertWorkflow(manifest);
  assertPackageScripts(manifest);
  console.log('Maestro golden path CI guard passed (H25).');
}

main();
