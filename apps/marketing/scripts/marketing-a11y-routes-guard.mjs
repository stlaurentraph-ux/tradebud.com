#!/usr/bin/env node
/**
 * Guardrail 4.M.1 — marketing axe-core a11y routes vs manifest baseline.
 *
 * Run: npm run a11y:routes:assert -w tracebud-marketing
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
    return JSON.parse(readMarketing('qa/automation-baselines/marketing-a11y-routes.json'));
  } catch (error) {
    throw new Error(`Invalid marketing-a11y-routes.json: ${error.message}`);
  }
}

function assertManifestShape(manifest) {
  if (manifest.schemaVersion !== 1) {
    throw new Error('manifest schemaVersion must be 1');
  }
  if (manifest.slice !== '4.M.1') {
    throw new Error('manifest slice must be 4.M.1');
  }
  if (manifest.locale !== 'en') {
    throw new Error('manifest locale must be en');
  }
  if (!manifest.specFile) {
    throw new Error('manifest must define specFile');
  }
  if (!Array.isArray(manifest.axeTags) || manifest.axeTags.length < 4) {
    throw new Error('manifest must define WCAG axe tags');
  }
  if (!Array.isArray(manifest.routes) || manifest.routes.length !== 2) {
    throw new Error('manifest must define exactly two a11y routes');
  }
  const ids = manifest.routes.map((route) => route.id);
  if (!ids.includes('home') || !ids.includes('pricing')) {
    throw new Error('manifest routes must include home and pricing');
  }
}

function assertSpecAlignment(manifest) {
  const spec = readMarketing(manifest.specFile);
  if (!spec.includes('@axe-core/playwright')) {
    throw new Error(`${manifest.specFile} must use @axe-core/playwright`);
  }
  for (const tag of manifest.axeTags) {
    if (!spec.includes(tag)) {
      throw new Error(`${manifest.specFile} must scan axe tag ${tag}`);
    }
  }
  for (const route of manifest.routes) {
    if (!spec.includes(`test('${route.testName}'`)) {
      throw new Error(`${manifest.specFile} missing test "${route.testName}"`);
    }
    const routeSuffix = route.path.replace(`/${manifest.locale}`, '');
    if (routeSuffix === '') {
      if (!spec.includes('`/${locale}`') && !spec.includes('`/${locale}/')) {
        throw new Error(`${manifest.specFile} must navigate to home route with locale prefix`);
      }
    } else if (!spec.includes(`/\${locale}${routeSuffix}`)) {
      throw new Error(`${manifest.specFile} must navigate to ${route.path}`);
    }
  }
  if (!spec.includes("localStorage.setItem('cookie-consent', 'accepted')")) {
    throw new Error(`${manifest.specFile} must accept cookies before scanning`);
  }
}

function assertPlaywrightConfig() {
  const config = readMarketing('playwright.config.ts');
  if (!config.includes("testDir: './e2e'")) {
    throw new Error('playwright.config.ts must set testDir to ./e2e');
  }
  if (!config.includes('npm run start')) {
    throw new Error('playwright.config.ts webServer must start built marketing app');
  }
}

function assertBaselineFile(manifest) {
  if (!manifest.violationsBaseline) {
    throw new Error('manifest must define violationsBaseline');
  }
  const baselinePath = path.join(marketingRoot, manifest.violationsBaseline);
  if (!fs.existsSync(baselinePath)) {
    throw new Error(`Missing violations baseline: ${manifest.violationsBaseline}`);
  }
  let baseline;
  try {
    baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
  } catch (error) {
    throw new Error(`Invalid ${manifest.violationsBaseline}: ${error.message}`);
  }
  if (baseline.schemaVersion !== 1) {
    throw new Error('violations baseline schemaVersion must be 1');
  }
  for (const route of manifest.routes) {
    if (!baseline.routes?.[route.id]?.violations) {
      throw new Error(`violations baseline missing route ${route.id}`);
    }
  }
  const spec = readMarketing(manifest.specFile);
  if (!spec.includes('marketing-a11y-violations.baseline.json')) {
    throw new Error(`${manifest.specFile} must load violations baseline file`);
  }
}

function assertPackageScripts() {
  const pkg = JSON.parse(readMarketing('package.json'));
  if (!pkg.scripts?.['a11y:routes']) {
    throw new Error('package.json must define a11y:routes script');
  }
  if (!pkg.scripts?.['a11y:routes:assert']) {
    throw new Error('package.json must define a11y:routes:assert script');
  }
  if (!pkg.scripts?.['a11y:routes:baseline:refresh']) {
    throw new Error('package.json must define a11y:routes:baseline:refresh script');
  }
  if (!pkg.devDependencies?.['@axe-core/playwright']) {
    throw new Error('package.json must include @axe-core/playwright devDependency');
  }
}

function main() {
  const manifest = loadManifest();
  assertManifestShape(manifest);
  assertSpecAlignment(manifest);
  assertBaselineFile(manifest);
  assertPlaywrightConfig();
  assertPackageScripts();
  console.log(
    `Marketing a11y routes guard passed (${manifest.routes.length} routes, locale=${manifest.locale}).`,
  );
}

main();
