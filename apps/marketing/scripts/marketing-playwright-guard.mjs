#!/usr/bin/env node
/**
 * Guardrail 4.4 — marketing Playwright golden paths vs manifest baseline.
 *
 * Run: npm run e2e:golden-paths:assert -w tracebud-marketing
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
  let manifest;
  try {
    manifest = JSON.parse(readMarketing('qa/automation-baselines/marketing-playwright-golden-paths.json'));
  } catch (error) {
    throw new Error(`Invalid marketing-playwright-golden-paths.json: ${error.message}`);
  }
  return manifest;
}

function assertManifestShape(manifest) {
  if (manifest.schemaVersion !== 1) {
    throw new Error('manifest schemaVersion must be 1');
  }
  if (manifest.slice !== '4.4') {
    throw new Error('manifest slice must be 4.4');
  }
  if (manifest.locale !== 'en') {
    throw new Error('manifest locale must be en');
  }
  if (!Array.isArray(manifest.paths) || manifest.paths.length !== 3) {
    throw new Error('manifest must define exactly three golden paths');
  }
  const ids = manifest.paths.map((item) => item.id);
  if (!ids.includes('home') || !ids.includes('pricing') || !ids.includes('waitlist')) {
    throw new Error('manifest paths must include home, pricing, and waitlist');
  }
}

function assertSpecAlignment(manifest) {
  const specFiles = new Set(manifest.paths.map((item) => item.specFile));
  for (const specFile of specFiles) {
    const spec = readMarketing(specFile);
    for (const pathItem of manifest.paths.filter((item) => item.specFile === specFile)) {
      if (!spec.includes(`test('${pathItem.testName}'`)) {
        throw new Error(`spec missing test "${pathItem.testName}" in ${specFile}`);
      }
    }
  }

  const primarySpec = readMarketing('e2e/golden-paths.spec.ts');
  if (!primarySpec.includes('/${locale}')) {
    throw new Error('golden-paths spec must navigate with locale-prefixed routes');
  }
  if (!primarySpec.includes('/pricing')) {
    throw new Error('golden-paths spec must cover /pricing route');
  }

  const waitlistPath = manifest.paths.find((item) => item.id === 'waitlist');
  if (!primarySpec.includes('page.route(') || !primarySpec.includes(waitlistPath.mockedApi)) {
    throw new Error('waitlist spec must mock POST /api/waitlist');
  }
}

function assertPlaywrightConfig(manifest) {
  const config = readMarketing('playwright.config.ts');
  if (!config.includes("testDir: './e2e'")) {
    throw new Error('playwright.config.ts must set testDir to ./e2e');
  }
  if (!config.includes('npm run start')) {
    throw new Error('playwright.config.ts webServer must start built marketing app');
  }
  if (!config.includes('NEXT_PUBLIC_SENTRY_ENABLED')) {
    throw new Error('playwright.config.ts must disable Sentry for local/CI runs');
  }
  if (!config.includes(manifest.locale)) {
    throw new Error(`playwright.config.ts must probe /${manifest.locale} readiness URL`);
  }
}

function assertPackageScripts() {
  const pkg = JSON.parse(readMarketing('package.json'));
  if (!pkg.scripts?.['e2e:golden-paths']) {
    throw new Error('package.json must define e2e:golden-paths script');
  }
  if (!pkg.scripts?.['e2e:golden-paths:assert']) {
    throw new Error('package.json must define e2e:golden-paths:assert script');
  }
  if (!pkg.devDependencies?.['@playwright/test']) {
    throw new Error('package.json must include @playwright/test devDependency');
  }
}

function main() {
  const manifest = loadManifest();
  assertManifestShape(manifest);
  assertSpecAlignment(manifest);
  assertPlaywrightConfig(manifest);
  assertPackageScripts();
  console.log(
    `Marketing Playwright guard passed (${manifest.paths.length} golden paths, locale=${manifest.locale}).`,
  );
}

main();
