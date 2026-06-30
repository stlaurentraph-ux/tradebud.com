#!/usr/bin/env node
/**
 * Maestro CI cost gate — skip macOS/Android golden path when safe on pull_request.
 *
 * PR rules (H25 cost guard):
 * - Run a platform when its path filter matched OR shared Maestro paths matched.
 * - Else run when that platform has never succeeded on this PR yet.
 * - Else skip (e.g. iOS already green + android-only push).
 *
 * push / workflow_dispatch: full matrix unless e2eBypass.enabled (pilot window).
 *
 * Pilot bypass: product-os/04-quality/maestro-golden-path-ci.json → e2eBypass.enabled
 * skips all emulator E2E (PR, push, dispatch). Static preflight still runs.
 * Override: MAESTRO_FORCE_E2E=1 or workflow_dispatch force_e2e input.
 *
 * Outputs (GITHUB_OUTPUT): run_ios, run_android, run_android_smoke, run_android_golden,
 * skip_reason_ios, skip_reason_android, e2e_bypass
 */
import fs from 'node:fs';
import path from 'node:path';
import { appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const IOS_JOB = 'Maestro golden path (macOS)';
const ANDROID_SMOKE_JOB = 'Maestro Android smoke (PR)';
const ANDROID_GOLDEN_JOB = 'Maestro golden path (Android)';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '../../..');
const manifestPath = path.join(repoRoot, 'product-os/04-quality/maestro-golden-path-ci.json');

function writeOutput(name, value) {
  const out = process.env.GITHUB_OUTPUT;
  if (!out) {
    console.log(`[gate] ${name}=${value}`);
    return;
  }
  appendFileSync(out, `${name}=${value}\n`);
}

function writeBypassOutputs(reason) {
  writeOutput('run_ios', 'false');
  writeOutput('run_android', 'false');
  writeOutput('run_android_smoke', 'false');
  writeOutput('run_android_golden', 'false');
  writeOutput('skip_reason_ios', reason);
  writeOutput('skip_reason_android', reason);
  writeOutput('e2e_bypass', 'true');
}

function writeFullMatrixOutputs() {
  writeOutput('run_ios', 'true');
  writeOutput('run_android', 'true');
  writeOutput('run_android_smoke', 'false');
  writeOutput('run_android_golden', 'true');
  writeOutput('skip_reason_ios', 'full_matrix');
  writeOutput('skip_reason_android', 'full_matrix');
  writeOutput('e2e_bypass', 'false');
}

function loadManifest() {
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Missing manifest: ${manifestPath}`);
  }
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

function isE2eBypassActive(manifest) {
  if (process.env.MAESTRO_FORCE_E2E === '1') {
    console.log('[gate] MAESTRO_FORCE_E2E=1 — bypass disabled for this run');
    return false;
  }
  const bypass = manifest.e2eBypass;
  if (!bypass?.enabled) {
    return false;
  }
  if (!bypass.reason?.trim()) {
    throw new Error('maestro-golden-path-ci.json e2eBypass.enabled requires a non-empty reason');
  }
  if (bypass.allowedUntil) {
    const until = new Date(`${bypass.allowedUntil}T23:59:59Z`);
    if (Number.isNaN(until.getTime())) {
      throw new Error(`maestro-golden-path-ci.json e2eBypass.allowedUntil invalid: ${bypass.allowedUntil}`);
    }
    if (Date.now() > until.getTime()) {
      console.warn(`[gate] e2eBypass expired (${bypass.allowedUntil}) — running E2E`);
      return false;
    }
  }
  console.log(`[gate] e2eBypass active: ${bypass.reason}`);
  return true;
}

function parseEvent() {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath || !fs.existsSync(eventPath)) return {};
  return JSON.parse(fs.readFileSync(eventPath, 'utf8'));
}

function flag(name) {
  return process.env[name] === 'true';
}

async function githubRequest(pathname) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN is required for maestro-ci-platform-gate');
  const repo = process.env.GITHUB_REPOSITORY;
  const url = `https://api.github.com/repos/${repo}${pathname}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub API ${pathname} failed (${res.status}): ${body.slice(0, 300)}`);
  }
  return res.json();
}

async function platformSucceededOnPr(prNumber, jobName) {
  const commits = await githubRequest(`/pulls/${prNumber}/commits?per_page=100`);
  for (const commit of commits) {
    const sha = commit.sha;
    const data = await githubRequest(
      `/commits/${sha}/check-runs?check_name=${encodeURIComponent(jobName)}&per_page=20`,
    );
    if (data.check_runs?.some((run) => run.conclusion === 'success')) {
      return true;
    }
  }
  return false;
}

function decidePlatform({ eventName, paths, prNumber, iosGreen, androidGreen }) {
  if (eventName !== 'pull_request') {
    return { run: true, reason: 'full_matrix' };
  }

  const { ios, android, shared } = paths;
  const androidOnly = android && !ios && !shared;
  const sharedOnly = shared && !ios && !android;

  if (ios) {
    return { run: true, reason: 'paths_ios' };
  }
  if (sharedOnly && iosGreen) {
    return { run: false, reason: 'ios_already_green_shared_only_delta' };
  }
  if (shared) {
    return { run: true, reason: 'paths_shared' };
  }
  if (androidOnly && iosGreen) {
    return { run: false, reason: 'ios_already_green_android_only_delta' };
  }
  if (!iosGreen) {
    return { run: true, reason: 'ios_not_green_on_pr' };
  }
  return { run: false, reason: 'ios_already_green' };
}

function decideAndroid({ eventName, paths, androidGreen }) {
  if (eventName !== 'pull_request') {
    return { run: true, reason: 'full_matrix' };
  }

  const { ios, android, shared } = paths;
  const iosOnly = ios && !android && !shared;
  const sharedOnly = shared && !ios && !android;

  if (android) {
    return { run: true, reason: 'paths_android' };
  }
  if (sharedOnly && androidGreen) {
    return { run: false, reason: 'android_already_green_shared_only_delta' };
  }
  if (shared) {
    return { run: true, reason: 'paths_shared' };
  }
  if (iosOnly && androidGreen) {
    return { run: false, reason: 'android_already_green_ios_only_delta' };
  }
  if (!androidGreen) {
    return { run: true, reason: 'android_not_green_on_pr' };
  }
  return { run: false, reason: 'android_already_green' };
}

async function main() {
  const manifest = loadManifest();
  if (isE2eBypassActive(manifest)) {
    writeBypassOutputs('e2e_bypass_pilot');
    return;
  }

  const event = parseEvent();
  const eventName = process.env.GITHUB_EVENT_NAME ?? 'unknown';
  const paths = {
    ios: flag('MAESTRO_PATH_IOS'),
    android: flag('MAESTRO_PATH_ANDROID'),
    shared: flag('MAESTRO_PATH_SHARED'),
  };

  if (eventName !== 'pull_request') {
    writeFullMatrixOutputs();
    return;
  }

  let iosGreen = false;
  let androidGreen = false;
  const prNumber = event.pull_request?.number;

  if (prNumber) {
    [iosGreen, androidGreen] = await Promise.all([
      platformSucceededOnPr(prNumber, IOS_JOB),
      platformSucceededOnPr(prNumber, ANDROID_SMOKE_JOB),
    ]);
    console.log(`[gate] PR #${prNumber} prior green: ios=${iosGreen} android_smoke=${androidGreen}`);
  }

  const ios = decidePlatform({ eventName, paths, prNumber, iosGreen, androidGreen });
  const android = decideAndroid({ eventName, paths, androidGreen });

  const runAndroidSmoke = android.run;
  const runAndroidGolden = false;

  console.log(`[gate] run_ios=${ios.run} (${ios.reason})`);
  console.log(`[gate] run_android_smoke=${runAndroidSmoke} (${android.reason})`);
  console.log(`[gate] run_android_golden=${runAndroidGolden} (pr_smoke_only)`);

  writeOutput('run_ios', ios.run ? 'true' : 'false');
  writeOutput('run_android_smoke', runAndroidSmoke ? 'true' : 'false');
  writeOutput('run_android_golden', runAndroidGolden ? 'true' : 'false');
  writeOutput('run_android', runAndroidSmoke || runAndroidGolden ? 'true' : 'false');
  writeOutput('skip_reason_ios', ios.reason);
  writeOutput('skip_reason_android', android.reason);
  writeOutput('e2e_bypass', 'false');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
