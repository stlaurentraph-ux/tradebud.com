#!/usr/bin/env node
/**
 * Guardrail 4.M.2 — marketing Lighthouse LCP/CLS budgets vs manifest baseline.
 *
 * Run: npm run lighthouse:budgets:assert -w tracebud-marketing
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
    return JSON.parse(readMarketing('qa/automation-baselines/marketing-lighthouse-budgets.json'));
  } catch (error) {
    throw new Error(`Invalid marketing-lighthouse-budgets.json: ${error.message}`);
  }
}

function assertManifestShape(manifest) {
  if (manifest.schemaVersion !== 1) {
    throw new Error('manifest schemaVersion must be 1');
  }
  if (manifest.slice !== '4.M.2') {
    throw new Error('manifest slice must be 4.M.2');
  }
  if (manifest.locale !== 'en') {
    throw new Error('manifest locale must be en');
  }
  if (!manifest.runnerModule) {
    throw new Error('manifest must define runnerModule');
  }
  if (manifest.serverProbePath !== '/en') {
    throw new Error('manifest serverProbePath must be /en');
  }
  if (!Array.isArray(manifest.routes) || manifest.routes.length !== 2) {
    throw new Error('manifest must define exactly two Lighthouse routes');
  }
  for (const route of manifest.routes) {
    if (!route.budgets?.lcpMsMax || route.budgets.clsMax == null) {
      throw new Error(`${route.id} must define lcpMsMax and clsMax budgets`);
    }
  }
  const ids = manifest.routes.map((route) => route.id);
  if (!ids.includes('home') || !ids.includes('pricing')) {
    throw new Error('manifest routes must include home and pricing');
  }
}

function assertRunnerAlignment(manifest) {
  readMarketing(manifest.runnerModule);
  const runner = readMarketing(manifest.runnerModule);
  if (!runner.includes("from 'lighthouse'")) {
    throw new Error(`${manifest.runnerModule} must import lighthouse`);
  }
  if (!runner.includes('chrome-launcher')) {
    throw new Error(`${manifest.runnerModule} must launch Chrome via chrome-launcher`);
  }
  if (!runner.includes('chromium.executablePath')) {
    throw new Error(`${manifest.runnerModule} must reuse Playwright Chromium binary`);
  }
  if (!runner.includes('largest-contentful-paint')) {
    throw new Error(`${manifest.runnerModule} must read LCP audit`);
  }
  if (!runner.includes('cumulative-layout-shift')) {
    throw new Error(`${manifest.runnerModule} must read CLS audit`);
  }
  if (!runner.includes('manifest.routes')) {
    throw new Error(`${manifest.runnerModule} must iterate manifest.routes`);
  }
  if (!runner.includes('route.path')) {
    throw new Error(`${manifest.runnerModule} must build URLs from route.path`);
  }
  if (!runner.includes('lcpMsMax') || !runner.includes('clsMax')) {
    throw new Error(`${manifest.runnerModule} must enforce lcpMsMax and clsMax budgets`);
  }
  if (!runner.includes('marketing-lighthouse-budgets.json')) {
    throw new Error(`${manifest.runnerModule} must load marketing-lighthouse-budgets.json`);
  }
}

function assertPackageScripts() {
  const pkg = JSON.parse(readMarketing('package.json'));
  if (!pkg.scripts?.['lighthouse:budgets']) {
    throw new Error('package.json must define lighthouse:budgets script');
  }
  if (!pkg.scripts?.['lighthouse:budgets:assert']) {
    throw new Error('package.json must define lighthouse:budgets:assert script');
  }
  if (!pkg.devDependencies?.lighthouse) {
    throw new Error('package.json must include lighthouse devDependency');
  }
}

function main() {
  const manifest = loadManifest();
  assertManifestShape(manifest);
  assertRunnerAlignment(manifest);
  assertPackageScripts();
  console.log(
    `Marketing Lighthouse budget guard passed (${manifest.routes.length} routes, locale=${manifest.locale}).`,
  );
}

main();
