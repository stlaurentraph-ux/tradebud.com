#!/usr/bin/env node
/**
 * Production OTA preflight (slice 5.10).
 *
 * Blocks `update:production` unless regression, skew, sign-off, and optional SLO pass.
 *
 * Run:
 *   npm run ota:production:preflight
 *   npm run ota:production:preflight -- --ci   # CI workflow (no device sign-off / no local Maestro)
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function parseArgs(argv) {
  return {
    ci: argv.includes('--ci'),
  };
}

function runStep(label, fn) {
  console.log(`\n==> ${label}`);
  const code = fn();
  if (code !== 0) {
    console.error(`\nota-production-preflight: FAILED at "${label}"`);
    process.exit(code);
  }
}

function runNpmScript(script, extraArgs = []) {
  const result = spawnSync('npm', ['run', script, '--', ...extraArgs], {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
  });
  return result.status ?? 1;
}

function runNodeScript(script, args = []) {
  const result = spawnSync(process.execPath, [path.join(root, 'scripts', script), ...args], {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
  });
  return result.status ?? 1;
}

function maybeRunMobileSloGate() {
  const reportPath = process.env.MOBILE_SLO_REPORT?.trim() || 'mobile-rollout-slo-report.json';
  const absolutePath = path.isAbsolute(reportPath) ? reportPath : path.join(root, reportPath);
  if (!fs.existsSync(absolutePath)) {
    console.log('SKIP mobile SLO gate — no report (run mobile:slo:collect first for production promote)');
    return 0;
  }
  return runNpmScript('mobile:slo:gate', [`--report=${reportPath}`]);
}

function maybeRunLocalMaestro() {
  if (process.env.OTA_PRODUCTION_RUN_MAESTRO !== '1') {
    console.log('\nSKIP Maestro locally — set OTA_PRODUCTION_RUN_MAESTRO=1 or run offline-ota-production-gate workflow');
    return 0;
  }
  if (process.platform !== 'darwin') {
    console.log('SKIP Maestro locally — requires macOS');
    return 0;
  }
  return spawnSync('bash', ['scripts/maestro-ci-golden-path.sh'], {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
  }).status ?? 1;
}

function main() {
  const { ci } = parseArgs(process.argv.slice(2));

  runStep('field regression guard', () => runNodeScript('field-regression-guard.mjs'));
  runStep('automation guards (strict)', () => runNpmScript('qa:automation:phase1:strict'));
  runStep('EAS OTA skew guard', () => runNodeScript('eas-ota-skew-guard.mjs'));
  runStep('OAuth provider verify', () => runNpmScript('oauth:verify'));
  runStep('OAuth SSO health check', () => runNodeScript('oauth-sso-health-check.mjs'));

  if (ci) {
    console.log('\n==> device sign-off (skipped in --ci mode)');
  } else {
    runStep('device smoke sign-off', () => runNodeScript('device-smoke-signoff-assert.mjs'));
  }

  runStep('mobile SLO gate (optional)', () => maybeRunMobileSloGate());

  if (!ci) {
    runStep('Maestro golden path (optional local)', () => maybeRunLocalMaestro());
  } else {
    console.log('\n==> Maestro (deferred to macOS job in offline-ota-production-gate.yml)');
  }

  console.log('\nota-production-preflight: OK — safe to run npm run update:production');
}

main();
