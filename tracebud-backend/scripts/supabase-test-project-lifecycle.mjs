#!/usr/bin/env node
/**
 * Pause / restore the Supabase Test project to avoid 24/7 Micro compute when idle.
 *
 * Requires SUPABASE_ACCESS_TOKEN (https://supabase.com/dashboard/account/tokens)
 * with project_admin_read + project_admin_write.
 *
 * Usage:
 *   node scripts/supabase-test-project-lifecycle.mjs status
 *   node scripts/supabase-test-project-lifecycle.mjs ensure-active
 *   node scripts/supabase-test-project-lifecycle.mjs pause
 */
import { Client } from 'pg';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { TEST_PROJECT_REF } from './supabase-db-refs.mjs';
import { resolveTestDatabaseUrl } from './db-url-from-env.mjs';

const API_BASE = 'https://api.supabase.com/v1';
const DEFAULT_PROJECT_REF = process.env.SUPABASE_TEST_PROJECT_REF?.trim() || TEST_PROJECT_REF;
const DEFAULT_TIMEOUT_MS = Number(process.env.SUPABASE_TEST_WAKE_TIMEOUT_MS ?? 600_000);
const DEFAULT_POLL_MS = Number(process.env.SUPABASE_TEST_WAKE_POLL_MS ?? 15_000);

export const ACTIVE_STATUSES = new Set(['ACTIVE_HEALTHY', 'ACTIVE_UNHEALTHY']);
export const INACTIVE_STATUSES = new Set(['INACTIVE']);

export function resolveAccessToken() {
  const token = process.env.SUPABASE_ACCESS_TOKEN?.trim();
  if (!token) {
    throw new Error(
      'Missing SUPABASE_ACCESS_TOKEN. Create one at https://supabase.com/dashboard/account/tokens',
    );
  }
  return token;
}

export function isActiveStatus(status) {
  return ACTIVE_STATUSES.has(status);
}

export function isInactiveStatus(status) {
  return INACTIVE_STATUSES.has(status);
}

async function apiRequest(path, { method = 'GET', accessToken, body } = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase API ${method} ${path} failed (${response.status}): ${text}`);
  }

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return null;
  }

  return response.json();
}

export async function fetchProjectStatus(projectRef, accessToken) {
  const project = await apiRequest(`/projects/${projectRef}`, { accessToken });
  return project?.status ?? 'UNKNOWN';
}

export async function restoreProject(projectRef, accessToken) {
  await apiRequest(`/projects/${projectRef}/restore`, {
    method: 'POST',
    accessToken,
  });
}

export async function pauseProject(projectRef, accessToken) {
  try {
    await apiRequest(`/projects/${projectRef}/pause`, {
      method: 'POST',
      accessToken,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/not free-tier|downgrade it to free-tier/i.test(message)) {
      throw new Error(
        `Cannot pause ${projectRef} while it lives in a Pro organization. ` +
          'Transfer the Test project to a Free organization (Dashboard → Project Settings → General → Transfer), ' +
          'then run db:test:pause again. See tracebud-backend/DEPLOY_PRODUCTION.md § Supabase Test compute.',
      );
    }
    throw error;
  }
}

export async function waitForProjectStatus(
  projectRef,
  accessToken,
  predicate,
  { timeoutMs = DEFAULT_TIMEOUT_MS, pollMs = DEFAULT_POLL_MS, label = 'target status' } = {},
) {
  const started = Date.now();
  let lastStatus = 'UNKNOWN';

  while (Date.now() - started < timeoutMs) {
    lastStatus = await fetchProjectStatus(projectRef, accessToken);
    if (predicate(lastStatus)) {
      return lastStatus;
    }
    console.log(
      `[supabase-test] waiting for ${label} (current=${lastStatus}, elapsed=${Math.round((Date.now() - started) / 1000)}s)`,
    );
    await sleep(pollMs);
  }

  throw new Error(
    `Timed out waiting for ${label} on ${projectRef} (last status=${lastStatus}, timeout=${timeoutMs}ms)`,
  );
}

export async function probeTestDatabase(testDatabaseUrl, { attempts = 12, delayMs = 10_000 } = {}) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const client = new Client({
      connectionString: testDatabaseUrl,
      ssl: testDatabaseUrl.includes('localhost') ? false : { rejectUnauthorized: false },
      connectionTimeoutMillis: 12_000,
      application_name: 'tracebud_test_project_wake',
    });

    try {
      await client.connect();
      await client.query('SELECT 1');
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (attempt === attempts) {
        throw new Error(`Test database not reachable after restore: ${message}`);
      }
      console.log(
        `[supabase-test] DB probe attempt ${attempt}/${attempts} failed (${message}); retrying in ${delayMs / 1000}s`,
      );
      await sleep(delayMs);
    } finally {
      try {
        await client.end();
      } catch {
        // ignore
      }
    }
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function ensureTestProjectActive({
  projectRef = DEFAULT_PROJECT_REF,
  accessToken = resolveAccessToken(),
  testDatabaseUrl = process.env.TEST_DATABASE_URL?.trim() || resolveTestDatabaseUrl(),
  timeoutMs = DEFAULT_TIMEOUT_MS,
  pollMs = DEFAULT_POLL_MS,
} = {}) {
  const status = await fetchProjectStatus(projectRef, accessToken);
  console.log(`[supabase-test] ${projectRef} status=${status}`);

  if (isActiveStatus(status)) {
    console.log('[supabase-test] project already active');
  } else if (isInactiveStatus(status)) {
    console.log('[supabase-test] restoring paused project…');
    await restoreProject(projectRef, accessToken);
    await waitForProjectStatus(projectRef, accessToken, isActiveStatus, {
      timeoutMs,
      pollMs,
      label: 'ACTIVE_HEALTHY',
    });
  } else {
    await waitForProjectStatus(projectRef, accessToken, isActiveStatus, {
      timeoutMs,
      pollMs,
      label: 'ACTIVE_HEALTHY',
    });
  }

  console.log('[supabase-test] probing TEST_DATABASE_URL pooler…');
  await probeTestDatabase(testDatabaseUrl);
  console.log('[supabase-test] Test project is ready for integration tests');
}

export async function pauseTestProject({
  projectRef = DEFAULT_PROJECT_REF,
  accessToken = resolveAccessToken(),
} = {}) {
  const status = await fetchProjectStatus(projectRef, accessToken);
  console.log(`[supabase-test] ${projectRef} status=${status}`);

  if (isInactiveStatus(status)) {
    console.log('[supabase-test] project already paused — no compute charges');
    return;
  }

  console.log('[supabase-test] pausing project to stop compute charges…');
  await pauseProject(projectRef, accessToken);
  console.log('[supabase-test] pause requested — compute billing stops once status=INACTIVE');
}

async function main() {
  const command = process.argv[2]?.trim();
  if (!command || !['status', 'ensure-active', 'pause'].includes(command)) {
    console.error('Usage: supabase-test-project-lifecycle.mjs <status|ensure-active|pause>');
    process.exit(1);
  }

  const accessToken = resolveAccessToken();
  const projectRef = DEFAULT_PROJECT_REF;

  if (command === 'status') {
    const status = await fetchProjectStatus(projectRef, accessToken);
    console.log(JSON.stringify({ projectRef, status }, null, 2));
    return;
  }

  if (command === 'ensure-active') {
    await ensureTestProjectActive({ projectRef, accessToken });
    return;
  }

  await pauseTestProject({ projectRef, accessToken });
}

const isMain =
  process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isMain) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
