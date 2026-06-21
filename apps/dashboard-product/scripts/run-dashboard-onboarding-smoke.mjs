#!/usr/bin/env node
/**
 * Dashboard Vercel post-deploy smoke (slice 2.5).
 *
 * Run: npm run deploy:smoke -w dashboard-product
 *
 * Invokes scripts/launch-onboarding-proxy-smoke.mjs after deploy readiness polling.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const dashboardRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = path.join(
  dashboardRoot,
  'qa/automation-baselines/dashboard-onboarding-smoke.json',
);

function loadManifest() {
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

function resolveBaseUrl(manifest) {
  const fromEnv = process.env[manifest.envBaseUrl]?.trim();
  const base = fromEnv || manifest.fallbackBaseUrl;
  return base.replace(/\/+$/, '');
}

async function checkReadiness(manifest, baseUrl) {
  const url = `${baseUrl}${manifest.readinessPath}`;
  const timeoutMs = Number(process.env.DASHBOARD_SMOKE_TIMEOUT_MS ?? manifest.requestTimeoutMs);
  const response = await fetch(url, {
    method: 'GET',
    redirect: 'manual',
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!manifest.readinessExpectStatus.includes(response.status)) {
    throw new Error(
      `readiness ${manifest.readinessPath} expected status ${manifest.readinessExpectStatus.join('|')} got ${response.status}`,
    );
  }
}

async function waitForDeploy(manifest, baseUrl) {
  if (process.env.DASHBOARD_SMOKE_WAIT_FOR_DEPLOY !== '1') {
    await checkReadiness(manifest, baseUrl);
    return;
  }

  const deadline = Date.now() + manifest.deployWait.maxWaitMs;
  let attempt = 0;
  while (Date.now() < deadline) {
    attempt += 1;
    try {
      await checkReadiness(manifest, baseUrl);
      console.log(`deploy ready after ${attempt} attempt(s)`);
      return;
    } catch (error) {
      console.warn(`deploy wait attempt ${attempt}: ${error.message}`);
      await new Promise((resolve) => setTimeout(resolve, manifest.deployWait.pollIntervalMs));
    }
  }
  throw new Error(`dashboard not ready within ${manifest.deployWait.maxWaitMs}ms`);
}

function runProxySmoke(manifest) {
  const scriptPath = path.join(dashboardRoot, manifest.proxySmokeModule);
  const result = spawnSync(process.execPath, [scriptPath], {
    stdio: 'inherit',
    env: process.env,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

async function main() {
  const manifest = loadManifest();
  const baseUrl = resolveBaseUrl(manifest);
  const bearer = process.env[manifest.bearerEnv]?.trim();

  if (!process.env[manifest.envBaseUrl]?.trim() && process.env.DASHBOARD_SMOKE_REQUIRE_SECRET === '1') {
    console.error(`Missing ${manifest.envBaseUrl}`);
    process.exit(1);
  }
  if (!bearer) {
    console.error(`Missing ${manifest.bearerEnv}`);
    process.exit(1);
  }

  process.env.DASHBOARD_BASE_URL = baseUrl;
  process.env.TRACEBUD_SMOKE_ROLE ??= manifest.smoke.role;
  process.env.TRACEBUD_SMOKE_STEP_KEY ??= manifest.smoke.onboardingStepKey;

  console.log(
    `dashboard-onboarding-smoke base=${baseUrl} wait=${process.env.DASHBOARD_SMOKE_WAIT_FOR_DEPLOY === '1'}`,
  );

  await waitForDeploy(manifest, baseUrl);
  runProxySmoke(manifest);
  console.log('Dashboard post-deploy smoke passed.');
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
