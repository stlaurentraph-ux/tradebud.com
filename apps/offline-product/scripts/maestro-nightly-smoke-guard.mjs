#!/usr/bin/env node
/**
 * Guardrail 4.8 — Maestro nightly smoke manifest vs flow baseline and runner wiring.
 *
 * Run: npm run qa:maestro:nightly:assert
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.join(root, '../..');

function read(relativePath) {
  const fullPath = path.join(root, relativePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing required file: ${relativePath}`);
  }
  return fs.readFileSync(fullPath, 'utf8');
}

function loadJson(relativePath) {
  try {
    return JSON.parse(read(relativePath));
  } catch (error) {
    throw new Error(`Invalid ${relativePath}: ${error.message}`);
  }
}

function assertManifestShape(manifest) {
  if (manifest.schemaVersion !== 1) {
    throw new Error('manifest schemaVersion must be 1');
  }
  if (manifest.slice !== '4.8') {
    throw new Error('manifest slice must be 4.8');
  }
  if (!manifest.flowsBaseline || !manifest.scheduleUtcCron) {
    throw new Error('manifest must define flowsBaseline and scheduleUtcCron');
  }
  if (!Array.isArray(manifest.nightlyFlows) || manifest.nightlyFlows.length < 2) {
    throw new Error('manifest must define at least two nightly smoke flows');
  }
}

function assertFlowsBaseline(manifest) {
  const flowsBaseline = loadJson(manifest.flowsBaseline);
  const allowed = new Set(flowsBaseline.flows ?? []);
  const golden = flowsBaseline.goldenPathFlow;

  if (!golden || !allowed.has(golden)) {
    throw new Error(`${manifest.flowsBaseline} must define goldenPathFlow in flows list`);
  }

  const nightlyFiles = manifest.nightlyFlows.map((item) => item.flowFile);
  if (!nightlyFiles.includes(golden)) {
    throw new Error(`nightly smoke must include goldenPathFlow ${golden}`);
  }

  for (const item of manifest.nightlyFlows) {
    if (!allowed.has(item.flowFile)) {
      throw new Error(`nightly flow ${item.flowFile} is not listed in ${manifest.flowsBaseline}`);
    }
    const flowPath = path.join(root, '.maestro/flows', item.flowFile);
    if (!fs.existsSync(flowPath)) {
      throw new Error(`missing Maestro flow file ${item.flowFile}`);
    }
  }
}

function assertBootstrapSeedsSimulatorDb() {
  const bootstrap = read('scripts/maestro-ci-bootstrap-simulator.sh');
  if (!bootstrap.includes('seed-maestro-simulator.mjs')) {
    throw new Error('maestro-ci-bootstrap-simulator.sh must seed simulator DB before flows');
  }
  if (!bootstrap.includes('MAESTRO_SEED_SKIP')) {
    throw new Error('bootstrap must support MAESTRO_SEED_SKIP escape hatch');
  }
}

function assertPlotDocumentFlowsUseSeededPlot() {
  for (const flowFile of ['land-title-photo.yaml', 'tenure-evidence.yaml']) {
    const flow = read(path.join('.maestro/flows', flowFile));
    if (!flow.includes('Finca Norte')) {
      throw new Error(`${flowFile} must assert seeded plot Finca Norte`);
    }
    if (!flow.includes('tab-my-plots')) {
      throw new Error(`${flowFile} must navigate via tab-my-plots testID`);
    }
  }
}

function assertRunnerScripts(manifest) {
  assertBootstrapSeedsSimulatorDb();
  assertPlotDocumentFlowsUseSeededPlot();
  read('scripts/maestro-ci-bootstrap-simulator.sh');
  const nightly = read('scripts/maestro-ci-nightly-smoke.sh');
  if (!nightly.includes('maestro-ci-bootstrap-simulator.sh')) {
    throw new Error('nightly runner must bootstrap simulator before flows');
  }
  if (!nightly.includes('maestro-nightly-smoke.json')) {
    throw new Error('nightly runner must load maestro-nightly-smoke.json');
  }
  for (const item of manifest.nightlyFlows) {
    if (!nightly.includes(item.flowFile) && !nightly.includes('manifest.nightlyFlows')) {
      throw new Error(`nightly runner must execute ${item.flowFile}`);
    }
  }

  const golden = read('scripts/maestro-ci-golden-path.sh');
  if (!golden.includes('maestro-ci-bootstrap-simulator.sh')) {
    throw new Error('golden path runner must reuse simulator bootstrap script');
  }
}

function assertWorkflowSchedule(manifest) {
  const workflowPath = path.join(repoRoot, '.github/workflows/offline-maestro-nightly.yml');
  if (!fs.existsSync(workflowPath)) {
    throw new Error('Missing .github/workflows/offline-maestro-nightly.yml');
  }
  const workflow = fs.readFileSync(workflowPath, 'utf8');
  if (!workflow.includes(manifest.scheduleUtcCron)) {
    throw new Error('offline-maestro-nightly.yml must use manifest scheduleUtcCron');
  }
  if (!workflow.includes('qa:maestro:nightly')) {
    throw new Error('offline-maestro-nightly.yml must run qa:maestro:nightly');
  }
  if (!workflow.includes('macos-latest')) {
    throw new Error('offline-maestro-nightly.yml must run on macos-latest');
  }
}

function assertPackageScripts() {
  const pkg = JSON.parse(read('package.json'));
  if (!pkg.scripts?.['qa:maestro:nightly']) {
    throw new Error('package.json must define qa:maestro:nightly script');
  }
  if (!pkg.scripts?.['qa:maestro:nightly:assert']) {
    throw new Error('package.json must define qa:maestro:nightly:assert script');
  }
}

function assertSignedOutBackupFlow(manifest) {
  const signedOut = manifest.nightlyFlows.find(
    (item) => item.flowFile === 'signed-out-backup-status-smoke.yaml',
  );
  if (!signedOut) {
    throw new Error(
      'nightly smoke must include signed-out-backup-status-smoke.yaml (DEVICE_SMOKE §10 subset)',
    );
  }
  if (signedOut.seedProfile !== 'backed_up_offline') {
    throw new Error('signed-out-backup-status-smoke must use seedProfile backed_up_offline');
  }
  const seed = read('scripts/seed-maestro-simulator.mjs');
  if (!seed.includes('backed_up_offline')) {
    throw new Error('seed-maestro-simulator.mjs must support backed_up_offline profile');
  }
}

function assertCrossDeviceRestoreFlow(manifest) {
  const crossDevice = manifest.nightlyFlows.find((item) => item.flowFile === 'cross-device-restore-smoke.yaml');
  if (!crossDevice) {
    throw new Error('nightly smoke must include cross-device-restore-smoke.yaml (DEVICE_SMOKE §12 subset)');
  }
  if (crossDevice.seedProfile !== 'cross_device_b') {
    throw new Error('cross-device-restore-smoke must use seedProfile cross_device_b');
  }
  const seed = read('scripts/seed-maestro-simulator.mjs');
  if (!seed.includes('cross_device_b')) {
    throw new Error('seed-maestro-simulator.mjs must support cross_device_b profile');
  }
  const nightly = read('scripts/maestro-ci-nightly-smoke.sh');
  if (!nightly.includes('MAESTRO_SEED_PROFILE')) {
    throw new Error('nightly runner must re-seed per flow seedProfile');
  }
}

function main() {
  const manifest = loadJson('qa/automation-baselines/maestro-nightly-smoke.json');
  assertManifestShape(manifest);
  assertFlowsBaseline(manifest);
  assertCrossDeviceRestoreFlow(manifest);
  assertSignedOutBackupFlow(manifest);
  assertRunnerScripts(manifest);
  assertWorkflowSchedule(manifest);
  assertPackageScripts();
  console.log(
    `Maestro nightly smoke guard passed (${manifest.nightlyFlows.length} flows, cron=${manifest.scheduleUtcCron}).`,
  );
}

main();
