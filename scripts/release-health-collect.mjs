#!/usr/bin/env node
/**
 * Release health signal collector (slice 4.7).
 *
 * Gathers CI, smoke, uptime, and Sentry signals into a report JSON for the gate script.
 *
 * Run:
 *   npm run release:health:collect -- --report=release-health-report.json
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = path.join(repoRoot, 'product-os/04-quality/release-health-gate.json');

function parseArgs(argv) {
  const reportArg = argv.find((arg) => arg.startsWith('--report='));
  return {
    reportPath: reportArg ? reportArg.split('=')[1] : 'release-health-report.json',
  };
}

function loadManifest() {
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

function signalResult(status, detail) {
  return { status, detail };
}

function envMissing(name) {
  return !process.env[name]?.trim();
}

async function githubFetch(url) {
  const token = process.env.GITHUB_TOKEN?.trim() || process.env.GH_TOKEN?.trim();
  if (!token) {
    throw new Error('GITHUB_TOKEN unavailable');
  }
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  if (!response.ok) {
    throw new Error(`GitHub API ${response.status}: ${await response.text()}`);
  }
  return response.json();
}

async function collectCiMain(manifest) {
  const override = process.env.RELEASE_HEALTH_CI_STATUS?.trim().toLowerCase();
  if (override === 'pass' || override === 'green') {
    return signalResult('pass', 'RELEASE_HEALTH_CI_STATUS=pass override');
  }
  if (override === 'fail' || override === 'red') {
    return signalResult('fail', 'RELEASE_HEALTH_CI_STATUS=fail override');
  }

  const repo = process.env.GITHUB_REPOSITORY?.trim();
  if (!repo) {
    return signalResult('fail', 'GITHUB_REPOSITORY unavailable for ci_main collection');
  }

  const [owner, name] = repo.split('/');
  const workflowFile = manifest.ci?.workflowFile ?? 'ci.yml';
  const branch = manifest.ci?.branch ?? 'main';
  const requiredJobs = manifest.ci?.requiredJobNames ?? [];

  try {
    const runs = await githubFetch(
      `https://api.github.com/repos/${owner}/${name}/actions/workflows/${workflowFile}/runs?branch=${encodeURIComponent(branch)}&status=completed&per_page=1`,
    );
    const latestRun = runs.workflow_runs?.[0];
    if (!latestRun) {
      return signalResult('fail', `no completed ${workflowFile} runs on ${branch}`);
    }

    const jobsPayload = await githubFetch(
      `https://api.github.com/repos/${owner}/${name}/actions/runs/${latestRun.id}/jobs?per_page=100`,
    );
    const jobs = jobsPayload.jobs ?? [];
    const missing = [];
    const failed = [];

    for (const requiredName of requiredJobs) {
      const job = jobs.find((item) => item.name === requiredName);
      if (!job) {
        missing.push(requiredName);
        continue;
      }
      if (job.conclusion !== 'success' && job.conclusion !== 'skipped') {
        failed.push(`${requiredName}=${job.conclusion ?? job.status}`);
      }
    }

    if (missing.length > 0) {
      return signalResult(
        'fail',
        `missing required jobs on run ${latestRun.id}: ${missing.join(', ')}`,
      );
    }
    if (failed.length > 0) {
      return signalResult('fail', `required jobs not green: ${failed.join('; ')}`);
    }

    return signalResult(
      'pass',
      `${requiredJobs.length} required CI jobs green on ${branch} run ${latestRun.id}`,
    );
  } catch (error) {
    return signalResult('fail', error instanceof Error ? error.message : 'ci_main collection failed');
  }
}

function runNodeScript(relativeScript, args = []) {
  const scriptPath = path.join(repoRoot, relativeScript);
  const result = spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: repoRoot,
    env: process.env,
    encoding: 'utf8',
  });
  return {
    ok: result.status === 0,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    status: result.status ?? 1,
  };
}

function collectMarketingSmoke(signalDef) {
  if (envMissing(signalDef.skipWhenEnvMissing ?? 'MARKETING_SMOKE_BASE_URL')) {
    return signalResult('skip', `${signalDef.skipWhenEnvMissing ?? 'MARKETING_SMOKE_BASE_URL'} not configured`);
  }

  const result = runNodeScript('apps/marketing/scripts/marketing-post-deploy-smoke.mjs');
  if (result.ok) {
    return signalResult('pass', 'marketing post-deploy smoke passed');
  }
  const detail = (result.stderr || result.stdout || 'marketing post-deploy smoke failed').trim().split('\n').at(-1);
  return signalResult('fail', detail ?? 'marketing post-deploy smoke failed');
}

function collectUptimeProbes(signalDef) {
  if (envMissing(signalDef.skipWhenEnvMissing ?? 'MARKETING_SMOKE_BASE_URL')) {
    return signalResult('skip', `${signalDef.skipWhenEnvMissing ?? 'MARKETING_SMOKE_BASE_URL'} not configured`);
  }

  const result = runNodeScript('scripts/uptime-probes-run.mjs');
  if (result.ok) {
    return signalResult('pass', 'uptime probes passed');
  }
  const detail = (result.stderr || result.stdout || 'uptime probes failed').trim().split('\n').at(-1);
  return signalResult('fail', detail ?? 'uptime probes failed');
}

async function collectSentryCleanWindow(manifest, signalDef) {
  if (envMissing(signalDef.skipWhenEnvMissing ?? 'SENTRY_RELEASE_HEALTH_AUTH_TOKEN')) {
    return signalResult(
      'skip',
      `${signalDef.skipWhenEnvMissing ?? 'SENTRY_RELEASE_HEALTH_AUTH_TOKEN'} not configured`,
    );
  }

  const token = process.env.SENTRY_RELEASE_HEALTH_AUTH_TOKEN.trim();
  const org = process.env.SENTRY_RELEASE_HEALTH_ORG?.trim();
  const project = process.env.SENTRY_RELEASE_HEALTH_PROJECT?.trim();
  if (!org || !project) {
    return signalResult(
      'fail',
      'SENTRY_RELEASE_HEALTH_ORG and SENTRY_RELEASE_HEALTH_PROJECT are required when auth token is set',
    );
  }

  const windowMinutes = manifest.thresholds?.sentryWindowMinutes ?? 15;
  const maxIssues = manifest.thresholds?.sentryMaxNewIssues ?? 0;
  const apiBase = (process.env.SENTRY_RELEASE_HEALTH_API_BASE ?? 'https://sentry.io').replace(/\/$/, '');
  const query = encodeURIComponent(`is:unresolved firstSeen:-${windowMinutes}m`);
  const url = `${apiBase}/api/0/projects/${encodeURIComponent(org)}/${encodeURIComponent(project)}/issues/?query=${query}`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });
    if (!response.ok) {
      const detail = (await response.text()).trim().slice(0, 160);
      return signalResult('fail', `Sentry API ${response.status}${detail ? `: ${detail}` : ''}`);
    }
    const issues = await response.json();
    const count = Array.isArray(issues) ? issues.length : 0;
    if (count > maxIssues) {
      return signalResult('fail', `${count} unresolved issue(s) in ${windowMinutes}m window (max ${maxIssues})`);
    }
    return signalResult('pass', `${count} unresolved issue(s) in ${windowMinutes}m window`);
  } catch (error) {
    return signalResult('fail', error instanceof Error ? error.message : 'Sentry collection failed');
  }
}

async function collectSignal(manifest, signalDef) {
  switch (signalDef.id) {
    case 'ci_main':
      return collectCiMain(manifest);
    case 'marketing_post_deploy_smoke':
      return collectMarketingSmoke(signalDef);
    case 'uptime_probes':
      return collectUptimeProbes(signalDef);
    case 'sentry_clean_window':
      return collectSentryCleanWindow(manifest, signalDef);
    default:
      return signalResult('fail', `unknown signal id ${signalDef.id}`);
  }
}

async function main() {
  const { reportPath } = parseArgs(process.argv.slice(2));
  const manifest = loadManifest();
  const signals = {};

  for (const signalDef of manifest.signals) {
    signals[signalDef.id] = await collectSignal(manifest, signalDef);
    console.log(`[${signals[signalDef.id].status}] ${signalDef.id}: ${signals[signalDef.id].detail}`);
  }

  const report = {
    generatedAt: new Date().toISOString(),
    releaseRef: process.env.RELEASE_HEALTH_RELEASE_REF?.trim() || `${manifest.ci?.branch ?? 'main'}@local`,
    signals,
  };

  const absolutePath = path.isAbsolute(reportPath) ? reportPath : path.join(process.cwd(), reportPath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`\nWrote release health report: ${absolutePath}`);
}

main().catch((error) => {
  console.error(`release-health-collect error: ${error.message}`);
  process.exit(1);
});
