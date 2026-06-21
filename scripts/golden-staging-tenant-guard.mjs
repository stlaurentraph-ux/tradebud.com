#!/usr/bin/env node
/**
 * Guardrail 2.7 — golden staging tenant manifest vs backend constants + smoke scripts.
 *
 * Run: npm run golden:staging:assert
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const constantsPath = path.join(
  repoRoot,
  'tracebud-backend/src/testing/golden-staging-tenant.constants.ts',
);
const runbookPath = path.join(repoRoot, 'product-os/04-quality/golden-staging-tenant.md');
const inboxServicePath = path.join(repoRoot, 'tracebud-backend/src/inbox/inbox.service.ts');
const smokeScriptPath = path.join(
  repoRoot,
  'apps/dashboard-product/scripts/launch-onboarding-proxy-smoke.mjs',
);
const bootstrapScriptPath = path.join(
  repoRoot,
  'apps/dashboard-product/scripts/golden-staging-bootstrap.mjs',
);
const ciSecretsPath = path.join(repoRoot, 'product-os/04-quality/ci-secrets-and-fixtures.md');

function readRepo(relativePath) {
  const fullPath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing required file: ${relativePath}`);
  }
  return fs.readFileSync(fullPath, 'utf8');
}

function loadManifest() {
  let manifest;
  try {
    manifest = JSON.parse(readRepo('product-os/04-quality/golden-staging-tenant.json'));
  } catch (error) {
    throw new Error(`Invalid golden-staging-tenant.json: ${error.message}`);
  }
  return manifest;
}

function assertManifestShape(manifest) {
  if (manifest.schemaVersion !== 1) {
    throw new Error('golden-staging-tenant.json schemaVersion must be 1');
  }
  if (manifest.slice !== '2.7') {
    throw new Error('golden-staging-tenant.json slice must be 2.7');
  }
  if (manifest.bootstrapAction !== 'seed_golden_path') {
    throw new Error('manifest bootstrapAction must be seed_golden_path');
  }
  if (!Array.isArray(manifest.goldenInboxRequests) || manifest.goldenInboxRequests.length !== 2) {
    throw new Error('manifest must define exactly two goldenInboxRequests');
  }
  if (!manifest.smoke?.role || !manifest.smoke?.onboardingStepKey) {
    throw new Error('manifest smoke.role and smoke.onboardingStepKey are required');
  }
}

function assertConstantsAlignment(manifest) {
  const constants = fs.readFileSync(constantsPath, 'utf8');
  const requiredStrings = [
    manifest.recipientTenantId,
    manifest.senderTenantId,
    manifest.bootstrapAction,
    manifest.smoke.role,
    manifest.smoke.onboardingStepKey,
    manifest.smoke.demoExporterEmail,
    ...manifest.goldenInboxRequests.map((item) => item.id),
    ...manifest.goldenInboxRequests.map((item) => item.campaignId),
  ];
  for (const value of requiredStrings) {
    if (!constants.includes(value)) {
      throw new Error(`golden-staging-tenant.constants.ts missing "${value}"`);
    }
  }
  if (!constants.includes('GOLDEN_STAGING_TENANT')) {
    throw new Error('constants file must export GOLDEN_STAGING_TENANT');
  }
}

function assertInboxServiceUsesConstants() {
  const inbox = fs.readFileSync(inboxServicePath, 'utf8');
  if (!inbox.includes("from '../testing/golden-staging-tenant.constants'")) {
    throw new Error('inbox.service.ts must import golden-staging-tenant.constants');
  }
  if (!inbox.includes('GOLDEN_STAGING_TENANT')) {
    throw new Error('goldenPathRequests must reference GOLDEN_STAGING_TENANT');
  }
  if (!inbox.includes('recipientTenantId') || !inbox.includes('senderTenantId')) {
    throw new Error('goldenPathRequests must bind recipientTenantId and senderTenantId from constants');
  }
  if (!inbox.includes('goldenInboxRequestIds') || !inbox.includes('goldenCampaignIds')) {
    throw new Error('goldenPathRequests must use goldenInboxRequestIds and goldenCampaignIds');
  }
}

function assertSmokeScriptDefaults(manifest) {
  const smoke = fs.readFileSync(smokeScriptPath, 'utf8');
  const roleDefault = `?? '${manifest.smoke.role}'`;
  const stepDefault = `?? '${manifest.smoke.onboardingStepKey}'`;
  if (!smoke.includes(roleDefault)) {
    throw new Error(
      `launch-onboarding-proxy-smoke default role must be ${manifest.smoke.role}`,
    );
  }
  if (!smoke.includes(stepDefault)) {
    throw new Error(
      `launch-onboarding-proxy-smoke default step must be ${manifest.smoke.onboardingStepKey}`,
    );
  }
}

function assertRunbookAndSecrets(manifest) {
  const runbook = fs.readFileSync(runbookPath, 'utf8');
  if (!runbook.includes(manifest.recipientTenantId)) {
    throw new Error('runbook must document recipientTenantId');
  }
  if (!runbook.includes('seed_golden_path')) {
    throw new Error('runbook must document seed_golden_path bootstrap');
  }
  if (!runbook.includes('TRACEBUD_SMOKE_BEARER_TOKEN')) {
    throw new Error('runbook must reference TRACEBUD_SMOKE_BEARER_TOKEN');
  }

  const ciSecrets = fs.readFileSync(ciSecretsPath, 'utf8');
  if (ciSecrets.includes('not yet documented')) {
    throw new Error('ci-secrets-and-fixtures.md still marks golden staging as undocumented');
  }
  if (!ciSecrets.includes(manifest.recipientTenantId)) {
    throw new Error('ci-secrets must document recipient tenant id');
  }
}

function assertBootstrapScript(manifest) {
  if (!fs.existsSync(bootstrapScriptPath)) {
    throw new Error('Missing golden-staging-bootstrap.mjs helper script');
  }
  const bootstrap = fs.readFileSync(bootstrapScriptPath, 'utf8');
  if (!bootstrap.includes(manifest.bootstrapAction)) {
    throw new Error('bootstrap script must POST seed_golden_path action');
  }
  if (!bootstrap.includes('/api/inbox-requests/bootstrap')) {
    throw new Error('bootstrap script must call dashboard proxy route');
  }
}

function main() {
  const manifest = loadManifest();
  assertManifestShape(manifest);
  assertConstantsAlignment(manifest);
  assertInboxServiceUsesConstants();
  assertSmokeScriptDefaults(manifest);
  assertRunbookAndSecrets(manifest);
  assertBootstrapScript(manifest);
  console.log(
    `Golden staging tenant guard passed (${manifest.recipientTenantId}, ${manifest.goldenInboxRequests.length} inbox fixtures).`,
  );
}

main();
