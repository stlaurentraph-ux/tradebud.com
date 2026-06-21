#!/usr/bin/env node
/**
 * Guardrail 4.7 — release health gate manifest, scripts, workflow, and example report.
 *
 * Run: npm run release:health:assert
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function readRepo(relativePath) {
  const fullPath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing required file: ${relativePath}`);
  }
  return fs.readFileSync(fullPath, 'utf8');
}

function loadManifest() {
  let manifest;
  try {
    manifest = JSON.parse(readRepo('product-os/04-quality/release-health-gate.json'));
  } catch (error) {
    throw new Error(`Invalid release-health-gate.json: ${error.message}`);
  }
  return manifest;
}

function assertManifestShape(manifest) {
  if (manifest.schemaVersion !== 1) {
    throw new Error('manifest schemaVersion must be 1');
  }
  if (manifest.slice !== '4.7') {
    throw new Error('manifest slice must be 4.7');
  }
  if (!Array.isArray(manifest.verdicts) || !manifest.verdicts.includes('GO') || !manifest.verdicts.includes('NO-GO')) {
    throw new Error('manifest verdicts must include GO and NO-GO');
  }
  if (!manifest.thresholds?.sentryWindowMinutes || manifest.thresholds.sentryWindowMinutes !== 15) {
    throw new Error('manifest thresholds.sentryWindowMinutes must be 15');
  }
  if (!Array.isArray(manifest.signals) || manifest.signals.length !== 4) {
    throw new Error('manifest must define exactly four signals');
  }
  const ids = manifest.signals.map((item) => item.id);
  if (
    !ids.includes('ci_main') ||
    !ids.includes('marketing_post_deploy_smoke') ||
    !ids.includes('uptime_probes') ||
    !ids.includes('sentry_clean_window')
  ) {
    throw new Error('manifest signals must include ci_main, marketing_post_deploy_smoke, uptime_probes, sentry_clean_window');
  }
  const ciMain = manifest.signals.find((item) => item.id === 'ci_main');
  if (!ciMain?.required) {
    throw new Error('ci_main signal must be required');
  }
}

function assertScriptsAndDocs(manifest) {
  for (const relativePath of [
    'scripts/release-health-gate.mjs',
    'scripts/release-health-collect.mjs',
    'product-os/04-quality/release-health-gate.md',
    manifest.exampleReport,
    manifest.workflowFile,
  ]) {
    readRepo(relativePath);
  }

  const gateScript = readRepo('scripts/release-health-gate.mjs');
  if (!gateScript.includes('NO-GO') || !gateScript.includes('GO')) {
    throw new Error('release-health-gate.mjs must emit GO/NO-GO verdict');
  }

  const collectScript = readRepo('scripts/release-health-collect.mjs');
  for (const signalId of manifest.signals.map((item) => item.id)) {
    if (!collectScript.includes(signalId)) {
      throw new Error(`release-health-collect.mjs must handle signal ${signalId}`);
    }
  }

  const workflow = readRepo(manifest.workflowFile);
  if (!workflow.includes('release:health:collect') || !workflow.includes('release:health:gate')) {
    throw new Error('release-health-gate workflow must run collect + gate npm scripts');
  }

  const ciSecrets = readRepo('product-os/04-quality/ci-secrets-and-fixtures.md');
  if (!ciSecrets.includes('SENTRY_RELEASE_HEALTH_AUTH_TOKEN')) {
    throw new Error('ci-secrets-and-fixtures.md must document SENTRY_RELEASE_HEALTH_AUTH_TOKEN');
  }
}

function assertPackageScripts() {
  const pkg = JSON.parse(readRepo('package.json'));
  if (!pkg.scripts?.['release:health:assert']) {
    throw new Error('package.json must define release:health:assert');
  }
  if (!pkg.scripts?.['release:health:gate']) {
    throw new Error('package.json must define release:health:gate');
  }
  if (!pkg.scripts?.['release:health:collect']) {
    throw new Error('package.json must define release:health:collect');
  }
}

function assertExampleReportGate(manifest) {
  const result = spawnSync(
    process.execPath,
    [path.join(repoRoot, 'scripts/release-health-gate.mjs'), `--report=${manifest.exampleReport}`],
    { cwd: repoRoot, encoding: 'utf8' },
  );
  if (result.status !== 0) {
    throw new Error(`example report must evaluate to GO: ${result.stderr || result.stdout}`);
  }
}

function main() {
  const manifest = loadManifest();
  assertManifestShape(manifest);
  assertScriptsAndDocs(manifest);
  assertPackageScripts();
  assertExampleReportGate(manifest);
  console.log(`Release health gate guard passed (${manifest.signals.length} signals, slice=${manifest.slice}).`);
}

main();
