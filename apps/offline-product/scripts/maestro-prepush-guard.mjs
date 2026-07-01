#!/usr/bin/env node
/**
 * Guardrail H25 — Maestro prepush + CI cost workflow wiring.
 *
 * Run: npm run qa:maestro:prepush:assert
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.join(root, '../..');

function read(rel) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) throw new Error(`Missing: apps/offline-product/${rel}`);
  return fs.readFileSync(full, 'utf8');
}

function readRepo(rel) {
  const full = path.join(repoRoot, rel);
  if (!fs.existsSync(full)) throw new Error(`Missing: ${rel}`);
  return fs.readFileSync(full, 'utf8');
}

function main() {
  const pkg = JSON.parse(read('package.json'));
  for (const script of ['qa:maestro:prepush', 'qa:maestro:prepush:full', 'qa:maestro:prepush:assert', 'qa:maestro:prepush:android:smoke', 'qa:maestro:local:android', 'qa:maestro:local:android:golden']) {
    if (!pkg.scripts?.[script]) {
      throw new Error(`package.json must define ${script}`);
    }
  }

  const prepush = read('scripts/maestro-prepush.sh');
  if (!prepush.includes('qa:maestro:preflight')) {
    throw new Error('maestro-prepush.sh must run qa:maestro:preflight (tier 1)');
  }
  if (!prepush.includes('qa:regression')) {
    throw new Error('maestro-prepush.sh must run qa:regression (tier 2)');
  }
  if (!prepush.includes('maestro-ci-assemble-ios-simulator.sh')) {
    throw new Error('maestro-prepush.sh full mode must assemble iOS simulator app like CI');
  }
  if (!prepush.includes('qa:maestro:local:android')) {
    throw new Error('maestro-prepush.sh full mode must offer local Android smoke via qa:maestro:local:android');
  }

  const localAndroid = read('scripts/maestro-local-android.sh');
  if (!localAndroid.includes('maestro-ci-assemble-android-apk.sh')) {
    throw new Error('maestro-local-android.sh must assemble CI-parity APK');
  }

  const manifestPath = 'product-os/04-quality/maestro-golden-path-ci.json';
  const manifest = JSON.parse(readRepo(manifestPath));
  if (!manifest.prepushScript) {
    throw new Error(`${manifestPath} must define prepushScript`);
  }
  if (!manifest.localAndroidScript) {
    throw new Error(`${manifestPath} must define localAndroidScript`);
  }

  const runbook = readRepo('product-os/04-quality/maestro-ci-cost-runbook.md');
  if (!runbook.includes('qa:maestro:prepush:full')) {
    throw new Error('maestro-ci-cost-runbook.md must document qa:maestro:prepush:full');
  }
  if (!runbook.includes('qa:maestro:local:android')) {
    throw new Error('maestro-ci-cost-runbook.md must document qa:maestro:local:android');
  }

  const offlineRule = readRepo('.cursor/rules/offline-automation.mdc');
  if (!offlineRule.includes('qa:maestro:prepush')) {
    throw new Error('offline-automation.mdc must require qa:maestro:prepush before Maestro pushes');
  }

  const costRule = readRepo('.cursor/rules/maestro-ci-cost.mdc');
  if (!costRule.includes('qa:maestro:prepush:full')) {
    throw new Error('maestro-ci-cost.mdc must document prepush:full before push');
  }

  const agents = readRepo('AGENTS.md');
  if (!agents.includes('qa:maestro:prepush')) {
    throw new Error('AGENTS.md must document qa:maestro:prepush');
  }

  console.log('Maestro prepush guard passed (H25).');
}

main();
