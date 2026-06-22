#!/usr/bin/env node
/**
 * Guardrail 4.O.2 — field tenant isolation smoke wiring vs manifest + CI.
 *
 * Run: npm run qa:tenant-isolation:assert
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const manifestPath = path.join(repoRoot, 'product-os/04-quality/golden-field-tenant-smoke.json');
const constantsPath = path.join(
  repoRoot,
  'tracebud-backend/src/testing/golden-field-tenant-smoke.constants.ts',
);
const smokePath = path.join(repoRoot, 'apps/offline-product/scripts/field-tenant-isolation-smoke.mjs');
const ciPath = path.join(repoRoot, '.github/workflows/ci.yml');
const ciSecretsPath = path.join(repoRoot, 'product-os/04-quality/ci-secrets-and-fixtures.md');
const runbookPath = path.join(repoRoot, 'product-os/04-quality/golden-field-tenant-smoke.md');
const offlinePkgPath = path.join(repoRoot, 'apps/offline-product/package.json');

function read(fullPath) {
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing required file: ${fullPath}`);
  }
  return fs.readFileSync(fullPath, 'utf8');
}

function loadManifest() {
  try {
    return JSON.parse(read(manifestPath));
  } catch (error) {
    throw new Error(`Invalid golden-field-tenant-smoke.json: ${error.message}`);
  }
}

function assertManifestShape(manifest) {
  if (manifest.schemaVersion !== 1) {
    throw new Error('schemaVersion must be 1');
  }
  if (manifest.slice !== '4.O.2') {
    throw new Error('slice must be 4.O.2');
  }
  if (!Array.isArray(manifest.probes) || manifest.probes.length < 2) {
    throw new Error('manifest must define at least two probes');
  }
  if (!manifest.ciEnv?.strictFlag || manifest.ciEnv.strictValue !== '1') {
    throw new Error('manifest must define ciEnv strict flag');
  }
}

function assertConstantsAlignment(manifest) {
  const constants = read(constantsPath);
  const required = [
    manifest.farmerA.recommendedEmail,
    manifest.farmerB.recommendedEmail,
    manifest.farmerA.label,
    manifest.farmerB.label,
    String(manifest.probes[0].expectStatus),
  ];
  for (const value of required) {
    if (!constants.includes(value)) {
      throw new Error(`golden-field-tenant-smoke.constants.ts missing "${value}"`);
    }
  }
  if (!constants.includes('GOLDEN_FIELD_TENANT_SMOKE')) {
    throw new Error('constants must export GOLDEN_FIELD_TENANT_SMOKE');
  }
}

function assertSmokeScript(manifest) {
  const smoke = read(smokePath);
  if (!smoke.includes('FIELD_TENANT_SMOKE_STRICT')) {
    throw new Error('smoke script must honor FIELD_TENANT_SMOKE_STRICT');
  }
  if (!smoke.includes('--strict')) {
    throw new Error('smoke script must support --strict flag');
  }
  if (!smoke.includes('golden-field-tenant-smoke.json')) {
    throw new Error('smoke script must load golden-field-tenant-smoke.json');
  }
  if (!smoke.includes('foreign_farmer_list') || !smoke.includes('listProbe.expectStatus')) {
    throw new Error('smoke script must assert foreign_farmer_list via manifest expectStatus');
  }
}

function assertCiWiring(manifest) {
  const ci = read(ciPath);
  if (!ci.includes('qa:tenant-isolation:assert')) {
    throw new Error('ci.yml app job must run qa:tenant-isolation:assert');
  }
  if (!ci.includes('qa:tenant-isolation')) {
    throw new Error('ci.yml app job must run qa:tenant-isolation smoke');
  }
  // Accept literal "1" or a conditional expression that evaluates to '1' when secrets are
  // present and '0' when absent (Dependabot-safe form: ${{ secret != '' && '1' || '0' }}).
  const strictFlag = manifest.ciEnv.strictFlag;
  const hasLiteralStrict =
    ci.includes(`${strictFlag}: 1`) ||
    ci.includes(`${strictFlag}: '1'`) ||
    ci.includes(`${strictFlag}: "1"`);
  const hasConditionalStrict = ci
    .split('\n')
    .filter((line) => line.includes(`${strictFlag}:`))
    .some((line) => line.includes(`\${{`) && line.includes(`&& '1' ||`));
  if (!hasLiteralStrict && !hasConditionalStrict) {
    throw new Error(`ci.yml must set ${strictFlag}=1 on tenant isolation step`);
  }
  if (ci.includes('Tenant isolation smoke (optional)')) {
    throw new Error('ci.yml must not label tenant isolation as optional');
  }
  for (const secret of manifest.githubSecretsRequired) {
    if (!ci.includes(`secrets.${secret}`)) {
      throw new Error(`ci.yml tenant isolation step must pass secret ${secret}`);
    }
  }
}

function assertPackageAndDocs(manifest) {
  const pkg = JSON.parse(read(offlinePkgPath));
  if (!pkg.scripts?.['qa:tenant-isolation:assert']) {
    throw new Error('package.json must define qa:tenant-isolation:assert');
  }

  const runbook = read(runbookPath);
  if (!runbook.includes(manifest.farmerA.recommendedEmail)) {
    throw new Error('runbook must document farmer A recommended email');
  }
  if (!runbook.includes(manifest.farmerB.recommendedEmail)) {
    throw new Error('runbook must document farmer B recommended email');
  }

  const ciSecrets = read(ciSecretsPath);
  for (const secret of manifest.githubSecretsRequired) {
    if (!ciSecrets.includes(secret)) {
      throw new Error(`ci-secrets-and-fixtures.md must document ${secret}`);
    }
  }
}

function main() {
  const manifest = loadManifest();
  assertManifestShape(manifest);
  assertConstantsAlignment(manifest);
  assertSmokeScript(manifest);
  assertCiWiring(manifest);
  assertPackageAndDocs(manifest);
  console.log(
    `Field tenant isolation guard passed (slice ${manifest.slice}, ${manifest.probes.length} probes).`,
  );
}

main();
