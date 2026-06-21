#!/usr/bin/env node
/**
 * Run Lighthouse performance budgets for marketing key routes (slice 4.M.2).
 *
 * Run: npm run lighthouse:budgets -w tracebud-marketing
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import { chromium } from '@playwright/test';

const marketingRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = path.join(
  marketingRoot,
  'qa/automation-baselines/marketing-lighthouse-budgets.json',
);

const ROUTE_TIMEOUT_MS = Number(process.env.LIGHTHOUSE_ROUTE_TIMEOUT_MS ?? 180_000);
const CHROME_FLAGS = [
  '--headless=new',
  '--no-sandbox',
  '--disable-gpu',
  '--disable-dev-shm-usage',
  '--disable-extensions',
  '--mute-audio',
];

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

async function withTimeout(promise, timeoutMs, label) {
  let timeoutId;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new Error(`${label} timed out after ${timeoutMs}ms`)),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    clearTimeout(timeoutId);
  }
}

async function launchChrome() {
  return chromeLauncher.launch({
    chromeFlags: CHROME_FLAGS,
    chromePath: chromium.executablePath(),
  });
}

async function measureRoute(url, chromePort) {
  const result = await withTimeout(
    lighthouse(
      url,
      {
        port: chromePort,
        logLevel: 'error',
        output: 'json',
        onlyCategories: ['performance'],
      },
      {
        extends: 'lighthouse:default',
        settings: {
          maxWaitForLoad: 60_000,
          maxWaitForFcp: 45_000,
        },
      },
    ),
    ROUTE_TIMEOUT_MS,
    `Lighthouse ${url}`,
  );

  const lcpMs = result?.lhr?.audits?.['largest-contentful-paint']?.numericValue;
  const cls = result?.lhr?.audits?.['cumulative-layout-shift']?.numericValue;

  if (lcpMs == null || cls == null) {
    throw new Error(`Missing LCP/CLS audits for ${url}`);
  }

  return { lcpMs, cls };
}

function assertWithinBudget(route, metrics) {
  const { lcpMsMax, clsMax } = route.budgets;
  if (metrics.lcpMs > lcpMsMax) {
    throw new Error(
      `${route.id} LCP ${metrics.lcpMs.toFixed(0)}ms exceeds budget ${lcpMsMax}ms (${route.path})`,
    );
  }
  if (metrics.cls > clsMax) {
    throw new Error(
      `${route.id} CLS ${metrics.cls.toFixed(3)} exceeds budget ${clsMax} (${route.path})`,
    );
  }
}

async function main() {
  const manifest = loadManifest();
  const server = startServer();
  const chrome = await launchChrome();

  try {
    console.log(`Waiting for marketing server at ${baseURL}${manifest.serverProbePath}...`);
    await waitForServer(`${baseURL}${manifest.serverProbePath}`);

    for (const route of manifest.routes) {
      const url = `${baseURL}${route.path}`;
      console.log(`Measuring ${route.id} at ${url}...`);
      await fetch(url).catch(() => undefined);
      const metrics = await measureRoute(url, chrome.port);
      assertWithinBudget(route, metrics);
      console.log(
        `${route.id}: LCP=${metrics.lcpMs.toFixed(0)}ms (≤${route.budgets.lcpMsMax}), CLS=${metrics.cls.toFixed(3)} (≤${route.budgets.clsMax})`,
      );
    }
  } finally {
    await chrome.kill();
    server?.kill('SIGTERM');
  }
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
