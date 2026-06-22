#!/usr/bin/env node
/**
 * EAS OTA skew guard (slice 5.10).
 *
 * Ensures runtimeVersion/channel wiring prevents JS-only OTA to incompatible natives.
 * Optional EAS channel probe when EXPO_TOKEN is set.
 *
 * Run: npm run ota:skew:assert
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.join(root, '../..');
const manifestPath = path.join(repoRoot, 'product-os/04-quality/ota-production-gate.json');

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
}

function loadManifest() {
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

function resolveExpectedRuntimeVersion(app) {
  const runtimeVersion = app.runtimeVersion;
  if (typeof runtimeVersion === 'string') {
    return runtimeVersion;
  }
  if (runtimeVersion?.policy === 'appVersion') {
    if (!app.version) {
      throw new Error('app.json expo.version is required when runtimeVersion.policy is appVersion');
    }
    return app.version;
  }
  throw new Error('Unsupported runtimeVersion config — use policy appVersion for OTA skew safety');
}

function assertChannelWiring(manifest, eas) {
  const errors = [];
  for (const [profile, channel] of Object.entries(manifest.channels ?? {})) {
    const profileChannel = eas.build?.[profile]?.channel;
    if (!profileChannel) {
      errors.push(`eas.json build.${profile}.channel is required (expected "${channel}")`);
      continue;
    }
    if (profileChannel !== channel) {
      errors.push(
        `eas.json build.${profile}.channel="${profileChannel}" must match manifest "${channel}"`,
      );
    }
  }
  return errors;
}

function probeEasChannelRuntime(channel, expectedRuntime) {
  if (!process.env.EXPO_TOKEN?.trim()) {
    console.log('SKIP EAS channel runtime probe — EXPO_TOKEN unset');
    return [];
  }

  const result = spawnSync(
    'npx',
    ['eas-cli', 'channel:view', channel, '--json', '--non-interactive'],
    {
      cwd: root,
      encoding: 'utf8',
      env: { ...process.env, CI: '1' },
    },
  );

  if (result.status !== 0) {
    console.warn(
      `WARN EAS channel probe failed for "${channel}" — ${(result.stderr || result.stdout || 'unknown error').trim()}`,
    );
    return [];
  }

  let payload;
  try {
    payload = JSON.parse(result.stdout);
  } catch {
    console.warn('WARN EAS channel probe returned non-JSON — skipping runtime compare');
    return [];
  }

  const branch = payload.branch ?? payload.updateBranch ?? payload.linkedBranch;
  const runtime =
    payload.runtimeVersion ??
    payload.branch?.runtimeVersion ??
    payload.currentUpdate?.runtimeVersion ??
    null;

  if (runtime && runtime !== expectedRuntime) {
    return [
      `EAS channel "${channel}" targets runtime "${runtime}" but app.json expects "${expectedRuntime}" — ship native build before OTA`,
    ];
  }

  console.log(`OK EAS channel "${channel}" runtime probe${runtime ? ` (${runtime})` : ''}`);
  return [];
}

function main() {
  const manifest = loadManifest();
  const app = readJson('app.json').expo ?? {};
  const eas = readJson('eas.json');
  const errors = [];

  const expectedRuntime = resolveExpectedRuntimeVersion(app);
  console.log(`ota-skew-guard expectedRuntime=${expectedRuntime} policy=${manifest.runtimeVersionPolicy}`);

  if (!app.updates?.url) {
    errors.push('app.json expo.updates.url is required for EAS Update');
  }

  errors.push(...assertChannelWiring(manifest, eas));

  const fingerprint = spawnSync(process.execPath, ['scripts/ota-native-fingerprint-gate.mjs', '--strict'], {
    cwd: root,
    encoding: 'utf8',
  });
  if (fingerprint.status !== 0) {
    errors.push('native fingerprint drift — run native build before OTA (ota-native-fingerprint-gate --strict failed)');
  } else {
    console.log('OK native fingerprint matches baseline');
  }

  for (const channel of new Set(Object.values(manifest.channels ?? {}))) {
    errors.push(...probeEasChannelRuntime(channel, expectedRuntime));
  }

  if (errors.length > 0) {
    console.error('eas-ota-skew-guard: FAILED');
    for (const error of errors) {
      console.error(`  - ${error}`);
    }
    process.exit(1);
  }

  console.log('eas-ota-skew-guard: OK');
}

main();
