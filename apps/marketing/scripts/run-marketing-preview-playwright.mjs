#!/usr/bin/env node
/**
 * Run marketing golden-path Playwright suite against a Vercel preview URL (slice 4.6).
 *
 * Skips with exit 0 when no preview URL is available (marketing deploy may be disabled).
 * Fails when an explicit preview URL is configured but unreachable.
 *
 * Run: npm run e2e:preview -w tracebud-marketing
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveMarketingPreviewUrl } from './resolve-marketing-preview-url.mjs';

const marketingRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function loadManifest() {
  const manifestPath = path.join(
    marketingRoot,
    'qa/automation-baselines/marketing-playwright-preview.json',
  );
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

function bypassHeaders() {
  const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET?.trim();
  if (!bypass) {
    return {};
  }
  return { 'x-vercel-protection-bypass': bypass };
}

async function assertPreviewReady(baseUrl, readinessPath) {
  const response = await fetch(`${baseUrl}${readinessPath}`, {
    redirect: 'follow',
    headers: {
      accept: 'text/html',
      ...bypassHeaders(),
    },
  });
  return response.status;
}

async function main() {
  const manifest = loadManifest();
  const resolution = await resolveMarketingPreviewUrl();

  if (!resolution.url) {
    if (manifest.skipWhenPreviewMissing) {
      console.log(
        'marketing-playwright-preview: skipped — no preview URL (set MARKETING_PREVIEW_BASE_URL or enable Vercel PR previews).',
      );
      process.exit(0);
    }
    console.error('marketing-playwright-preview: missing preview URL.');
    process.exit(1);
  }

  const status = await assertPreviewReady(resolution.url, manifest.readinessPath);
  if (status < 200 || status >= 400) {
    const message = `Preview readiness check failed for ${resolution.url}${manifest.readinessPath} (${status}).`;
    if (resolution.explicit) {
      console.error(message);
      process.exit(1);
    }
    console.log(`${message} Skipping preview Playwright (non-explicit preview URL).`);
    process.exit(0);
  }

  console.log(
    `marketing-playwright-preview: running against ${resolution.url} (source=${resolution.source}).`,
  );

  const grepPattern = manifest.requiredPreviewTests
    .map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|');

  const result = spawnSync(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['playwright', 'test', manifest.specFile, '--grep', grepPattern],
    {
      cwd: marketingRoot,
      stdio: 'inherit',
      env: {
        ...process.env,
        PLAYWRIGHT_BASE_URL: resolution.url,
        PLAYWRIGHT_SKIP_WEBSERVER: '1',
      },
    },
  );

  process.exit(result.status ?? 1);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
