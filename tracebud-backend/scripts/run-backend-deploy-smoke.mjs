#!/usr/bin/env node
/**
 * Backend Railway post-deploy smoke (slice 2.6).
 *
 * Run: npm run deploy:smoke -w tracebud-backend
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = path.join(
  backendRoot,
  'qa/automation-baselines/backend-deploy-smoke.json',
);

function loadManifest() {
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

function resolveBaseUrl(manifest) {
  const fromEnv = process.env[manifest.envBaseUrl]?.trim();
  const base = fromEnv || manifest.fallbackBaseUrl;
  return base.replace(/\/+$/, '');
}

function buildUrl(baseUrl, pathWithQuery) {
  return `${baseUrl}${pathWithQuery}`;
}

function jsonMatches(actual, expected) {
  for (const [key, value] of Object.entries(expected)) {
    if (actual?.[key] !== value) {
      return { ok: false, detail: `expected ${key}=${JSON.stringify(value)}, got ${JSON.stringify(actual?.[key])}` };
    }
  }
  return { ok: true };
}

async function fetchJson(url, init = {}) {
  const timeoutMs = Number(process.env.BACKEND_SMOKE_TIMEOUT_MS ?? loadManifest().requestTimeoutMs);
  const response = await fetch(url, {
    ...init,
    signal: AbortSignal.timeout(timeoutMs),
  });
  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { response, body };
}

async function checkHealth(manifest, baseUrl) {
  const url = buildUrl(baseUrl, manifest.healthPath);
  const { response, body } = await fetchJson(url, { method: 'GET' });
  if (!response.ok) {
    throw new Error(`health ${manifest.healthPath} expected 2xx got ${response.status}`);
  }
  const match = jsonMatches(body, manifest.healthExpectJson);
  if (!match.ok) {
    throw new Error(`health JSON mismatch: ${match.detail}`);
  }
  console.log(`health ok ${url}`);
  if (Array.isArray(body.warnings) && body.warnings.length > 0) {
    console.warn(`health warnings=${body.warnings.length}`);
  }
  return true;
}

function assertAuthProbeBody(body, manifest) {
  if (!Array.isArray(body)) {
    throw new Error('auth probe response must be a JSON array');
  }
  if (body.length < 1) {
    throw new Error('auth probe response array is empty');
  }
  for (const key of manifest.authProbe.requiredItemKeys) {
    if (!(key in body[0])) {
      throw new Error(`auth probe item missing key ${key}`);
    }
  }
}

async function checkAuthProbe(manifest, baseUrl) {
  const bearer = process.env[manifest.authProbe.bearerEnv]?.trim();
  if (!bearer) {
    console.log(`skip auth probe (${manifest.authProbe.bearerEnv} not configured)`);
    return;
  }

  const query = new URLSearchParams(manifest.authProbe.query ?? {}).toString();
  const path = query ? `${manifest.authProbe.path}?${query}` : manifest.authProbe.path;
  const url = buildUrl(baseUrl, path);
  const { response, body } = await fetchJson(url, {
    method: manifest.authProbe.method,
    headers: {
      Authorization: `Bearer ${bearer}`,
      Accept: 'application/json',
    },
  });

  if (!manifest.authProbe.expectStatus.includes(response.status)) {
    throw new Error(
      `auth probe ${path} expected status ${manifest.authProbe.expectStatus.join('|')} got ${response.status}`,
    );
  }

  assertAuthProbeBody(body, manifest);
  console.log(`auth probe ok ${url} items=${body.length}`);
}

async function checkPublicProbes(manifest, baseUrl) {
  const probes = manifest.publicProbes ?? [];
  if (probes.length === 0) {
    return;
  }

  for (const probe of probes) {
    const url = buildUrl(baseUrl, probe.path);
    const { response, body } = await fetchJson(url, {
      method: probe.method ?? 'GET',
      headers: { Accept: 'application/json' },
    });

    const expected = probe.expectStatus ?? [404];
    if (!expected.includes(response.status)) {
      throw new Error(
        `public probe ${probe.name} ${probe.path} expected status ${expected.join('|')} got ${response.status}`,
      );
    }

    if (probe.expectMessageIncludes) {
      const message =
        typeof body === 'object' && body !== null ? String(body.message ?? '') : String(body);
      if (!message.includes(probe.expectMessageIncludes)) {
        throw new Error(
          `public probe ${probe.name} expected message including ${JSON.stringify(probe.expectMessageIncludes)}, got ${JSON.stringify(message)}`,
        );
      }
    }

    console.log(`public probe ok ${probe.name} ${url} status=${response.status}`);
  }
}

async function waitForHealthyDeploy(manifest, baseUrl) {
  const waitEnabled = process.env.BACKEND_SMOKE_WAIT_FOR_DEPLOY === '1';
  if (!waitEnabled) {
    await checkHealth(manifest, baseUrl);
    return;
  }

  const deadline = Date.now() + manifest.deployWait.maxWaitMs;
  let attempt = 0;
  while (Date.now() < deadline) {
    attempt += 1;
    try {
      await checkHealth(manifest, baseUrl);
      console.log(`deploy ready after ${attempt} attempt(s)`);
      return;
    } catch (error) {
      console.warn(`deploy wait attempt ${attempt}: ${error.message}`);
      await new Promise((resolve) => setTimeout(resolve, manifest.deployWait.pollIntervalMs));
    }
  }
  throw new Error(`backend not healthy within ${manifest.deployWait.maxWaitMs}ms`);
}

async function main() {
  const manifest = loadManifest();
  const baseUrl = resolveBaseUrl(manifest);

  if (!process.env[manifest.envBaseUrl]?.trim() && process.env.BACKEND_SMOKE_REQUIRE_SECRET === '1') {
    console.error(`Missing ${manifest.envBaseUrl}`);
    process.exit(1);
  }

  console.log(`backend-deploy-smoke base=${baseUrl} wait=${process.env.BACKEND_SMOKE_WAIT_FOR_DEPLOY === '1'}`);

  await waitForHealthyDeploy(manifest, baseUrl);
  await checkPublicProbes(manifest, baseUrl);
  await checkAuthProbe(manifest, baseUrl);
  console.log('Backend post-deploy smoke passed.');
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
