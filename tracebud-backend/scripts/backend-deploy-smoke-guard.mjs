#!/usr/bin/env node
/**
 * Guardrail 2.6 — backend post-deploy smoke vs manifest baseline.
 *
 * Run: npm run deploy:smoke:assert -w tracebud-backend
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.join(backendRoot, '..');

function readBackend(relativePath) {
  const fullPath = path.join(backendRoot, relativePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing required file: ${relativePath}`);
  }
  return fs.readFileSync(fullPath, 'utf8');
}

function readRepo(relativePath) {
  const fullPath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing required file: ${relativePath}`);
  }
  return fs.readFileSync(fullPath, 'utf8');
}

function loadManifest() {
  try {
    return JSON.parse(readBackend('qa/automation-baselines/backend-deploy-smoke.json'));
  } catch (error) {
    throw new Error(`Invalid backend-deploy-smoke.json: ${error.message}`);
  }
}

function assertManifestShape(manifest) {
  if (manifest.schemaVersion !== 1) {
    throw new Error('manifest schemaVersion must be 1');
  }
  if (manifest.slice !== '2.6') {
    throw new Error('manifest slice must be 2.6');
  }
  if (!manifest.runnerModule || !manifest.workflowFile) {
    throw new Error('manifest must define runnerModule and workflowFile');
  }
  if (manifest.healthPath !== '/api/health') {
    throw new Error('manifest healthPath must be /api/health');
  }
  if (manifest.healthExpectJson?.status !== 'ok') {
    throw new Error('manifest healthExpectJson.status must be ok');
  }
  if (manifest.authProbe?.path !== '/api/v1/launch/onboarding') {
    throw new Error('manifest authProbe.path must be /api/v1/launch/onboarding');
  }
  if (manifest.authProbe?.bearerEnv !== 'TRACEBUD_SMOKE_BEARER_TOKEN') {
    throw new Error('manifest authProbe.bearerEnv must be TRACEBUD_SMOKE_BEARER_TOKEN');
  }
}

function assertRunnerAlignment(manifest) {
  readBackend(manifest.runnerModule);
  const runner = readBackend(manifest.runnerModule);
  if (!runner.includes('backend-deploy-smoke.json')) {
    throw new Error(`${manifest.runnerModule} must load backend-deploy-smoke.json`);
  }
  if (!runner.includes('checkHealth')) {
    throw new Error(`${manifest.runnerModule} must check /api/health`);
  }
  if (!runner.includes('checkAuthProbe')) {
    throw new Error(`${manifest.runnerModule} must run authenticated auth probe`);
  }
  if (!runner.includes('waitForHealthyDeploy')) {
    throw new Error(`${manifest.runnerModule} must support deploy wait polling`);
  }
}

function assertWorkflow(manifest) {
  const workflow = readRepo(manifest.workflowFile);
  if (!workflow.includes('run-backend-deploy-smoke.mjs')) {
    throw new Error(`${manifest.workflowFile} must run backend deploy smoke script`);
  }
  if (!workflow.includes('repository_dispatch')) {
    throw new Error(`${manifest.workflowFile} must accept repository_dispatch for Railway webhook`);
  }
}

function assertLaunchController(manifest) {
  const controller = readBackend('src/launch/launch.controller.ts');
  if (!controller.includes("@Get('onboarding')")) {
    throw new Error('launch.controller must expose GET onboarding auth probe route');
  }
}

function assertPackageScripts() {
  const pkg = JSON.parse(readBackend('package.json'));
  if (!pkg.scripts?.['deploy:smoke']) {
    throw new Error('package.json must define deploy:smoke script');
  }
  if (!pkg.scripts?.['deploy:smoke:assert']) {
    throw new Error('package.json must define deploy:smoke:assert script');
  }
}

function main() {
  const manifest = loadManifest();
  assertManifestShape(manifest);
  assertRunnerAlignment(manifest);
  assertWorkflow(manifest);
  assertLaunchController(manifest);
  assertPackageScripts();
  console.log('Backend deploy smoke guard passed (slice 2.6).');
}

main();
