import fs from 'node:fs';
import path from 'node:path';

const DEFAULTS = {
  minSessions: 100,
  minCrashFreeRatePct: 99.0,
  minSyncSuccessRatePct: 98.0,
  maxAuthErrorRatePct: 2.0,
  maxApiTimeoutRatePct: 2.0,
};

function parseArgs(argv) {
  const reportArg = argv.find((arg) => arg.startsWith('--report='));
  const reportPath = reportArg ? reportArg.split('=')[1] : 'release-health-report.json';
  return { reportPath };
}

function toNumber(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function loadThresholdsFromEnv() {
  return {
    minSessions: Math.max(1, Math.floor(toNumber(process.env.RELEASE_SLO_MIN_SESSIONS, DEFAULTS.minSessions))),
    minCrashFreeRatePct: toNumber(process.env.RELEASE_SLO_MIN_CRASH_FREE_PCT, DEFAULTS.minCrashFreeRatePct),
    minSyncSuccessRatePct: toNumber(
      process.env.RELEASE_SLO_MIN_SYNC_SUCCESS_PCT,
      DEFAULTS.minSyncSuccessRatePct,
    ),
    maxAuthErrorRatePct: toNumber(process.env.RELEASE_SLO_MAX_AUTH_ERROR_PCT, DEFAULTS.maxAuthErrorRatePct),
    maxApiTimeoutRatePct: toNumber(
      process.env.RELEASE_SLO_MAX_API_TIMEOUT_PCT,
      DEFAULTS.maxApiTimeoutRatePct,
    ),
  };
}

function readReport(reportPath) {
  const absolutePath = path.isAbsolute(reportPath) ? reportPath : path.join(process.cwd(), reportPath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(
      `SLO report not found at ${absolutePath}. Provide --report=<path> or create release-health-report.json.`,
    );
  }
  const raw = fs.readFileSync(absolutePath, 'utf8');
  const parsed = JSON.parse(raw);
  return { absolutePath, parsed };
}

function requiredNumber(obj, key) {
  const value = Number(obj?.[key]);
  if (!Number.isFinite(value)) throw new Error(`Invalid or missing numeric field in report: ${key}`);
  return value;
}

function evaluate(report, thresholds) {
  const sessions = requiredNumber(report, 'sessions');
  const crashFreeRatePct = requiredNumber(report, 'crashFreeRatePct');
  const syncSuccessRatePct = requiredNumber(report, 'syncSuccessRatePct');
  const authErrorRatePct = requiredNumber(report, 'authErrorRatePct');
  const apiTimeoutRatePct = requiredNumber(report, 'apiTimeoutRatePct');

  const checks = [
    {
      name: 'sessions',
      pass: sessions >= thresholds.minSessions,
      detail: `${sessions} (required >= ${thresholds.minSessions})`,
    },
    {
      name: 'crashFreeRatePct',
      pass: crashFreeRatePct >= thresholds.minCrashFreeRatePct,
      detail: `${crashFreeRatePct.toFixed(2)}% (required >= ${thresholds.minCrashFreeRatePct.toFixed(2)}%)`,
    },
    {
      name: 'syncSuccessRatePct',
      pass: syncSuccessRatePct >= thresholds.minSyncSuccessRatePct,
      detail: `${syncSuccessRatePct.toFixed(2)}% (required >= ${thresholds.minSyncSuccessRatePct.toFixed(2)}%)`,
    },
    {
      name: 'authErrorRatePct',
      pass: authErrorRatePct <= thresholds.maxAuthErrorRatePct,
      detail: `${authErrorRatePct.toFixed(2)}% (required <= ${thresholds.maxAuthErrorRatePct.toFixed(2)}%)`,
    },
    {
      name: 'apiTimeoutRatePct',
      pass: apiTimeoutRatePct <= thresholds.maxApiTimeoutRatePct,
      detail: `${apiTimeoutRatePct.toFixed(2)}% (required <= ${thresholds.maxApiTimeoutRatePct.toFixed(2)}%)`,
    },
  ];

  return checks;
}

function main() {
  const { reportPath } = parseArgs(process.argv.slice(2));
  const thresholds = loadThresholdsFromEnv();
  const { absolutePath, parsed: report } = readReport(reportPath);

  if (report.skipped) {
    console.log(`Rollout SLO report: ${absolutePath}`);
    console.log(`SKIP — ${report.skipReason ?? 'collector skipped'}`);
    console.log('Rollout SLO gate skipped (no Sentry credentials).');
    return;
  }

  const checks = evaluate(report, thresholds);

  console.log(`Rollout SLO report: ${absolutePath}`);
  console.log(`Window: ${String(report.window ?? 'unknown')}`);

  let allPass = true;
  for (const check of checks) {
    const status = check.pass ? 'pass' : 'fail';
    if (!check.pass) allPass = false;
    console.log(`[${status}] ${check.name}: ${check.detail}`);
  }

  if (!allPass) {
    console.error('Rollout SLO gate failed. Do not promote preview -> production.');
    process.exit(1);
  }

  console.log('Rollout SLO gate passed. Promotion to production is allowed.');
}

main();
