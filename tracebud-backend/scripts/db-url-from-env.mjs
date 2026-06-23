#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

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

function isPoolerDatabaseUrl(url) {
  const host = hostnameForDatabaseUrl(url);
  return Boolean(host && host.includes('pooler.supabase.com'));
}

function isDirectSupabaseDatabaseUrl(url) {
  const host = hostnameForDatabaseUrl(url);
  return Boolean(host && host.startsWith('db.') && host.endsWith('.supabase.co'));
}

/**
 * Resolve DATABASE_URL for local migration scripts.
 * When multiple env files define different URLs, prefer Supabase pooler (IPv4)
 * over direct db.*.supabase.co (IPv6-only on many networks).
 */
export function resolveDatabaseUrl(options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const layers = [
    resolve(cwd, '.env'),
    resolve(cwd, '.env.local'),
    resolve(cwd, '..', '.env.local'),
  ];

  const candidates = [];
  const pushCandidate = (url, source) => {
    const trimmed = url?.trim();
    if (!trimmed) return;
    if (candidates.some((entry) => entry.url === trimmed)) return;
    candidates.push({ url: trimmed, source });
  };

  if (process.env.DATABASE_URL?.trim()) {
    pushCandidate(process.env.DATABASE_URL, 'process.env.DATABASE_URL');
  }

  for (const file of layers) {
    const chunk = loadEnvFile(file);
    if (chunk.DATABASE_URL) {
      pushCandidate(chunk.DATABASE_URL, file);
    }
  }

  if (process.env.TEST_DATABASE_URL?.trim()) {
    pushCandidate(process.env.TEST_DATABASE_URL, 'process.env.TEST_DATABASE_URL');
  }

  const poolers = candidates.filter((entry) => isPoolerDatabaseUrl(entry.url));
  if (poolers.length > 0) {
    return poolers[poolers.length - 1].url;
  }

  const nonDirect = candidates.filter((entry) => !isDirectSupabaseDatabaseUrl(entry.url));
  if (nonDirect.length > 0) {
    return nonDirect[nonDirect.length - 1].url;
  }

  if (candidates[candidates.length - 1]?.url) {
    return candidates[candidates.length - 1].url;
  }

  throw new Error(
    'Set DATABASE_URL in tracebud-backend/.env.local or .env (pooler URL recommended).',
  );
}

export function describeDatabaseUrl(url) {
  const host = hostnameForDatabaseUrl(url);
  if (!host) return 'invalid DATABASE_URL';
  if (isPoolerDatabaseUrl(url)) return `${host} (pooler)`;
  if (isDirectSupabaseDatabaseUrl(url)) return `${host} (direct — IPv6-only)`;
  return host;
}
