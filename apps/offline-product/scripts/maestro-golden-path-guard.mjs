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
  if (!manifest.workflowFile || !manifest.goldenPathFlow) {
    throw new Error('manifest must define workflowFile and goldenPathFlow');
  }
  if (!manifest.ciTriggers?.includes('pull_request')) {
    throw new Error('manifest must include pull_request trigger for golden path');
  }
}

function assertFlowsBaseline(manifest) {
  const baseline = JSON.parse(readOffline(manifest.flowsBaseline));
  if (baseline.goldenPathFlow !== manifest.goldenPathFlow) {
    throw new Error('maestro-flows goldenPathFlow must match manifest');
  }
}

function assertAndroidRunner(manifest) {
  readOffline('scripts/maestro-ci-bootstrap-emulator.sh');
  const androidGolden = readOffline('scripts/maestro-ci-golden-path-android.sh');
  if (!androidGolden.includes('maestro-ci-bootstrap-emulator.sh')) {
    throw new Error('Android golden path must reuse emulator bootstrap');
  }
}

function assertWorkflow(manifest) {
  const workflow = readRepo(manifest.workflowFile);
  if (!workflow.includes(manifest.iosJobName)) {
    throw new Error(`${manifest.workflowFile} must define ${manifest.iosJobName} job`);
  }
  if (!workflow.includes(manifest.androidJobName)) {
    throw new Error(`${manifest.workflowFile} must define ${manifest.androidJobName} job`);
  }
  if (!workflow.includes('pull_request')) {
    throw new Error(`${manifest.workflowFile} golden path must run on pull_request`);
  }
  if (!workflow.includes('android-emulator-runner')) {
    throw new Error(`${manifest.workflowFile} must use android-emulator-runner for Android lane`);
  }
  if (!workflow.includes('qa:maestro:golden-path:android')) {
    throw new Error(`${manifest.workflowFile} must run qa:maestro:golden-path:android`);
  }

  const workflowBody = workflow;
  if (
    !workflowBody.includes("github.event_name == 'pull_request'") ||
    !workflowBody.includes('maestro-golden-path:')
  ) {
    throw new Error('offline-maestro.yml must run golden path jobs on pull_request');
  }
}

function assertPackageScripts() {
  const pkg = JSON.parse(readOffline('package.json'));
  if (!pkg.scripts?.['qa:maestro:golden-path:android']) {
    throw new Error('package.json must define qa:maestro:golden-path:android');
  }
  if (!pkg.scripts?.['qa:maestro:golden-path:assert']) {
    throw new Error('package.json must define qa:maestro:golden-path:assert');
  }
}

function main() {
  const manifest = loadManifest();
  assertManifestShape(manifest);
  assertFlowsBaseline(manifest);
  assertAndroidRunner(manifest);
  assertWorkflow(manifest);
  assertPackageScripts();
  console.log('Maestro golden path CI guard passed (H25).');
}

main();
