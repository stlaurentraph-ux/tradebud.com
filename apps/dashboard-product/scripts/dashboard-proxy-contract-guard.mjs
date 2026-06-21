#!/usr/bin/env node
/**
 * Guardrail 4.3 — dashboard proxy contract suites vs manifest baseline.
 *
 * Run: npm run proxy:contracts:assert -w dashboard-product
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dashboardRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function readDashboard(relativePath) {
  const fullPath = path.join(dashboardRoot, relativePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing required file: ${relativePath}`);
  }
  return fs.readFileSync(fullPath, 'utf8');
}

function loadJson(relativePath) {
  try {
    return JSON.parse(readDashboard(relativePath));
  } catch (error) {
    throw new Error(`Invalid ${relativePath}: ${error.message}`);
  }
}

function assertManifestShape(manifest) {
  if (manifest.schemaVersion !== 1) {
    throw new Error('manifest schemaVersion must be 1');
  }
  if (manifest.slice !== '4.3') {
    throw new Error('manifest slice must be 4.3');
  }
  if (!manifest.openapiCodegenBaseline) {
    throw new Error('manifest must define openapiCodegenBaseline');
  }
  if (!Array.isArray(manifest.contractSuites) || manifest.contractSuites.length < 5) {
    throw new Error('manifest must define at least five launch proxy contract suites');
  }
}

function assertOpenApiGoldenCoverage(manifest) {
  const codegen = loadJson(manifest.openapiCodegenBaseline);
  const coveredBackendPaths = new Set();
  for (const suite of manifest.contractSuites) {
    for (const operation of suite.operations) {
      coveredBackendPaths.add(operation.backendPath);
    }
  }
  for (const backendPath of codegen.goldenProxyPaths ?? []) {
    if (!coveredBackendPaths.has(backendPath)) {
      throw new Error(`OpenAPI golden proxy path ${backendPath} is not covered by proxy contract suites`);
    }
  }
}

function assertDashboardRouteBaseline(manifest) {
  const routesBaseline = loadJson('qa/automation-baselines/dashboard-api-routes.json');
  const routeByDashboardPath = new Map(
    routesBaseline.routes.map((route) => [route.dashboardPath, route]),
  );

  for (const suite of manifest.contractSuites) {
    const routeEntry = routeByDashboardPath.get(suite.dashboardPath);
    if (!routeEntry) {
      throw new Error(`dashboard-api-routes baseline missing ${suite.dashboardPath}`);
    }
    if (routeEntry.category !== 'backend-proxy') {
      throw new Error(`${suite.dashboardPath} must remain a backend-proxy route`);
    }
    if (routeEntry.failClosed !== true) {
      throw new Error(`${suite.dashboardPath} must remain fail-closed in dashboard-api-routes baseline`);
    }

    const expectedBackendPaths = new Set(routeEntry.backendPaths);
    for (const operation of suite.operations) {
      if (!expectedBackendPaths.has(operation.backendPath)) {
        throw new Error(
          `${suite.id} references backend path ${operation.backendPath} not listed for ${suite.dashboardPath}`,
        );
      }
    }
  }
}

function assertSuiteModules(manifest) {
  for (const suite of manifest.contractSuites) {
    const routeSource = readDashboard(suite.routeModule);
    const testSource = readDashboard(suite.testModule);

    if (!routeSource.includes('TRACEBUD_BACKEND_URL')) {
      throw new Error(`${suite.routeModule} must fail closed when TRACEBUD_BACKEND_URL is missing`);
    }

    for (const operation of suite.operations) {
      const backendUrlFragment = `/api${operation.backendPath}`;
      if (!routeSource.includes(operation.backendPath) && !routeSource.includes(backendUrlFragment)) {
        throw new Error(`${suite.routeModule} must reference backend path ${operation.backendPath}`);
      }
      if (!testSource.includes(backendUrlFragment)) {
        throw new Error(`${suite.testModule} must assert forwarding to ${backendUrlFragment}`);
      }

      for (const testName of operation.requiredTests) {
        if (!testSource.includes(`it('${testName}'`)) {
          throw new Error(`${suite.testModule} missing required contract test "${testName}"`);
        }
      }
    }

    if (!testSource.includes('TRACEBUD_BACKEND_URL is required.')) {
      throw new Error(`${suite.testModule} must assert fail-closed 503 when backend URL is missing`);
    }
  }
}

function assertPackageScripts() {
  const pkg = JSON.parse(readDashboard('package.json'));
  if (!pkg.scripts?.['proxy:contracts:assert']) {
    throw new Error('package.json must define proxy:contracts:assert script');
  }
}

function main() {
  const manifest = loadJson('qa/automation-baselines/dashboard-proxy-contracts.json');
  assertManifestShape(manifest);
  assertOpenApiGoldenCoverage(manifest);
  assertDashboardRouteBaseline(manifest);
  assertSuiteModules(manifest);
  assertPackageScripts();

  const operationCount = manifest.contractSuites.reduce(
    (total, suite) => total + suite.operations.length,
    0,
  );
  console.log(
    `Dashboard proxy contract guard passed (${manifest.contractSuites.length} suites, ${operationCount} operations).`,
  );
}

main();
