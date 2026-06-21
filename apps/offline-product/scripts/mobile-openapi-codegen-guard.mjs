#!/usr/bin/env node
/**
 * Guardrail 4.2 — offline mobile OpenAPI codegen manifest, generated types freshness, and re-exports.
 *
 * Run: npm run openapi:codegen:assert
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const offlineRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.join(offlineRoot, '../..');

function readOffline(relativePath) {
  const fullPath = path.join(offlineRoot, relativePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing required file: ${relativePath}`);
  }
  return fs.readFileSync(fullPath, 'utf8');
}

function loadManifest() {
  try {
    return JSON.parse(readOffline('qa/automation-baselines/mobile-openapi-codegen.json'));
  } catch (error) {
    throw new Error(`Invalid mobile-openapi-codegen.json: ${error.message}`);
  }
}

function openApiTemplate(pathname) {
  return pathname.replace(/\{[^}]+\}/g, '{id}');
}

function assertManifestShape(manifest) {
  if (manifest.schemaVersion !== 1) {
    throw new Error('manifest schemaVersion must be 1');
  }
  if (manifest.slice !== '4.2') {
    throw new Error('manifest slice must be 4.2');
  }
  if (!manifest.openapiSpec || !manifest.generatedTypesFile || !manifest.reexportModule) {
    throw new Error('manifest must define openapiSpec, generatedTypesFile, and reexportModule');
  }
  if (!manifest.mobileParityBaseline) {
    throw new Error('manifest must define mobileParityBaseline');
  }
  if (!Array.isArray(manifest.goldenMobilePaths) || manifest.goldenMobilePaths.length < 5) {
    throw new Error('manifest must define goldenMobilePaths for core field sync coverage');
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
  for (const mobilePath of manifest.goldenMobilePaths) {
    if (!spec.includes(`${mobilePath}:`)) {
      throw new Error(`OpenAPI spec missing golden mobile path ${mobilePath}`);
    }
  }
}

function assertMobileParityBaseline(manifest) {
  const parity = JSON.parse(readOffline(manifest.mobileParityBaseline));
  const mobileTemplates = new Set((parity.mobilePaths ?? []).map(openApiTemplate));
  const missingInOpenApi = new Set((parity.missingInOpenApi ?? []).map(openApiTemplate));

  for (const mobilePath of manifest.goldenMobilePaths) {
    const template = openApiTemplate(mobilePath);
    if (!mobileTemplates.has(template)) {
      throw new Error(`golden mobile path ${mobilePath} must appear in mobile-api-openapi-parity baseline`);
    }
    if (missingInOpenApi.has(template)) {
      throw new Error(`golden mobile path ${mobilePath} is listed as missing in OpenAPI parity baseline`);
    }
  }
}

function assertReexportModule(manifest) {
  const reexport = readOffline(manifest.reexportModule);
  if (!reexport.includes('./generated/openapi-v1')) {
    throw new Error(`${manifest.reexportModule} must import from generated OpenAPI types`);
  }
  for (const item of manifest.consumerTypeExports) {
    if (!reexport.includes(`export type ${item.exportName}`)) {
      throw new Error(`${manifest.reexportModule} must export ${item.exportName}`);
    }
  }
}

function assertGeneratedTypesFresh(manifest) {
  const generatedPath = path.join(offlineRoot, manifest.generatedTypesFile);
  if (!fs.existsSync(generatedPath)) {
    throw new Error(
      `Missing generated types at ${manifest.generatedTypesFile}. Run npm run openapi:codegen`,
    );
  }

  const redoclyConfig = path.join(repoRoot, '.redocly.yaml');
  const result = spawnSync(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['openapi-typescript', 'tracebud-offline', '--redocly', redoclyConfig, '--check'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );

  if (result.status !== 0) {
    throw new Error(
      `${manifest.generatedTypesFile} is stale. Run npm run openapi:codegen and commit the diff.`,
    );
  }
}

function assertGeneratedPathKeys(manifest) {
  const generated = readOffline(manifest.generatedTypesFile);
  for (const mobilePath of manifest.goldenMobilePaths) {
    const quoted = `"${mobilePath}"`;
    if (!generated.includes(quoted)) {
      throw new Error(`generated types missing path key ${mobilePath}`);
    }
  }
  for (const item of manifest.consumerTypeExports) {
    if (!generated.includes(`${item.schemaName}:`)) {
      throw new Error(`generated types missing schema ${item.schemaName}`);
    }
  }
}

function assertPackageScripts() {
  const pkg = JSON.parse(readOffline('package.json'));
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
  assertMobileParityBaseline(manifest);
  assertReexportModule(manifest);
  assertPackageScripts();
  assertGeneratedPathKeys(manifest);
  assertGeneratedTypesFresh(manifest);
  console.log(
    `Offline OpenAPI codegen guard passed (${manifest.consumerTypeExports.length} consumer exports, ${manifest.goldenMobilePaths.length} golden mobile paths).`,
  );
}

main();
