#!/usr/bin/env node
/**
 * SEO smoke for marketing key routes (slice 2.M.2).
 *
 * Run: npm run seo:smoke -w tracebud-marketing
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const marketingRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = path.join(
  marketingRoot,
  'qa/automation-baselines/marketing-seo-smoke.json',
);

function loadManifest() {
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

const port = process.env.PLAYWRIGHT_PORT ?? '3000';
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`;

async function waitForServer(probeUrl, timeoutMs = 120_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(probeUrl);
      if (response.ok) {
        return;
      }
    } catch {
      // Server still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`Marketing server not ready at ${probeUrl}`);
}

function startServer() {
  if (process.env.PLAYWRIGHT_SKIP_WEBSERVER === '1') {
    return null;
  }

  return spawn('npm', ['run', 'start', '--', '-p', port], {
    cwd: marketingRoot,
    env: {
      ...process.env,
      NEXT_PUBLIC_SENTRY_ENABLED: '0',
      PORT: port,
    },
    stdio: process.env.CI ? 'inherit' : 'pipe',
  });
}

async function fetchText(urlPath) {
  const response = await fetch(`${baseURL}${urlPath}`);
  if (!response.ok) {
    throw new Error(`${urlPath} expected 2xx got ${response.status}`);
  }
  return response.text();
}

function extractCanonicalHref(html) {
  const match = html.match(/<link[^>]+rel=["']canonical["'][^>]*>/i);
  if (!match) {
    return null;
  }
  const hrefMatch = match[0].match(/href=["']([^"']+)["']/i);
  return hrefMatch?.[1] ?? null;
}

function assertRobots(manifest, robotsText) {
  for (const line of manifest.robotsRequiredLines) {
    if (!robotsText.includes(line)) {
      throw new Error(`robots.txt missing required line: ${line}`);
    }
  }
}

function assertSitemap(manifest, sitemapXml) {
  if (!sitemapXml.includes('<urlset')) {
    throw new Error('sitemap.xml missing urlset root element');
  }
  for (const url of manifest.sitemapRequiredUrls) {
    if (!sitemapXml.includes(`<loc>${url}</loc>`)) {
      throw new Error(`sitemap.xml missing required URL: ${url}`);
    }
  }
}

function assertRouteCanonical(route, html) {
  const canonical = extractCanonicalHref(html);
  if (!canonical) {
    throw new Error(`${route.id} missing canonical link (${route.path})`);
  }
  if (canonical !== route.canonical) {
    throw new Error(
      `${route.id} canonical ${canonical} !== expected ${route.canonical} (${route.path})`,
    );
  }
}

async function main() {
  const manifest = loadManifest();
  const server = startServer();

  try {
    console.log(`Waiting for marketing server at ${baseURL}${manifest.serverProbePath}...`);
    await waitForServer(`${baseURL}${manifest.serverProbePath}`);

    const robotsText = await fetchText(manifest.robotsPath);
    assertRobots(manifest, robotsText);
    console.log(`robots.txt ok (${manifest.robotsRequiredLines.length} required lines)`);

    const sitemapXml = await fetchText(manifest.sitemapPath);
    assertSitemap(manifest, sitemapXml);
    console.log(`sitemap.xml ok (${manifest.sitemapRequiredUrls.length} required URLs)`);

    for (const route of manifest.routes) {
      const html = await fetchText(route.path);
      assertRouteCanonical(route, html);
      console.log(`${route.id}: canonical=${route.canonical}`);
    }
  } finally {
    server?.kill('SIGTERM');
  }
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
