#!/usr/bin/env node
/**
 * Ensures DEVICE_SMOKE §12 cross-device checklist and Maestro sync wiring exist.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(root, '../..');

function read(relFromRoot) {
  return fs.readFileSync(path.join(repoRoot, relFromRoot), 'utf8');
}

function main() {
  const issues = [];
  const smokePath = path.join(root, 'DEVICE_SMOKE_CHECKLIST.md');
  if (!fs.existsSync(smokePath)) {
    issues.push('missing DEVICE_SMOKE_CHECKLIST.md');
  } else {
    const smoke = fs.readFileSync(smokePath, 'utf8');
    const requiredPhrases = [
      'cross-device',
      'land title',
      'Field photos',
      'profile photo',
      'Walk my plot',
    ];
    for (const phrase of requiredPhrases) {
      if (!smoke.toLowerCase().includes(phrase.toLowerCase())) {
        issues.push(`DEVICE_SMOKE_CHECKLIST.md missing cross-device phrase: ${phrase}`);
      }
    }
  }

  const maestroFlow = path.join(root, '.maestro/flows/settings-sync-smoke.yaml');
  const crossDeviceFlow = path.join(root, '.maestro/flows/cross-device-restore-smoke.yaml');
  if (!fs.existsSync(maestroFlow)) {
    issues.push('missing .maestro/flows/settings-sync-smoke.yaml');
  } else {
    const flow = fs.readFileSync(maestroFlow, 'utf8');
    if (!flow.includes('settings-sync-now')) {
      issues.push('settings-sync-smoke.yaml must reference settings-sync-now testID');
    }
  }
  if (!fs.existsSync(crossDeviceFlow)) {
    issues.push('missing .maestro/flows/cross-device-restore-smoke.yaml');
  } else {
    const flow = fs.readFileSync(crossDeviceFlow, 'utf8');
    if (!flow.includes('settings-sync-now')) {
      issues.push('cross-device-restore-smoke.yaml must exercise settings-sync-now');
    }
    if (!flow.includes('plot-upload-land-proof')) {
      issues.push('cross-device-restore-smoke.yaml must reach plot documents land proof');
    }
  }

  const ciPath = path.join(repoRoot, '.github/workflows/ci.yml');
  if (fs.existsSync(ciPath)) {
    const ci = fs.readFileSync(ciPath, 'utf8');
    if (!ci.includes('qa:maestro:nightly:assert')) {
      issues.push('CI must run qa:maestro:nightly:assert for Maestro wiring');
    }
  }

  try {
    const readme = read('apps/offline-product/.maestro/README.md');
    if (!readme.includes('settings-sync-smoke.yaml')) {
      issues.push('.maestro/README.md must document settings-sync-smoke.yaml');
    }
    if (!readme.includes('cross-device-restore-smoke.yaml')) {
      issues.push('.maestro/README.md must document cross-device-restore-smoke.yaml');
    }
  } catch {
    issues.push('missing apps/offline-product/.maestro/README.md');
  }

  if (issues.length === 0) {
    console.log('cross-device-smoke-wiring-guard: OK');
    process.exit(0);
  }

  console.error('cross-device-smoke-wiring-guard: FAILED\n');
  for (const issue of issues) console.error(`  → ${issue}`);
  process.exit(1);
}

main();
