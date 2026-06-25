#!/usr/bin/env node
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import {
  PROD_PROJECT_REF,
  TEST_PROJECT_REF,
  assertProdDatabaseUrl,
  assertTestDatabaseUrl,
} from './supabase-db-refs.mjs';
import {
  isPoolerDatabaseUrl,
  resolveDatabaseUrl,
  resolveTestDatabaseUrl,
  validateDatabaseEnvSplit,
} from './db-url-from-env.mjs';

const prodUrl = `postgresql://postgres.${PROD_PROJECT_REF}:secret@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true`;
const testUrl = `postgresql://postgres.${TEST_PROJECT_REF}:secret@aws-1-eu-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true`;
const directProdUrl = `postgresql://postgres.${PROD_PROJECT_REF}:secret@db.${PROD_PROJECT_REF}.supabase.co:5432/postgres`;

function withTempEnv(cwd, files, run) {
  const dir = mkdtempSync(join(tmpdir(), 'tb-db-url-'));
  for (const [name, body] of Object.entries(files)) {
    writeFileSync(join(dir, name), body, 'utf8');
  }
  const saved = { ...process.env };
  delete process.env.DATABASE_URL;
  delete process.env.TEST_DATABASE_URL;
  try {
    return run(dir);
  } finally {
    process.env = saved;
  }
}

test('resolveDatabaseUrl never reads TEST_DATABASE_URL from env files', () => {
  withTempEnv('', { '.env.local': `DATABASE_URL=${prodUrl}\nTEST_DATABASE_URL=${testUrl}\n` }, (cwd) => {
    assert.equal(resolveDatabaseUrl({ cwd }), prodUrl);
  });
});

test('resolveDatabaseUrl rejects test project ref', () => {
  withTempEnv('', { '.env.local': `DATABASE_URL=${testUrl}\n` }, (cwd) => {
    assert.throws(() => resolveDatabaseUrl({ cwd }), /Supabase Test/);
  });
});

test('resolveTestDatabaseUrl rejects prod project ref', () => {
  withTempEnv('', { '.env.local': `TEST_DATABASE_URL=${prodUrl}\n` }, (cwd) => {
    assert.throws(() => resolveTestDatabaseUrl({ cwd }), /Tracebud prod/);
  });
});

test('prefers pooler over direct supabase host for prod', () => {
  withTempEnv('', {}, (cwd) => {
    writeFileSync(join(cwd, '.env.local'), `DATABASE_URL=${directProdUrl}\n`, 'utf8');
    writeFileSync(join(cwd, '.env'), `DATABASE_URL=${prodUrl}\n`, 'utf8');
    assert.equal(resolveDatabaseUrl({ cwd }), prodUrl);
  });
});

test('validateDatabaseEnvSplit flags identical URLs', () => {
  const saved = { ...process.env };
  process.env.DATABASE_URL = prodUrl;
  process.env.TEST_DATABASE_URL = prodUrl;
  try {
    const { issues } = validateDatabaseEnvSplit();
    assert.ok(issues.some((i) => i.includes('must not be identical')));
  } finally {
    process.env = saved;
  }
});

test('assert helpers allow unknown postgres users', () => {
  const generic = 'postgresql://postgres:secret@localhost:5432/postgres';
  assert.doesNotThrow(() => assertProdDatabaseUrl(generic));
  assert.doesNotThrow(() => assertTestDatabaseUrl(generic));
});

test('isPoolerDatabaseUrl detects pooler host', () => {
  assert.equal(isPoolerDatabaseUrl(prodUrl), true);
  assert.equal(isPoolerDatabaseUrl(directProdUrl), false);
});
