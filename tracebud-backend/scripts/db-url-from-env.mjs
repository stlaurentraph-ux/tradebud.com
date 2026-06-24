#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  PROD_PROJECT_REF,
  TEST_PROJECT_REF,
  assertProdDatabaseUrl,
  assertTestDatabaseUrl,
  getDatabaseProjectRef,
} from './supabase-db-refs.mjs';

function stripQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

export function loadEnvFile(path) {
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = stripQuotes(trimmed.slice(eq + 1).trim());
    if (value) out[key] = value;
  }
  return out;
}

function hostnameForDatabaseUrl(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

export function isPoolerDatabaseUrl(url) {
  const host = hostnameForDatabaseUrl(url);
  return Boolean(host && host.includes('pooler.supabase.com'));
}

export function isDirectSupabaseDatabaseUrl(url) {
  const host = hostnameForDatabaseUrl(url);
  return Boolean(host && host.startsWith('db.') && host.endsWith('.supabase.co'));
}

function projectRefFromUrl(url) {
  return getDatabaseProjectRef(url);
}

function collectDatabaseUrlCandidates(options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const layers = [
    resolve(cwd, '.env'),
    resolve(cwd, '.env.local'),
    resolve(cwd, '..', '.env.local'),
  ];

  const databaseUrls = [];
  const testDatabaseUrls = [];

  const pushUnique = (list, url, source) => {
    const trimmed = url?.trim();
    if (!trimmed) return;
    if (list.some((entry) => entry.url === trimmed)) return;
    list.push({ url: trimmed, source });
  };

  for (const key of options.overrideEnvKeys ?? []) {
    if (process.env[key]?.trim()) {
      pushUnique(databaseUrls, process.env[key], `process.env.${key}`);
    }
  }

  if (process.env.DATABASE_URL?.trim()) {
    pushUnique(databaseUrls, process.env.DATABASE_URL, 'process.env.DATABASE_URL');
  }

  for (const file of layers) {
    const chunk = loadEnvFile(file);
    if (chunk.DATABASE_URL) {
      pushUnique(databaseUrls, chunk.DATABASE_URL, `${file}:DATABASE_URL`);
    }
    if (chunk.TEST_DATABASE_URL) {
      pushUnique(testDatabaseUrls, chunk.TEST_DATABASE_URL, `${file}:TEST_DATABASE_URL`);
    }
  }

  if (process.env.TEST_DATABASE_URL?.trim()) {
    pushUnique(testDatabaseUrls, process.env.TEST_DATABASE_URL, 'process.env.TEST_DATABASE_URL');
  }

  return { databaseUrls, testDatabaseUrls };
}

function pickPreferredUrl(entries) {
  const poolers = entries.filter((entry) => isPoolerDatabaseUrl(entry.url));
  if (poolers.length > 0) {
    return poolers[poolers.length - 1].url;
  }

  const nonDirect = entries.filter((entry) => !isDirectSupabaseDatabaseUrl(entry.url));
  if (nonDirect.length > 0) {
    return nonDirect[nonDirect.length - 1].url;
  }

  return entries[entries.length - 1]?.url ?? null;
}

/** Production / tooling — never uses TEST_DATABASE_URL. */
export function resolveDatabaseUrl(options = {}) {
  const { databaseUrls } = collectDatabaseUrlCandidates(options);
  const url = pickPreferredUrl(databaseUrls);
  if (!url) {
    throw new Error(
      'Set DATABASE_URL in tracebud-backend/.env.local or repo root .env.local (Tracebud prod pooler).',
    );
  }
  assertProdDatabaseUrl(url);
  return url;
}

/** Integration tests — Test Supabase project only. */
export function resolveTestDatabaseUrl(options = {}) {
  const { testDatabaseUrls } = collectDatabaseUrlCandidates(options);
  const url =
    pickPreferredUrl(testDatabaseUrls) ?? testDatabaseUrls[testDatabaseUrls.length - 1]?.url;
  if (!url) {
    throw new Error(
      'Set TEST_DATABASE_URL in repo root .env.local (Supabase Test project pooler).',
    );
  }
  assertTestDatabaseUrl(url);
  return url;
}

export function describeDatabaseUrl(url) {
  const host = hostnameForDatabaseUrl(url);
  if (!host) return 'invalid DATABASE_URL';
  if (isPoolerDatabaseUrl(url)) return `${host} (pooler)`;
  if (isDirectSupabaseDatabaseUrl(url)) return `${host} (direct — IPv6-only)`;
  return host;
}

export function describeDatabaseSplit() {
  let prodUrl;
  let testUrl;
  try {
    prodUrl = resolveDatabaseUrl();
  } catch {
    prodUrl = null;
  }
  try {
    testUrl = resolveTestDatabaseUrl();
  } catch {
    testUrl = null;
  }

  return {
    prod: prodUrl
      ? { host: describeDatabaseUrl(prodUrl), projectRef: projectRefFromUrl(prodUrl) }
      : null,
    test: testUrl
      ? { host: describeDatabaseUrl(testUrl), projectRef: projectRefFromUrl(testUrl) }
      : null,
    sameUrl: Boolean(prodUrl && testUrl && prodUrl === testUrl),
  };
}

export function validateDatabaseEnvSplit() {
  const split = describeDatabaseSplit();
  const issues = [];

  const rawProd =
    process.env.DATABASE_URL?.trim() ||
    collectDatabaseUrlCandidates().databaseUrls.at(-1)?.url;
  const rawTest =
    process.env.TEST_DATABASE_URL?.trim() ||
    collectDatabaseUrlCandidates().testDatabaseUrls.at(-1)?.url;
  if (rawProd && rawTest && rawProd === rawTest) {
    issues.push('DATABASE_URL and TEST_DATABASE_URL must not be identical.');
  }

  if (!split.prod) {
    issues.push('DATABASE_URL is missing (Tracebud prod pooler required).');
  } else if (split.prod.projectRef && split.prod.projectRef !== PROD_PROJECT_REF) {
    issues.push(
      `DATABASE_URL project ref is ${split.prod.projectRef}; expected ${PROD_PROJECT_REF}.`,
    );
  }

  if (!split.test) {
    issues.push('TEST_DATABASE_URL is missing (Supabase Test project for integration tests).');
  } else if (split.test.projectRef && split.test.projectRef !== TEST_PROJECT_REF) {
    issues.push(
      `TEST_DATABASE_URL project ref is ${split.test.projectRef}; expected ${TEST_PROJECT_REF}.`,
    );
  }

  if (split.sameUrl && !issues.some((i) => i.includes('must not be identical'))) {
    issues.push('DATABASE_URL and TEST_DATABASE_URL must not be identical.');
  }

  return { split, issues };
}

export function assertNotPlaceholderDatabaseUrl(url) {
  const trimmed = url?.trim() ?? '';
  if (!trimmed) {
    throw new Error('DATABASE URL is empty.');
  }
  if (
    trimmed.includes('<') ||
    trimmed.includes('YOUR_PROJECT') ||
    trimmed.includes('PASSWORD') ||
    trimmed.includes('PROJECT_REF')
  ) {
    throw new Error(
      'DATABASE URL looks like a placeholder. Paste the real Supabase pooler URL from Dashboard.',
    );
  }
}

export function warnIfDirectDatabaseUrl(url) {
  if (isDirectSupabaseDatabaseUrl(url)) {
    console.warn(
      'WARN DATABASE_URL uses direct db.*.supabase.co (IPv6-only on many networks). Prefer pooler.supabase.com:6543.',
    );
  }
}

export function resolvePgPoolMaxFromEnv() {
  const raw = process.env.PG_POOL_MAX;
  const parsed = raw == null || raw.trim() === '' ? 5 : Number(raw);
  if (!Number.isFinite(parsed) || parsed < 1) return 5;
  return Math.min(Math.floor(parsed), 20);
}

export { PROD_PROJECT_REF, TEST_PROJECT_REF, assertProdDatabaseUrl, assertTestDatabaseUrl, getDatabaseProjectRef };
