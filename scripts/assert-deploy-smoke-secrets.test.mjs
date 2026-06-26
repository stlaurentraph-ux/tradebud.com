#!/usr/bin/env node
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'assert-deploy-smoke-secrets.mjs');

function run(extraEnv = {}, args = ['backend']) {
  return spawnSync(process.execPath, [scriptPath, ...args], {
    env: { ...process.env, ...extraEnv },
    encoding: 'utf8',
  });
}

{
  const result = run({ DEPLOY_SMOKE_STRICT: '1' });
  assert.equal(result.status, 1);
  assert.match(result.stderr + result.stdout, /UPTIME_BACKEND_BASE_URL is not configured/);
}

{
  const result = run(
    {
      DEPLOY_SMOKE_STRICT: '1',
      UPTIME_BACKEND_BASE_URL: 'https://api.tracebud.com',
    },
  );
  assert.equal(result.status, 1);
  assert.match(result.stderr + result.stdout, /smoke auth is not configured/);
}

{
  const result = run(
    {
      DEPLOY_SMOKE_STRICT: '0',
      UPTIME_BACKEND_BASE_URL: 'https://api.tracebud.com',
      TRACEBUD_SMOKE_BEARER_TOKEN: 'test-token',
    },
  );
  assert.equal(result.status, 0);
  assert.match(result.stdout, /prerequisites OK/);
}

{
  const result = run({ DEPLOY_SMOKE_STRICT: '0' });
  assert.equal(result.status, 0);
  assert.match(result.stdout, /skipping \(non-strict manual dispatch\)/);
}

{
  const result = run(
    {
      DEPLOY_SMOKE_STRICT: '1',
      MARKETING_SMOKE_BASE_URL: 'https://www.tracebud.com',
    },
    ['marketing'],
  );
  assert.equal(result.status, 0);
}

console.log('assert-deploy-smoke-secrets.test.mjs: OK');
