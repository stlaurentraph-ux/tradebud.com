#!/usr/bin/env node
/**
 * Mobile rollout SLO collector (offline slice 4.O.1).
 *
 * Pulls session health from Sentry and estimates sync/auth pressure from analytics
 * failure messages. Writes a report JSON for release-rollout-slo-gate.mjs.
 *
 * Run:
 *   npm run mobile:slo:collect -- --report=mobile-rollout-slo-report.json
 *
 * Skips (exit 0, writes skip report) when MOBILE_SLO_SENTRY_AUTH_TOKEN /
 * SENTRY_RELEASE_HEALTH_AUTH_TOKEN is unset.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const manifestPath = path.join(repoRoot, 'product-os/04-quality/mobile-rollout-slo.json');

function parseArgs(argv) {
  const reportArg = argv.find((arg) => arg.startsWith('--report='));
  return {
    reportPath: reportArg ? reportArg.split('=')[1] : 'mobile-rollout-slo-report.json',
  };
}

function loadManifest() {
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

function env(name, fallback) {
  const value = process.env[name]?.trim();
  return value || fallback;
}

function resolveSentryConfig(manifest) {
  const sentry = manifest.sentry ?? {};
  const token =
    process.env[sentry.authTokenEnv ?? 'MOBILE_SLO_SENTRY_AUTH_TOKEN']?.trim() ||
    process.env[sentry.authTokenFallbackEnv ?? 'SENTRY_RELEASE_HEALTH_AUTH_TOKEN']?.trim();
  const org = env(sentry.orgEnv ?? 'MOBILE_SLO_SENTRY_ORG', sentry.orgDefault ?? 'tracebud');
  const project = env(
    sentry.projectEnv ?? 'MOBILE_SLO_SENTRY_PROJECT',
    sentry.projectDefault ?? 'react-native',
  );
  const apiBase = (
    process.env[sentry.apiBaseEnv ?? 'MOBILE_SLO_SENTRY_API_BASE'] ??
    sentry.apiBaseDefault ??
    'https://de.sentry.io'
  ).replace(/\/$/, '');

  return { token, org, project, apiBase };
}

async function sentryFetch(url, token) {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });
  if (!response.ok) {
    const detail = (await response.text()).trim().slice(0, 200);
    throw new Error(`Sentry API ${response.status}${detail ? `: ${detail}` : ''}`);
  }
  return response.json();
}

function readTotals(payload, field) {
  const groups = payload?.groups ?? [];
  let total = 0;
  for (const group of groups) {
    const value = group?.totals?.[field];
    if (typeof value === 'number' && Number.isFinite(value)) {
      total += value;
    }
  }
  return total;
}

function readWeightedAverage(payload, field) {
  const groups = payload?.groups ?? [];
  let weighted = 0;
  let weight = 0;
  for (const group of groups) {
    const value = group?.totals?.[field];
    const sessions = group?.totals?.['sum(session)'];
    if (typeof value === 'number' && typeof sessions === 'number' && sessions > 0) {
      weighted += value * sessions;
      weight += sessions;
    }
  }
  if (weight <= 0) {
    const first = groups.find((group) => typeof group?.totals?.[field] === 'number');
    return typeof first?.totals?.[field] === 'number' ? first.totals[field] * 100 : null;
  }
  return (weighted / weight) * 100;
}

async function collectSessionHealth(config, manifest) {
  const statsPeriod = manifest.statsPeriod ?? '7d';
  const environment = manifest.environment ?? 'production';
  const query = [
    'field=sum(session)',
    'field=crash_free_rate(session)',
    `statsPeriod=${encodeURIComponent(statsPeriod)}`,
    'interval=1d',
    `environment=${encodeURIComponent(environment)}`,
    `project=${encodeURIComponent(config.project)}`,
    'includeTotals=1',
    'includeSeries=0',
  ].join('&');

  const url = `${config.apiBase}/api/0/organizations/${encodeURIComponent(config.org)}/sessions/?${query}`;
  const payload = await sentryFetch(url, config.token);
  const sessions = readTotals(payload, 'sum(session)');
  const crashFreeRatePct = readWeightedAverage(payload, 'crash_free_rate(session)');

  if (!Number.isFinite(sessions) || sessions <= 0) {
    throw new Error(`No session volume returned for ${config.project} (${statsPeriod})`);
  }
  if (crashFreeRatePct == null || !Number.isFinite(crashFreeRatePct)) {
    throw new Error(`No crash_free_rate(session) returned for ${config.project}`);
  }

  return { sessions, crashFreeRatePct };
}

async function countAnalyticsMessages(config, manifest, messageNeedle) {
  const environment = manifest.environment ?? 'production';
  const query = encodeURIComponent(
    `message:${messageNeedle} environment:${environment} project:${config.project}`,
  );
  const url = `${config.apiBase}/api/0/projects/${encodeURIComponent(config.org)}/${encodeURIComponent(config.project)}/issues/?query=${query}&limit=100`;
  const issues = await sentryFetch(url, config.token);
  return Array.isArray(issues) ? issues.length : 0;
}

function estimateRatePct(numerator, denominator) {
  if (denominator <= 0) return 0;
  return (numerator / denominator) * 100;
}

async function collectDerivedRates(config, manifest, sessions) {
  const syncFailures = await countAnalyticsMessages(
    config,
    manifest,
    'analytics:sync_action_failed',
  );
  const signInFailures = await countAnalyticsMessages(
    config,
    manifest,
    'analytics:sign_in_failure',
  );
  const oauthFailures = await countAnalyticsMessages(
    config,
    manifest,
    'analytics:oauth_callback_failure',
  );
  const timeoutFailures = await countAnalyticsMessages(
    config,
    manifest,
    'analytics:ui_action_failed',
  );

  const syncSuccessRatePct = Math.max(
    0,
    100 - estimateRatePct(syncFailures, Math.max(sessions, syncFailures)),
  );
  const authErrorRatePct = estimateRatePct(
    signInFailures + oauthFailures,
    Math.max(sessions, signInFailures + oauthFailures),
  );
  const apiTimeoutRatePct = estimateRatePct(
    timeoutFailures,
    Math.max(sessions, timeoutFailures),
  );

  return {
    syncSuccessRatePct,
    authErrorRatePct,
    apiTimeoutRatePct,
    counts: {
      syncFailures,
      signInFailures,
      oauthFailures,
      timeoutFailures,
    },
  };
}

function writeSkipReport(reportPath, reason) {
  const absolutePath = path.isAbsolute(reportPath) ? reportPath : path.join(process.cwd(), reportPath);
  const report = {
    generatedAt: new Date().toISOString(),
    window: 'skip',
    skipped: true,
    skipReason: reason,
    sessions: 0,
    crashFreeRatePct: 0,
    syncSuccessRatePct: 0,
    authErrorRatePct: 0,
    apiTimeoutRatePct: 0,
  };
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`SKIP mobile rollout SLO collect — ${reason}`);
  console.log(`Wrote skip report: ${absolutePath}`);
}

async function main() {
  const { reportPath } = parseArgs(process.argv.slice(2));
  const manifest = loadManifest();
  const config = resolveSentryConfig(manifest);

  if (!config.token) {
    writeSkipReport(
      reportPath,
      `${manifest.sentry?.authTokenEnv ?? 'MOBILE_SLO_SENTRY_AUTH_TOKEN'} not configured`,
    );
    return;
  }

  const sessionHealth = await collectSessionHealth(config, manifest);
  const derived = await collectDerivedRates(config, manifest, sessionHealth.sessions);

  const report = {
    generatedAt: new Date().toISOString(),
    window: manifest.statsPeriod ?? '7d',
    project: config.project,
    environment: manifest.environment ?? 'production',
    sessions: sessionHealth.sessions,
    crashFreeRatePct: Number(sessionHealth.crashFreeRatePct.toFixed(2)),
    syncSuccessRatePct: Number(derived.syncSuccessRatePct.toFixed(2)),
    authErrorRatePct: Number(derived.authErrorRatePct.toFixed(2)),
    apiTimeoutRatePct: Number(derived.apiTimeoutRatePct.toFixed(2)),
    counts: derived.counts,
    sources: {
      sessions: 'sentry_sessions_api',
      crashFreeRatePct: 'sentry_sessions_api',
      syncSuccessRatePct: 'sentry_issue_search_proxy',
      authErrorRatePct: 'sentry_issue_search_proxy',
      apiTimeoutRatePct: 'sentry_issue_search_proxy',
    },
  };

  const absolutePath = path.isAbsolute(reportPath) ? reportPath : path.join(process.cwd(), reportPath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, `${JSON.stringify(report, null, 2)}\n`);

  console.log(`Mobile rollout SLO report: ${absolutePath}`);
  console.log(
    `sessions=${report.sessions} crashFree=${report.crashFreeRatePct}% syncSuccess=${report.syncSuccessRatePct}% authErrors=${report.authErrorRatePct}% apiTimeouts=${report.apiTimeoutRatePct}%`,
  );
}

main().catch((error) => {
  console.error(`mobile-rollout-slo-collect error: ${error.message}`);
  process.exit(1);
});
