#!/usr/bin/env node
/**
 * Guardrail 2.5 — dashboard onboarding post-deploy smoke vs manifest baseline.
 *
 * Run: npm run deploy:smoke:assert -w dashboard-product
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dashboardRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.join(dashboardRoot, '..', '..');

function readDashboard(relativePath) {
  const fullPath = path.join(dashboardRoot, relativePath);
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
    return JSON.parse(readDashboard('qa/automation-baselines/dashboard-onboarding-smoke.json'));
  } catch (error) {
    throw new Error(`Invalid dashboard-onboarding-smoke.json: ${error.message}`);
  }
}

function loadGoldenManifest() {
  return JSON.parse(readRepo('product-os/04-quality/golden-staging-tenant.json'));
}

function assertManifestShape(manifest) {
  if (manifest.schemaVersion !== 1) {
    throw new Error('manifest schemaVersion must be 1');
  }
  if (manifest.slice !== '2.5') {
    throw new Error('manifest slice must be 2.5');
  }
  if (!manifest.runnerModule || !manifest.proxySmokeModule || !manifest.workflowFile) {
    throw new Error('manifest must define runnerModule, proxySmokeModule, and workflowFile');
  }
  if (manifest.envBaseUrl !== 'DASHBOARD_BASE_URL') {
    throw new Error('manifest envBaseUrl must be DASHBOARD_BASE_URL');
  }
  if (manifest.bearerEnv !== 'TRACEBUD_SMOKE_BEARER_TOKEN') {
    throw new Error('manifest bearerEnv must be TRACEBUD_SMOKE_BEARER_TOKEN');
  }
  if (manifest.onboardingProxy?.getPath !== '/api/launch/onboarding') {
    throw new Error('manifest onboardingProxy.getPath must be /api/launch/onboarding');
  }
  if (manifest.onboardingProxy?.postPath !== '/api/launch/onboarding') {
    throw new Error('manifest onboardingProxy.postPath must be /api/launch/onboarding');
  }
}

function assertGoldenAlignment(manifest, golden) {
  if (manifest.smoke.role !== golden.smoke.role) {
    throw new Error('manifest smoke.role must match golden-staging-tenant.json');
  }
  if (manifest.smoke.onboardingStepKey !== golden.smoke.onboardingStepKey) {
    throw new Error('manifest smoke.onboardingStepKey must match golden-staging-tenant.json');
  }
}

function assertRunnerAlignment(manifest) {
  readDashboard(manifest.runnerModule);
  const runner = readDashboard(manifest.runnerModule);
  if (!runner.includes('dashboard-onboarding-smoke.json')) {
    throw new Error(`${manifest.runnerModule} must load dashboard-onboarding-smoke.json`);
  }
  if (!runner.includes('waitForDeploy')) {
    throw new Error(`${manifest.runnerModule} must support deploy wait polling`);
  }
  const proxyBasename = path.basename(manifest.proxySmokeModule);
  if (!runner.includes(proxyBasename)) {
    throw new Error(`${manifest.runnerModule} must invoke ${proxyBasename}`);
  }
}

function assertProxySmokeScript(manifest) {
  const proxySmoke = readDashboard(manifest.proxySmokeModule);
  if (!proxySmoke.includes('/api/launch/onboarding')) {
    throw new Error(`${manifest.proxySmokeModule} must call onboarding proxy routes`);
  }
  if (!proxySmoke.includes('TRACEBUD_SMOKE_BEARER_TOKEN')) {
    throw new Error(`${manifest.proxySmokeModule} must require TRACEBUD_SMOKE_BEARER_TOKEN`);
  }
}

function assertWorkflow(manifest) {
  const workflow = readRepo(manifest.workflowFile);
  if (!workflow.includes('run-dashboard-onboarding-smoke.mjs')) {
    throw new Error(`${manifest.workflowFile} must run dashboard onboarding smoke script`);
  }
  if (!workflow.includes('deployment_status')) {
    throw new Error(`${manifest.workflowFile} must trigger on Vercel deployment_status`);
  }
  if (!workflow.includes('DASHBOARD_BASE_URL')) {
    throw new Error(`${manifest.workflowFile} must pass DASHBOARD_BASE_URL secret`);
  }
}

function assertPackageScripts() {
  const pkg = JSON.parse(readDashboard('package.json'));
  if (!pkg.scripts?.['deploy:smoke']) {
    throw new Error('package.json must define deploy:smoke script');
  }
  if (!pkg.scripts?.['deploy:smoke:assert']) {
    throw new Error('package.json must define deploy:smoke:assert script');
  }
}

function main() {
  const manifest = loadManifest();
  const golden = loadGoldenManifest();
  assertManifestShape(manifest);
  assertGoldenAlignment(manifest, golden);
  assertRunnerAlignment(manifest);
  assertProxySmokeScript(manifest);
  assertWorkflow(manifest);
  assertPackageScripts();
  console.log('Dashboard onboarding smoke guard passed (slice 2.5).');
}

main();
