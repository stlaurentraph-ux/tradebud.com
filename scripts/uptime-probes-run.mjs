#!/usr/bin/env node
/**
 * Synthetic uptime probes (slice 2.8).
 *
 * HTTP status + latency checks against marketing, dashboard, and backend.
 * Independent of deploy pipeline — run on schedule or manually.
 *
 * Env (optional overrides; manifest fallbacks used when unset):
 * - MARKETING_SMOKE_BASE_URL
 * - UPTIME_DASHBOARD_BASE_URL
 * - UPTIME_BACKEND_BASE_URL
 * - VERCEL_AUTOMATION_BYPASS_SECRET — Deployment Protection bypass header
 * - UPTIME_PROBE_TIMEOUT_MS — per-request timeout (default: probe maxLatencyMs)
 * - UPTIME_PROBE_DRY_RUN=1 — print resolved URLs without fetching
 *
 * Run: npm run uptime:probes:run
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = path.join(repoRoot, 'scripts', 'uptime-probes-manifest.json');
const dryRun = process.env.UPTIME_PROBE_DRY_RUN === '1';

function loadManifest() {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (manifest.version !== 1 || !Array.isArray(manifest.probes)) {
    throw new Error('Invalid uptime probe manifest');
  }
  return manifest;
}

function resolveBaseUrl(probe) {
  const fromEnv = process.env[probe.envBaseUrl]?.trim();
  const base = fromEnv || probe.fallbackBaseUrl;
  return base.replace(/\/+$/, '');
}

function buildHeaders() {
  const headers = {
    Accept: 'text/html,application/json;q=0.9,*/*;q=0.8',
    'User-Agent': 'tracebud-uptime-probes/2.8',
  };
  const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET?.trim();
  if (bypass) {
    headers['x-vercel-protection-bypass'] = bypass;
  }
  return headers;
}

function jsonMatches(actual, expected) {
  for (const [key, value] of Object.entries(expected)) {
    if (actual?.[key] !== value) {
      return { ok: false, detail: `expected ${key}=${JSON.stringify(value)}, got ${JSON.stringify(actual?.[key])}` };
    }
  }
  return { ok: true };
}

async function runProbe(probe, headers) {
  const baseUrl = resolveBaseUrl(probe);
  const url = `${baseUrl}${probe.path}`;
  const timeoutMs = Number(process.env.UPTIME_PROBE_TIMEOUT_MS ?? probe.maxLatencyMs);

  if (dryRun) {
    console.log(`[dry-run] ${probe.id} ${probe.method} ${url}`);
    return { id: probe.id, ok: true, latencyMs: 0, url };
  }

  const started = Date.now();
  let response;
  let bodyText = '';

  try {
    response = await fetch(url, {
      method: probe.method,
      headers,
      redirect: 'follow',
      signal: AbortSignal.timeout(timeoutMs),
    });
    bodyText = await response.text();
  } catch (error) {
    const latencyMs = Date.now() - started;
    return {
      id: probe.id,
      ok: false,
      latencyMs,
      url,
      error: error.message,
    };
  }

  const latencyMs = Date.now() - started;
  const statusOk = probe.expectStatus.includes(response.status);
  let jsonOk = true;
  let jsonDetail;

  if (statusOk && probe.expectJson) {
    let parsed;
    try {
      parsed = JSON.parse(bodyText);
    } catch {
      jsonOk = false;
      jsonDetail = 'response is not valid JSON';
    }
    if (jsonOk) {
      const match = jsonMatches(parsed, probe.expectJson);
      jsonOk = match.ok;
      jsonDetail = match.detail;
    }
  }

  const latencyOk = latencyMs <= probe.maxLatencyMs;
  const ok = statusOk && jsonOk && latencyOk;

  return {
    id: probe.id,
    ok,
    latencyMs,
    url,
    status: response.status,
    statusOk,
    jsonOk,
    jsonDetail,
    latencyOk,
    maxLatencyMs: probe.maxLatencyMs,
  };
}

function printResult(result) {
  if (result.ok) {
    console.log(`OK   ${result.id} ${result.status ?? '-'} ${result.latencyMs}ms ${result.url}`);
    return;
  }

  const parts = [`FAIL ${result.id}`];
  if (result.error) {
    parts.push(result.error);
  } else {
    if (result.statusOk === false) {
      parts.push(`status=${result.status} expected one of manifest expectStatus`);
    }
    if (result.jsonOk === false) {
      parts.push(result.jsonDetail ?? 'json mismatch');
    }
    if (result.latencyOk === false) {
      parts.push(`latency=${result.latencyMs}ms exceeds ${result.maxLatencyMs}ms`);
    }
  }
  parts.push(result.url);
  console.error(parts.join(' | '));
}

async function main() {
  const manifest = loadManifest();
  const headers = buildHeaders();
  const startedAt = new Date().toISOString();

  console.log(`uptime-probes-run started_at=${startedAt} probes=${manifest.probes.length} dry_run=${dryRun}`);

  const results = [];
  for (const probe of manifest.probes) {
    const result = await runProbe(probe, headers);
    results.push(result);
    printResult(result);
  }

  const failed = results.filter((result) => !result.ok);
  if (failed.length > 0) {
    console.error(`\n${failed.length}/${results.length} uptime probe(s) failed.`);
    process.exit(1);
  }

  console.log(`\nAll ${results.length} uptime probe(s) passed.`);
}

main().catch((error) => {
  console.error(`uptime-probes-run error: ${error.message}`);
  process.exit(1);
});
