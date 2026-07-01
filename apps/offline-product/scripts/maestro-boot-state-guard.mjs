#!/usr/bin/env node
/**
 * Ensures Maestro boot profiles stay aligned across JSON baseline, TS registry,
 * bootstrap scripts, golden-path flow, and app testIDs.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(root, '../..');

function read(relFromOffline) {
  const full = path.join(root, relFromOffline);
  if (!fs.existsSync(full)) throw new Error(`Missing apps/offline-product/${relFromOffline}`);
  return fs.readFileSync(full, 'utf8');
}

function readRepo(rel) {
  const full = path.join(repoRoot, rel);
  if (!fs.existsSync(full)) throw new Error(`Missing ${rel}`);
  return fs.readFileSync(full, 'utf8');
}

function loadBaseline() {
  return JSON.parse(read('qa/automation-baselines/maestro-boot-state.json'));
}

function loadGoldenPathManifest() {
  return JSON.parse(readRepo('product-os/04-quality/maestro-golden-path-ci.json'));
}

function main() {
  const issues = [];
  const baseline = loadBaseline();
  const manifest = loadGoldenPathManifest();
  const profileId = manifest.goldenPathBootProfile ?? baseline.goldenPathBootProfile;
  const profile = baseline.profiles?.[profileId];

  if (!profile) {
    issues.push(`golden path boot profile missing: ${profileId}`);
  }

  const registryTs = read('features/testing/maestroBootStateRegistry.ts');
  const signInCtx = read('features/auth/SignInSheetContext.tsx');
  const iosBootstrap = read('scripts/maestro-ci-bootstrap-simulator.sh');
  const androidBootstrap = read('scripts/maestro-ci-bootstrap-emulator.sh');
  const flow = read(`.maestro/flows/${manifest.goldenPathFlow ?? 'settings-sync-smoke.yaml'}`);
  const androidFlowName = manifest.goldenPathFlowAndroid ?? 'settings-sync-smoke-android.yaml';
  const androidFlow = read(`.maestro/flows/${androidFlowName}`);
  const registryMd = readRepo('product-os/04-quality/maestro-boot-state-registry.md');

  if (profile) {
    if (!registryTs.includes(`export const MAESTRO_BOOT_READY_TEST_ID = '${profile.bootReadyTestId}'`)) {
      issues.push('maestroBootStateRegistry.ts bootReadyTestId must match JSON profile');
    }
  if (!signInCtx.includes('MAESTRO_BOOT_READY_TEST_ID') && !read('app/_layout.tsx').includes('MaestroBootReadyMarker')) {
      issues.push('SignInSheetContext must render MAESTRO_BOOT_READY_TEST_ID when boot is interactive');
    }
    for (const testId of profile.flowTestIds ?? []) {
      if (!flow.includes(`id: "${testId}"`) && !androidFlow.includes(`id: "${testId}"`)) {
        issues.push(`${manifest.goldenPathFlow} or ${androidFlowName} must reference flowTestId ${testId}`);
      }
    }
    for (const testId of profile.optionalFlowTestIds ?? []) {
      if (!flow.includes(testId) && !androidFlow.includes(testId)) {
        issues.push(`${manifest.goldenPathFlow} or ${androidFlowName} must reference optionalFlowTestId ${testId}`);
      }
    }
    for (const [key, value] of Object.entries(profile.settings ?? {})) {
      if (!registryTs.includes(key)) {
        issues.push(`maestroBootStateRegistry.ts must document setting key ${key}`);
      }
      const seedScript = read(profile.seedScript);
      if (!seedScript.includes(key) && !seedScript.includes('profile.settings')) {
        issues.push(`${profile.seedScript} must apply setting ${key}`);
      }
    }
    if (!iosBootstrap.includes(path.basename(profile.seedScript))) {
      issues.push(`iOS bootstrap must call ${profile.seedScript} for golden path`);
    }
    const androidUsesInAppSeed =
      androidBootstrap.includes('MAESTRO_ANDROID_IN_APP_DB_SEED') &&
      androidBootstrap.includes('in-app bundled SQLite');
    if (androidUsesInAppSeed) {
      const bootDbNative = read('features/testing/maestroCiBootDatabase.android.ts');
      if (!bootDbNative.includes('tracebud_offline.db')) {
        issues.push('maestroCiBootDatabase.android.ts must copy bundled tracebud_offline.db');
      }
      if (!bootDbNative.includes('expo-file-system/legacy')) {
        issues.push('maestroCiBootDatabase.android.ts must import expo-file-system/legacy (SDK 55 throws on deprecated main entry)');
      }
      const generateDb = read('scripts/generate-maestro-ci-boot-db.mjs');
      if (!generateDb.includes('goldenPathBootProfile') || !generateDb.includes('profile.settings')) {
        issues.push('generate-maestro-ci-boot-db.mjs must apply golden_path_minimal settings from baseline');
      }
    } else if (!androidBootstrap.includes(path.basename(profile.seedScript))) {
      issues.push(`Android bootstrap must call ${profile.seedScript} for golden path`);
    }
    if (profile.buildFromCommit) {
      if (
        !iosBootstrap.includes('Release-iphonesimulator/Tracebud.app') &&
        !iosBootstrap.includes('Debug-iphonesimulator/Tracebud.app')
      ) {
        issues.push('iOS bootstrap must install commit-built simulator app when buildFromCommit');
      }
      if (!androidBootstrap.includes('app-release.apk') && !androidBootstrap.includes('app-debug.apk')) {
        issues.push('Android bootstrap must install commit-built release/debug APK when buildFromCommit');
      }
    }
  }

  if (!registryMd.includes(profileId)) {
    issues.push('maestro-boot-state-registry.md must document golden path profile');
  }

  if (issues.length > 0) {
    console.error('maestro-boot-state-guard: FAILED\n');
    for (const issue of issues) console.error(`  - ${issue}`);
    process.exit(1);
  }

  console.log('maestro-boot-state-guard: OK');
}

main();
