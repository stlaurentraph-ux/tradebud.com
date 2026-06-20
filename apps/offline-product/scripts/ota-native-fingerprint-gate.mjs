#!/usr/bin/env node
/**
 * Fingerprint native/OTA-sensitive config (app.json + eas.json).
 * OTA updates must not ship when native fingerprint drifts without a new binary build.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const baselinePath = path.join(root, 'qa/automation-baselines/ota-native-fingerprint.json');

const args = new Set(process.argv.slice(2));
const strict = args.has('--strict');
const writeBaseline = args.has('--write-baseline');

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
}

function pickFingerprint() {
  const app = readJson('app.json').expo ?? {};
  const eas = readJson('eas.json');

  return {
    expoSdk: app.sdkVersion ?? null,
    runtimeVersion: app.runtimeVersion ?? null,
    newArchEnabled: app.newArchEnabled ?? null,
    iosBundleId: app.ios?.bundleIdentifier ?? null,
    androidPackage: app.android?.package ?? null,
    iosPermissions: app.ios?.infoPlist
      ? Object.keys(app.ios.infoPlist).filter((k) => k.endsWith('UsageDescription')).sort()
      : [],
    androidPermissions: [...(app.android?.permissions ?? [])].sort(),
    plugins: [...(app.plugins ?? [])].map((p) => (typeof p === 'string' ? p : p[0])).sort(),
    easChannels: Object.fromEntries(
      Object.entries(eas.build ?? {}).map(([profile, cfg]) => [profile, cfg.channel ?? null]),
    ),
  };
}

function fingerprintHash(payload) {
  return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

function readBaseline() {
  if (!fs.existsSync(baselinePath)) return null;
  return JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
}

function writeBaselineFile(payload) {
  fs.mkdirSync(path.dirname(baselinePath), { recursive: true });
  fs.writeFileSync(baselinePath, `${JSON.stringify(payload, null, 2)}\n`);
}

function main() {
  const fingerprint = pickFingerprint();
  const sha256 = fingerprintHash(fingerprint);
  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    sha256,
    fingerprint,
  };

  if (writeBaseline) {
    writeBaselineFile(report);
    console.log(`Wrote baseline: ${path.relative(root, baselinePath)} (${sha256.slice(0, 12)}…)`);
    process.exit(0);
  }

  console.log(`ota-native-fingerprint-gate: sha256=${sha256.slice(0, 16)}…`);

  const baseline = readBaseline();
  if (!baseline) {
    console.log('  NOTE no baseline yet — run npm run qa:automation:write-baselines');
    process.exit(strict ? 1 : 0);
  }

  if (baseline.sha256 === sha256) {
    console.log('  OK — matches baseline');
    process.exit(0);
  }

  console.log('  WARN native fingerprint drift vs baseline');
  console.log(`    baseline: ${baseline.sha256.slice(0, 16)}…`);
  console.log(`    current:  ${sha256.slice(0, 16)}…`);

  if (strict) {
    console.error('ota-native-fingerprint-gate: FAILED (strict) — ship native build, not OTA-only');
    process.exit(1);
  }
  console.log('  report mode — non-blocking until slice 1.O.2');
  process.exit(0);
}

main();
