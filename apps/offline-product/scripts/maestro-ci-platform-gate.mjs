#!/usr/bin/env node
/**
 * Maestro CI cost gate — skip macOS/Android golden path when safe on pull_request.
 *
 * PR rules (H25 cost guard):
 * - Run a platform when its path filter matched OR shared Maestro paths matched.
 * - Else run when that platform has never succeeded on this PR yet.
 * - Else skip (e.g. iOS already green + android-only push).
 *
 * push / workflow_dispatch: always run both (full gate on main; manual override).
 *
 * Outputs (GITHUB_OUTPUT): run_ios, run_android, skip_reason_ios, skip_reason_android
 */
import fs from 'node:fs';
import { appendFileSync } from 'node:fs';

const IOS_JOB = 'Maestro golden path (macOS)';
const ANDROID_JOB = 'Maestro golden path (Android)';

function writeOutput(name, value) {
  const out = process.env.GITHUB_OUTPUT;
  if (!out) {
    console.log(`[gate] ${name}=${value}`);
    return;
  }
  appendFileSync(out, `${name}=${value}\n`);
}

function parseEvent() {
  const path = process.env.GITHUB_EVENT_PATH;
  if (!path || !fs.existsSync(path)) return {};
  return JSON.parse(fs.readFileSync(path, 'utf8'));
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
  const iosOnly = ios && !android && !shared;

  if (ios || shared) {
    return { run: true, reason: 'paths_ios_or_shared' };
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

  if (android || shared) {
    return { run: true, reason: 'paths_android_or_shared' };
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
  const event = parseEvent();
  const eventName = process.env.GITHUB_EVENT_NAME ?? 'unknown';
  const paths = {
    ios: flag('MAESTRO_PATH_IOS'),
    android: flag('MAESTRO_PATH_ANDROID'),
    shared: flag('MAESTRO_PATH_SHARED'),
  };

  let iosGreen = false;
  let androidGreen = false;
  const prNumber = event.pull_request?.number;

  if (eventName === 'pull_request' && prNumber) {
    [iosGreen, androidGreen] = await Promise.all([
      platformSucceededOnPr(prNumber, IOS_JOB),
      platformSucceededOnPr(prNumber, ANDROID_JOB),
    ]);
    console.log(`[gate] PR #${prNumber} prior green: ios=${iosGreen} android=${androidGreen}`);
  }

  const ios = decidePlatform({ eventName, paths, prNumber, iosGreen, androidGreen });
  const android = decideAndroid({ eventName, paths, androidGreen });

  console.log(`[gate] run_ios=${ios.run} (${ios.reason})`);
  console.log(`[gate] run_android=${android.run} (${android.reason})`);

  writeOutput('run_ios', ios.run ? 'true' : 'false');
  writeOutput('run_android', android.run ? 'true' : 'false');
  writeOutput('skip_reason_ios', ios.reason);
  writeOutput('skip_reason_android', android.reason);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
