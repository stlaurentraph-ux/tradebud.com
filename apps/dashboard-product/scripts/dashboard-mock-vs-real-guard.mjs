#!/usr/bin/env node
/**
 * Guardrail 4.9 — dashboard mock-vs-real API guard (no silent mock in prod paths).
 *
 * Run: npm run mock:prod:assert -w dashboard-product
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dashboardRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = path.join(
  dashboardRoot,
  'qa/automation-baselines/dashboard-mock-vs-real-api.json',
);

function readDashboard(relativePath) {
  const fullPath = path.join(dashboardRoot, relativePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing required file: ${relativePath}`);
  }
  return fs.readFileSync(fullPath, 'utf8');
}

function loadManifest() {
  try {
    return JSON.parse(readDashboard('qa/automation-baselines/dashboard-mock-vs-real-api.json'));
  } catch (error) {
    throw new Error(`Invalid dashboard-mock-vs-real-api.json: ${error.message}`);
  }
}

function toPosix(relativePath) {
  return relativePath.replace(/\\/g, '/');
}

function listSourceFiles(dir, acc = []) {
  if (!fs.existsSync(dir)) {
    return acc;
  }
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      listSourceFiles(fullPath, acc);
      continue;
    }
    if (!entry.isFile()) {
      continue;
    }
    if (!/\.(ts|tsx)$/.test(entry.name)) {
      continue;
    }
    acc.push(fullPath);
  }
  return acc;
}

function isScanExcluded(relativePath, manifest) {
  const normalized = toPosix(relativePath);
  if (manifest.scanExcludedPrefixes?.some((prefix) => normalized.startsWith(prefix))) {
    return true;
  }
  return manifest.scanExcludedSuffixes?.some((suffix) => normalized.endsWith(suffix)) ?? false;
}

function importsMockModule(source, manifest) {
  const prefixHits = (manifest.mockImportPrefixes ?? []).some(
    (prefix) => source.includes(`from '${prefix}`) || source.includes(`from "${prefix}`),
  );
  const relativeMockHits =
    source.includes("from './mocks/") ||
    source.includes('from "./mocks/') ||
    source.includes("from '../mocks/") ||
    source.includes('from "../mocks/');
  return prefixHits || relativeMockHits;
}

function assertManifestShape(manifest) {
  if (manifest.schemaVersion !== 1) {
    throw new Error('manifest schemaVersion must be 1');
  }
  if (manifest.slice !== '4.9') {
    throw new Error('manifest slice must be 4.9');
  }
  if (!Array.isArray(manifest.mockImportPrefixes) || manifest.mockImportPrefixes.length < 2) {
    throw new Error('manifest must define mockImportPrefixes');
  }
  if (!Array.isArray(manifest.demoGatedConsumers) || manifest.demoGatedConsumers.length < 8) {
    throw new Error('manifest must define demoGatedConsumers');
  }
  if (!Array.isArray(manifest.devOnlyInlineMockPages) || manifest.devOnlyInlineMockPages.length < 2) {
    throw new Error('manifest must define devOnlyInlineMockPages');
  }
  if (!Array.isArray(manifest.demoSeedOnlyModules) || manifest.demoSeedOnlyModules.length < 2) {
    throw new Error('manifest must define demoSeedOnlyModules');
  }
  if (!Array.isArray(manifest.devBypassRouteModules) || manifest.devBypassRouteModules.length < 2) {
    throw new Error('manifest must define devBypassRouteModules');
  }
}

function assertDemoDataProductionPolicy(manifest) {
  const source = readDashboard(manifest.demoDataModeModule);
  if (!source.includes('return process.env.NODE_ENV === \'development\';')) {
    throw new Error(`${manifest.demoDataModeModule} must default demo toggle to development only`);
  }
  if (!source.includes('return false;')) {
    throw new Error(`${manifest.demoDataModeModule} must fail closed when demo toggle is unavailable`);
  }
}

function assertProductionEnvExample(manifest) {
  const envExample = readDashboard(manifest.productionEnvExample);
  for (const forbidden of manifest.productionEnvForbiddenPatterns ?? []) {
    if (envExample.includes(forbidden)) {
      throw new Error(`${manifest.productionEnvExample} must not enable ${forbidden}`);
    }
  }
  if (!envExample.includes('NEXT_PUBLIC_ENABLE_INTERNAL_TOOLS=false')) {
    throw new Error(`${manifest.productionEnvExample} must disable internal tools by default`);
  }
}

function assertDemoGatedConsumers(manifest) {
  for (const consumer of manifest.demoGatedConsumers) {
    const source = readDashboard(consumer.module);
    if (!importsMockModule(source, manifest)) {
      throw new Error(`${consumer.module} is listed as demo-gated but no longer imports mock modules`);
    }
    if (!source.includes(consumer.requiredGate)) {
      throw new Error(`${consumer.module} must gate mock usage on ${consumer.requiredGate}`);
    }
    if (!source.includes('useDemoData')) {
      throw new Error(`${consumer.module} must read demo mode via useDemoData()`);
    }
  }
}

function assertDevOnlyInlineMockPages(manifest) {
  for (const pageModule of manifest.devOnlyInlineMockPages) {
    const source = readDashboard(pageModule);
    if (!source.includes("NODE_ENV !== 'production'")) {
      throw new Error(`${pageModule} must guard inline mock data with NODE_ENV !== 'production'`);
    }
  }
}

function assertDemoSeedOnlyModules(manifest) {
  for (const modulePath of manifest.demoSeedOnlyModules) {
    readDashboard(modulePath);
  }
}

function assertDemoWorkspaceModules(manifest) {
  for (const modulePath of manifest.demoWorkspaceModules ?? []) {
    readDashboard(modulePath);
  }
}

function assertDevBypassRoutes(manifest) {
  for (const route of manifest.devBypassRouteModules) {
    const source = readDashboard(route.module);
    for (const snippet of route.requiredGuardSnippets) {
      if (!source.includes(snippet)) {
        throw new Error(`${route.module} must include dev bypass guard snippet: ${snippet}`);
      }
    }
  }
}

function assertNoMockImportsInApiRoutes(manifest) {
  const apiRoot = path.join(dashboardRoot, 'app/api');
  const routeFiles = listSourceFiles(apiRoot).filter((filePath) => path.basename(filePath) === 'route.ts');
  for (const routeFile of routeFiles) {
    const relativePath = toPosix(path.relative(dashboardRoot, routeFile));
    const source = fs.readFileSync(routeFile, 'utf8');
    if (importsMockModule(source, manifest)) {
      throw new Error(`${relativePath} must not import mock modules in production API handlers`);
    }
  }
}

function assertMockImportInventory(manifest) {
  const allowlisted = new Set([
    ...(manifest.demoGatedConsumers ?? []).map((item) => item.module),
    ...(manifest.demoSeedOnlyModules ?? []),
  ]);

  const discovered = [];
  for (const filePath of listSourceFiles(dashboardRoot)) {
    const relativePath = toPosix(path.relative(dashboardRoot, filePath));
    if (isScanExcluded(relativePath, manifest)) {
      continue;
    }
    const source = fs.readFileSync(filePath, 'utf8');
    if (!importsMockModule(source, manifest)) {
      continue;
    }
    discovered.push(relativePath);
    if (!allowlisted.has(relativePath)) {
      throw new Error(
        `${relativePath} imports mock modules but is not allowlisted in dashboard-mock-vs-real-api.json`,
      );
    }
  }

  for (const consumer of manifest.demoGatedConsumers ?? []) {
    if (!discovered.includes(consumer.module)) {
      throw new Error(`manifest lists ${consumer.module} but no mock import was discovered`);
    }
  }
  for (const seedModule of manifest.demoSeedOnlyModules ?? []) {
    if (!discovered.includes(seedModule)) {
      throw new Error(`manifest lists ${seedModule} but no mock import was discovered`);
    }
  }
}

function assertPackageScript() {
  const pkg = JSON.parse(readDashboard('package.json'));
  if (!pkg.scripts?.['mock:prod:assert']) {
    throw new Error('package.json must define mock:prod:assert script');
  }
}

function main() {
  if (!fs.existsSync(manifestPath)) {
    throw new Error('Missing qa/automation-baselines/dashboard-mock-vs-real-api.json');
  }

  const manifest = loadManifest();
  assertManifestShape(manifest);
  assertDemoDataProductionPolicy(manifest);
  assertProductionEnvExample(manifest);
  assertDemoGatedConsumers(manifest);
  assertDevOnlyInlineMockPages(manifest);
  assertDemoSeedOnlyModules(manifest);
  assertDemoWorkspaceModules(manifest);
  assertDevBypassRoutes(manifest);
  assertNoMockImportsInApiRoutes(manifest);
  assertMockImportInventory(manifest);
  assertPackageScript();

  console.log(
    `Dashboard mock-vs-real guard passed (${manifest.demoGatedConsumers.length} demo-gated consumers, ${manifest.devOnlyInlineMockPages.length} dev-only pages).`,
  );
}

main();
