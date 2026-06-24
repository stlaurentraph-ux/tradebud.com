#!/usr/bin/env node
/**
 * Preview OTA preflight — regression, OAuth config, SSO health, device sign-off.
 *
 * Run: npm run ota:preview:preflight
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function runStep(label, fn) {
  console.log(`\n==> ${label}`);
  const code = fn();
  if (code !== 0) {
    console.error(`\nota-preview-preflight: FAILED at "${label}"`);
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

function main() {
  runStep('unit tests', () => runNpmScript('test'));
  runStep('field regression guard', () => runNodeScript('field-regression-guard.mjs'));
  runStep('OAuth provider verify', () => runNpmScript('oauth:verify'));
  runStep('OAuth SSO health check', () => runNodeScript('oauth-sso-health-check.mjs'));
  runStep('device smoke sign-off', () => runNodeScript('device-smoke-signoff-assert.mjs'));

  console.log('\nota-preview-preflight: OK — safe to run npm run update:preview');
}

main();
