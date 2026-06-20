#!/usr/bin/env node
/**
 * Marketing post-deploy smoke (slice 2.4).
 *
 * Checks live pages (200), stealth draft routes (404), and API method sanity
 * against a deployed marketing base URL.
 *
 * Required env:
 * - MARKETING_SMOKE_BASE_URL (e.g. https://tracebud.com)
 *
 * Optional env:
 * - MARKETING_SMOKE_LOCALE (default: en)
 * - MARKETING_SMOKE_STEALTH (default: 404) — set to "skip" to skip stealth 404 checks
 * - VERCEL_AUTOMATION_BYPASS_SECRET — Vercel Deployment Protection bypass header
 * - MARKETING_SMOKE_TIMEOUT_MS (default: 15000)
 *
 * Run: npm run smoke:post-deploy -w tracebud-marketing
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const marketingRoot = path.join(__dirname, '..');

const baseUrl = process.env.MARKETING_SMOKE_BASE_URL?.trim();
const locale = process.env.MARKETING_SMOKE_LOCALE?.trim() || 'en';
const timeoutMs = Number(process.env.MARKETING_SMOKE_TIMEOUT_MS ?? 15_000);

if (!baseUrl) {
  console.error('Missing MARKETING_SMOKE_BASE_URL');
  process.exit(1);
}

const normalizedBase = baseUrl.replace(/\/$/, '');
const stealthMode = process.env.MARKETING_SMOKE_STEALTH?.trim() || '404';

function readMarketing(relativePath) {
  return fs.readFileSync(path.join(marketingRoot, relativePath), 'utf8');
}

function extractSiteMapEntries(source) {
  const arrayMatch = source.match(/export const marketingSiteMap[\s\S]*?=\s*\[([\s\S]*?)\n\];/);
  if (!arrayMatch) {
    throw new Error('Could not parse marketingSiteMap array');
  }

  const blocks = arrayMatch[1].split(/\n  \{/).slice(1);
  const entries = [];

  for (const block of blocks) {
    const href = block.match(/href:\s*'([^']+)'/)?.[1];
    if (!href?.startsWith('/')) {
      continue;
    }
    entries.push({
      href,
      routeId: block.match(/routeId:\s*'([^']+)'/)?.[1],
      status: block.match(/status:\s*'([^']+)'/)?.[1],
    });
  }

  return entries;
}

function extractPublicationFlags(source) {
  const match = source.match(/export const marketingRoutePublication[\s\S]*?=\s*\{([\s\S]*?)\n\};/);
  if (!match) {
    throw new Error('Could not parse marketingRoutePublication');
  }
  const flags = {};
  for (const row of match[1].matchAll(/^\s*'?([^':\s]+)'?\s*:\s*(true|false)/gm)) {
    flags[row[1]] = row[2] === 'true';
  }
  return flags;
}

function localePath(href) {
  if (href === '/') {
    return `/${locale}`;
  }
  return `/${locale}${href}`;
}

function requestHeaders() {
  const headers = { accept: 'text/html,application/json' };
  const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET?.trim();
  if (bypass) {
    headers['x-vercel-protection-bypass'] = bypass;
  }
  return headers;
}

async function fetchStatus(url, init = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      ...init,
      headers: {
        ...requestHeaders(),
        ...(init.headers ?? {}),
      },
      signal: controller.signal,
    });
    return response.status;
  } finally {
    clearTimeout(timer);
  }
}

const publicationSource = readMarketing('lib/marketing-publication.ts');
const siteMapSource = readMarketing('lib/marketing-site-map.ts');
const publication = extractPublicationFlags(publicationSource);
const siteEntries = extractSiteMapEntries(siteMapSource);

const livePaths = [
  ...new Set(
    siteEntries
      .filter(
        (entry) =>
          !entry.routeId && (entry.status === 'live-styled' || entry.status === 'legal'),
      )
      .map((entry) => localePath(entry.href)),
  ),
  '/sitemap.xml',
];

const stealthPaths = [
  ...new Set(
    siteEntries
      .filter((entry) => entry.routeId && publication[entry.routeId] !== true)
      .map((entry) => localePath(entry.href)),
  ),
];

const apiChecks = [
  { label: 'GET /api/leads rejects', path: '/api/leads', method: 'GET', expect: 405 },
  {
    label: 'POST /api/leads validates body',
    path: '/api/leads',
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{}',
    expect: 400,
  },
  { label: 'GET /api/waitlist rejects', path: '/api/waitlist', method: 'GET', expect: 405 },
  {
    label: 'POST /api/waitlist validates body',
    path: '/api/waitlist',
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{}',
    expect: 400,
  },
  {
    label: 'GET /api/checklist/download serves asset',
    path: '/api/checklist/download',
    method: 'GET',
    expect: 200,
  },
  {
    label: 'POST /api/checklist/download rejects',
    path: '/api/checklist/download',
    method: 'POST',
    expect: 405,
  },
];

const failures = [];

console.log(`marketing-post-deploy-smoke base=${normalizedBase} locale=${locale} stealth=${stealthMode}`);
console.log(`live_paths=${livePaths.length} stealth_paths=${stealthPaths.length} api_checks=${apiChecks.length}`);

for (const pagePath of livePaths) {
  const url = `${normalizedBase}${pagePath}`;
  const status = await fetchStatus(url, { method: 'GET' });
  if (status < 200 || status >= 400) {
    failures.push(`live ${pagePath} expected 2xx/3xx got ${status}`);
  } else {
    console.log(`ok live ${pagePath} → ${status}`);
  }
}

if (stealthMode !== 'skip') {
  for (const pagePath of stealthPaths) {
    const url = `${normalizedBase}${pagePath}`;
    const status = await fetchStatus(url, { method: 'GET' });
    if (status !== 404) {
      failures.push(`stealth ${pagePath} expected 404 got ${status}`);
    } else {
      console.log(`ok stealth ${pagePath} → 404`);
    }
  }
} else {
  console.log('skip stealth 404 checks (MARKETING_SMOKE_STEALTH=skip)');
}

for (const check of apiChecks) {
  const url = `${normalizedBase}${check.path}`;
  const status = await fetchStatus(url, {
    method: check.method,
    headers: check.headers,
    body: check.body,
  });
  if (status !== check.expect) {
    failures.push(`${check.label} expected ${check.expect} got ${status}`);
  } else {
    console.log(`ok ${check.label} → ${status}`);
  }
}

if (failures.length > 0) {
  console.error('\nMarketing post-deploy smoke failed:');
  for (const failure of failures) {
    console.error(`  - ${failure}`);
  }
  process.exit(1);
}

console.log('\nMarketing post-deploy smoke passed.');
