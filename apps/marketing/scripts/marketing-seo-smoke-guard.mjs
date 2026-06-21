#!/usr/bin/env node
/**
 * Guardrail 2.M.2 — marketing SEO smoke vs manifest baseline.
 *
 * Run: npm run seo:smoke:assert -w tracebud-marketing
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
    return JSON.parse(readMarketing('qa/automation-baselines/marketing-seo-smoke.json'));
  } catch (error) {
    throw new Error(`Invalid marketing-seo-smoke.json: ${error.message}`);
  }
}

function assertManifestShape(manifest) {
  if (manifest.schemaVersion !== 1) {
    throw new Error('manifest schemaVersion must be 1');
  }
  if (manifest.slice !== '2.M.2') {
    throw new Error('manifest slice must be 2.M.2');
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
  if (manifest.robotsPath !== '/robots.txt') {
    throw new Error('manifest robotsPath must be /robots.txt');
  }
  if (manifest.sitemapPath !== '/sitemap.xml') {
    throw new Error('manifest sitemapPath must be /sitemap.xml');
  }
  if (!Array.isArray(manifest.robotsRequiredLines) || manifest.robotsRequiredLines.length < 4) {
    throw new Error('manifest must define robotsRequiredLines');
  }
  if (!Array.isArray(manifest.sitemapRequiredUrls) || manifest.sitemapRequiredUrls.length < 3) {
    throw new Error('manifest must define sitemapRequiredUrls');
  }
  if (!Array.isArray(manifest.routes) || manifest.routes.length !== 2) {
    throw new Error('manifest must define exactly two SEO routes');
  }
  const ids = manifest.routes.map((route) => route.id);
  if (!ids.includes('home') || !ids.includes('pricing')) {
    throw new Error('manifest routes must include home and pricing');
  }
  for (const route of manifest.routes) {
    if (!route.canonical?.startsWith('https://')) {
      throw new Error(`${route.id} must define absolute canonical URL`);
    }
  }
}

function assertRunnerAlignment(manifest) {
  readMarketing(manifest.runnerModule);
  const runner = readMarketing(manifest.runnerModule);
  if (!runner.includes('marketing-seo-smoke.json')) {
    throw new Error(`${manifest.runnerModule} must load marketing-seo-smoke.json`);
  }
  if (!runner.includes('manifest.routes')) {
    throw new Error(`${manifest.runnerModule} must iterate manifest.routes`);
  }
  if (!runner.includes('robotsRequiredLines')) {
    throw new Error(`${manifest.runnerModule} must assert robotsRequiredLines`);
  }
  if (!runner.includes('sitemapRequiredUrls')) {
    throw new Error(`${manifest.runnerModule} must assert sitemapRequiredUrls`);
  }
  if (!runner.includes('extractCanonicalHref')) {
    throw new Error(`${manifest.runnerModule} must extract canonical link tags`);
  }
  if (!runner.includes('route.canonical')) {
    throw new Error(`${manifest.runnerModule} must enforce route.canonical`);
  }
  if (!runner.includes('ensureServer')) {
    throw new Error(`${manifest.runnerModule} must reuse or start server via ensureServer`);
  }
}

function assertPackageScripts() {
  const pkg = JSON.parse(readMarketing('package.json'));
  if (!pkg.scripts?.['seo:smoke']) {
    throw new Error('package.json must define seo:smoke script');
  }
  if (!pkg.scripts?.['seo:smoke:assert']) {
    throw new Error('package.json must define seo:smoke:assert script');
  }
}

function main() {
  const manifest = loadManifest();
  assertManifestShape(manifest);
  assertRunnerAlignment(manifest);
  assertPackageScripts();
  console.log(
    `Marketing SEO smoke guard passed (${manifest.routes.length} routes, locale=${manifest.locale}).`,
  );
}

main();
