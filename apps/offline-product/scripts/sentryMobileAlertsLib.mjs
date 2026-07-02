#!/usr/bin/env node
/**
 * Shared helpers for Sentry mobile issue-alert manifest scripts.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { sentryAuthEnvPath } from './sentryAuthEnvPath.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
export const offlineRoot = path.resolve(scriptDir, '..');
export const repoRoot = path.resolve(offlineRoot, '../..');
export const manifestPath = path.join(
  repoRoot,
  'product-os/04-quality/sentry-mobile-alert-rules.json',
);

export function loadToken() {
  const fromEnv =
    process.env.SENTRY_AUTH_TOKEN?.trim() ||
    process.env.SENTRY_RELEASE_HEALTH_AUTH_TOKEN?.trim() ||
    process.env.MOBILE_SLO_SENTRY_AUTH_TOKEN?.trim();
  if (fromEnv) return fromEnv;

  const envFile = sentryAuthEnvPath(offlineRoot);
  if (!fs.existsSync(envFile)) return undefined;
  const line = fs
    .readFileSync(envFile, 'utf8')
    .split('\n')
    .find((entry) => entry.startsWith('SENTRY_AUTH_TOKEN='));
  return line?.slice('SENTRY_AUTH_TOKEN='.length).trim() || undefined;
}

export function loadManifest() {
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Missing manifest: ${manifestPath}`);
  }
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch (error) {
    throw new Error(`Invalid sentry-mobile-alert-rules.json: ${error.message}`);
  }
  assertManifestShape(manifest);
  return manifest;
}

export function assertManifestShape(manifest) {
  if (manifest.schemaVersion !== 1) {
    throw new Error('sentry-mobile-alert-rules.json schemaVersion must be 1');
  }
  if (!manifest.organizationSlug || !manifest.projectSlug || !manifest.apiBase) {
    throw new Error('manifest must define organizationSlug, projectSlug, and apiBase');
  }
  if (!Array.isArray(manifest.rules) || manifest.rules.length === 0) {
    throw new Error('manifest must define a non-empty rules array');
  }
  const names = new Set();
  for (const rule of manifest.rules) {
    if (!rule?.name || typeof rule.name !== 'string') {
      throw new Error('each manifest rule must have a string name');
    }
    if (names.has(rule.name)) {
      throw new Error(`duplicate manifest rule name: ${rule.name}`);
    }
    names.add(rule.name);
  }
}

export async function sentryFetch(token, apiBase, pathname, init = {}) {
  const res = await fetch(`${apiBase}${pathname}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { res, body };
}

export async function listProjectAlertRules(token, manifest) {
  const listPath = `/api/0/projects/${manifest.organizationSlug}/${manifest.projectSlug}/rules/`;
  const listed = await sentryFetch(token, manifest.apiBase, listPath);
  if (!listed.res.ok) {
    const error = new Error(
      `List alert rules failed HTTP ${listed.res.status} for ${manifest.projectSlug}`,
    );
    error.status = listed.res.status;
    error.body = listed.body;
    throw error;
  }
  return Array.isArray(listed.body) ? listed.body : [];
}
