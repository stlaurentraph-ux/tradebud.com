#!/usr/bin/env node
/**
 * Guardrail 4.6 — marketing Playwright preview manifest + runner wiring.
 *
 * Run: npm run e2e:preview:assert -w tracebud-marketing
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const marketingRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function readMarketing(relativePath) {
  const fullPath = path.join(marketingRoot, relativePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing required file: ${relativePath}`);
  }
  return fs.readFileSync(fullPath, 'utf8');
}

function loadManifest() {
  try {
    return JSON.parse(readMarketing('qa/automation-baselines/marketing-playwright-preview.json'));
  } catch (error) {
    throw new Error(`Invalid marketing-playwright-preview.json: ${error.message}`);
  }
}

function assertManifestShape(manifest) {
  if (manifest.schemaVersion !== 1) {
    throw new Error('manifest schemaVersion must be 1');
  }
  if (manifest.slice !== '4.6') {
    throw new Error('manifest slice must be 4.6');
  }
  if (!manifest.goldenPathsManifest || !manifest.specFile || !manifest.readinessPath) {
    throw new Error('manifest must define goldenPathsManifest, specFile, and readinessPath');
  }
  if (!Array.isArray(manifest.requiredPreviewTests) || manifest.requiredPreviewTests.length < 2) {
    throw new Error('manifest must define requiredPreviewTests for home and pricing');
  }
  if (manifest.skipWhenPreviewMissing !== true) {
    throw new Error('manifest must skipWhenPreviewMissing=true until preview deploy is guaranteed');
  }
}

function assertGoldenPathsManifest(manifest) {
  const golden = JSON.parse(readMarketing(manifest.goldenPathsManifest));
  const spec = readMarketing(manifest.specFile);

  for (const testName of manifest.requiredPreviewTests) {
    if (!spec.includes(`test('${testName}'`)) {
      throw new Error(`${manifest.specFile} missing required preview test "${testName}"`);
    }
    const goldenEntry = golden.paths?.find((item) => item.testName === testName);
    if (!goldenEntry) {
      throw new Error(`${manifest.goldenPathsManifest} must include preview test "${testName}"`);
    }
  }

  for (const testName of manifest.optionalPreviewTests ?? []) {
    if (!spec.includes(`test('${testName}'`)) {
      throw new Error(`${manifest.specFile} missing optional preview test "${testName}"`);
    }
  }
}

function assertPlaywrightConfig(manifest) {
  const config = readMarketing('playwright.config.ts');
  if (!config.includes('PLAYWRIGHT_SKIP_WEBSERVER')) {
    throw new Error('playwright.config.ts must honor PLAYWRIGHT_SKIP_WEBSERVER for preview runs');
  }
  if (!config.includes('PLAYWRIGHT_BASE_URL')) {
    throw new Error('playwright.config.ts must honor PLAYWRIGHT_BASE_URL for preview runs');
  }
  if (!config.includes('VERCEL_AUTOMATION_BYPASS_SECRET')) {
    throw new Error('playwright.config.ts must forward VERCEL_AUTOMATION_BYPASS_SECRET header');
  }
  if (!config.includes(manifest.readinessPath.replace(/^\//, ''))) {
    throw new Error(`playwright.config.ts must reference readiness path ${manifest.readinessPath}`);
  }
}

function assertRunnerScripts(manifest) {
  readMarketing('scripts/resolve-marketing-preview-url.mjs');
  const runner = readMarketing('scripts/run-marketing-preview-playwright.mjs');
  if (!runner.includes('resolveMarketingPreviewUrl')) {
    throw new Error('preview runner must resolve preview URL before Playwright');
  }
  if (!runner.includes('PLAYWRIGHT_SKIP_WEBSERVER')) {
    throw new Error('preview runner must disable local webServer');
  }
  if (!runner.includes('manifest.specFile')) {
    throw new Error(`preview runner must target ${manifest.specFile} via manifest.specFile`);
  }
}

function assertPackageScripts() {
  const pkg = JSON.parse(readMarketing('package.json'));
  if (!pkg.scripts?.['e2e:preview']) {
    throw new Error('package.json must define e2e:preview script');
  }
  if (!pkg.scripts?.['e2e:preview:assert']) {
    throw new Error('package.json must define e2e:preview:assert script');
  }
}

function main() {
  const manifest = loadManifest();
  assertManifestShape(manifest);
  assertGoldenPathsManifest(manifest);
  assertPlaywrightConfig(manifest);
  assertRunnerScripts(manifest);
  assertPackageScripts();
  console.log(
    `Marketing Playwright preview guard passed (${manifest.requiredPreviewTests.length} required tests, readiness=${manifest.readinessPath}).`,
  );
}

main();
