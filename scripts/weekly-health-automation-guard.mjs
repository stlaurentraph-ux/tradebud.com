#!/usr/bin/env node
/**
 * Guardrail 3.3 — weekly health Cursor Automation manifest, command, and runbook.
 *
 * Run: npm run weekly:health:assert
 */
import fs from 'node:fs';
import path from 'node:path';
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
    manifest = JSON.parse(readRepo('product-os/04-quality/weekly-health-automation.json'));
  } catch (error) {
    throw new Error(`Invalid weekly-health-automation.json: ${error.message}`);
  }
  return manifest;
}

function assertManifestShape(manifest) {
  if (manifest.schemaVersion !== 1) {
    throw new Error('manifest schemaVersion must be 1');
  }
  if (manifest.slice !== '3.3') {
    throw new Error('manifest slice must be 3.3');
  }
  if (manifest.repo !== 'stlaurentraph-ux/tradebud.com') {
    throw new Error('manifest repo must be stlaurentraph-ux/tradebud.com');
  }
  if (manifest.schedule?.cron !== '30 9 * * 1') {
    throw new Error('manifest schedule must be 30 9 * * 1 (Monday 09:30 UTC)');
  }
}

function assertDocsAndCommand(manifest) {
  for (const relativePath of [
    manifest.commandFile,
    manifest.activationRunbook,
    manifest.releaseHealthWorkflow,
    manifest.dailyLogFile,
  ]) {
    readRepo(relativePath);
  }

  const command = readRepo(manifest.commandFile);
  for (const needle of [
    'release-health-gate.yml',
    'daily-log.md',
    'release health',
    'chore/weekly-health-',
  ]) {
    if (!command.includes(needle)) {
      throw new Error(`${manifest.commandFile} must mention ${needle}`);
    }
  }

  const runbook = readRepo(manifest.activationRunbook);
  if (!runbook.includes('3.3') || !runbook.includes('weekly-health-summary.md')) {
    throw new Error('weekly-health-automation.md must reference slice 3.3 and command file');
  }

  const releaseHealthWorkflow = readRepo(manifest.releaseHealthWorkflow);
  if (!releaseHealthWorkflow.includes('release:health:collect')) {
    throw new Error('release-health-gate workflow must run release health collect');
  }
}

function assertPackageScript() {
  const pkg = JSON.parse(readRepo('package.json'));
  if (!pkg.scripts?.['weekly:health:assert']) {
    throw new Error('package.json must define weekly:health:assert');
  }
}

function main() {
  const manifest = loadManifest();
  assertManifestShape(manifest);
  assertDocsAndCommand(manifest);
  assertPackageScript();
  console.log('Weekly health automation guard passed (slice=3.3).');
}

main();
