#!/usr/bin/env node
/**
 * Guardrail 4.1 — dashboard OpenAPI codegen manifest, generated types freshness, and re-exports.
 *
 * Run: npm run openapi:codegen:assert -w dashboard-product
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dashboardRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.join(dashboardRoot, '../..');

function readDashboard(relativePath) {
  const fullPath = path.join(dashboardRoot, relativePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing required file: ${relativePath}`);
  }
  return fs.readFileSync(fullPath, 'utf8');
}

function loadManifest() {
  let manifest;
  try {
    manifest = JSON.parse(readDashboard('qa/automation-baselines/dashboard-openapi-codegen.json'));
  } catch (error) {
    throw new Error(`Invalid dashboard-openapi-codegen.json: ${error.message}`);
  }
  return manifest;
}

function assertManifestShape(manifest) {
  if (manifest.schemaVersion !== 1) {
    throw new Error('manifest schemaVersion must be 1');
  }
  if (manifest.slice !== '4.1') {
    throw new Error('manifest slice must be 4.1');
  }
  if (!manifest.openapiSpec || !manifest.generatedTypesFile || !manifest.reexportModule) {
    throw new Error('manifest must define openapiSpec, generatedTypesFile, and reexportModule');
  }
  if (!Array.isArray(manifest.goldenProxyPaths) || manifest.goldenProxyPaths.length < 3) {
    throw new Error('manifest must define goldenProxyPaths for launch proxy coverage');
  }
  if (!Array.isArray(manifest.consumerTypeExports) || manifest.consumerTypeExports.length === 0) {
    throw new Error('manifest must define consumerTypeExports');
  }
}

function assertOpenApiSpecPresent(manifest) {
  const specPath = path.join(repoRoot, manifest.openapiSpec);
  if (!fs.existsSync(specPath)) {
    throw new Error(`Missing OpenAPI spec at ${manifest.openapiSpec}`);
  }
  const spec = fs.readFileSync(specPath, 'utf8');
  for (const backendPath of manifest.goldenProxyPaths) {
    if (!spec.includes(`${backendPath}:`)) {
      throw new Error(`OpenAPI spec missing golden proxy path ${backendPath}`);
    }
  }
}

function assertReexportModule(manifest) {
  const reexport = readDashboard(manifest.reexportModule);
  if (!reexport.includes("./generated/openapi-v1")) {
    throw new Error(`${manifest.reexportModule} must import from generated OpenAPI types`);
  }
  for (const item of manifest.consumerTypeExports) {
    if (!reexport.includes(`export type ${item.exportName}`)) {
      throw new Error(`${manifest.reexportModule} must export ${item.exportName}`);
    }
  }
}

function assertGeneratedTypesFresh() {
  const manifest = loadManifest();
  const generatedPath = path.join(dashboardRoot, manifest.generatedTypesFile);
  if (!fs.existsSync(generatedPath)) {
    throw new Error(
      `Missing generated types at ${manifest.generatedTypesFile}. Run npm run openapi:codegen -w dashboard-product`,
    );
  }

  const redoclyConfig = path.join(repoRoot, '.redocly.yaml');
  const result = spawnSync(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['openapi-typescript', '--redocly', redoclyConfig, '--check'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );

  if (result.status !== 0) {
    throw new Error(
      `${manifest.generatedTypesFile} is stale. Run npm run openapi:codegen -w dashboard-product and commit the diff.`,
    );
  }
}

function assertGeneratedPathKeys(manifest) {
  const generated = readDashboard(manifest.generatedTypesFile);
  for (const backendPath of manifest.goldenProxyPaths) {
    const quoted = `"${backendPath}"`;
    if (!generated.includes(quoted)) {
      throw new Error(`generated types missing path key ${backendPath}`);
    }
  }
  for (const item of manifest.consumerTypeExports) {
    if (!generated.includes(`${item.schemaName}:`)) {
      throw new Error(`generated types missing schema ${item.schemaName}`);
    }
  }
}

function assertRoutesBaselinePinnedPaths(manifest) {
  const routesBaseline = JSON.parse(readDashboard('qa/automation-baselines/dashboard-api-routes.json'));
  const pinned = new Set(routesBaseline.openapiPinnedBackendPaths ?? []);
  for (const backendPath of manifest.goldenProxyPaths) {
    if (!pinned.has(backendPath)) {
      throw new Error(
        `golden proxy path ${backendPath} must appear in dashboard-api-routes openapiPinnedBackendPaths (refresh regression baseline after OpenAPI update)`,
      );
    }
  }
}

function assertPackageScripts() {
  const pkg = JSON.parse(readDashboard('package.json'));
  if (!pkg.scripts?.['openapi:codegen']) {
    throw new Error('package.json must define openapi:codegen script');
  }
  if (!pkg.scripts?.['openapi:codegen:assert']) {
    throw new Error('package.json must define openapi:codegen:assert script');
  }
  if (!pkg.devDependencies?.['openapi-typescript']) {
    throw new Error('package.json must include openapi-typescript devDependency');
  }
}

function main() {
  const manifest = loadManifest();
  assertManifestShape(manifest);
  assertOpenApiSpecPresent(manifest);
  assertReexportModule(manifest);
  assertPackageScripts();
  assertRoutesBaselinePinnedPaths(manifest);
  assertGeneratedPathKeys(manifest);
  assertGeneratedTypesFresh();
  console.log(
    `Dashboard OpenAPI codegen guard passed (${manifest.consumerTypeExports.length} consumer exports, ${manifest.goldenProxyPaths.length} golden proxy paths).`,
  );
}

main();
