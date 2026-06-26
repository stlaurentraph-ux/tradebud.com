#!/usr/bin/env node
/**
 * Guardrail H24 — production release preflight wired in CI with strict secrets.
 *
 * Run: npm run release:preflight:assert
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const offlineRoot = path.join(repoRoot, 'apps/offline-product');

function readRepo(relativePath) {
  const fullPath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing required file: ${relativePath}`);
  }
  return fs.readFileSync(fullPath, 'utf8');
}

function loadManifest() {
  try {
    return JSON.parse(readRepo('product-os/04-quality/eas-production-env.json'));
  } catch (error) {
    throw new Error(`Invalid eas-production-env.json: ${error.message}`);
  }
}

function assertManifestShape(manifest) {
  if (manifest.schemaVersion !== 1) {
    throw new Error('eas-production-env.json schemaVersion must be 1');
  }
  if (manifest.slice !== 'H24') {
    throw new Error('eas-production-env.json slice must be H24');
  }
  if (!Array.isArray(manifest.requiredEnvKeys) || manifest.requiredEnvKeys.length < 4) {
    throw new Error('manifest must define requiredEnvKeys');
  }
  if (!manifest.ciEnv?.strictFlag || manifest.ciEnv.strictValue !== '1') {
    throw new Error('manifest must define ciEnv strict flag');
  }
}

function assertEasJson(manifest) {
  const eas = JSON.parse(readRepo('apps/offline-product/eas.json'));
  const profile = eas?.build?.[manifest.easBuildProfile];
  if (!profile) {
    throw new Error(`eas.json missing build profile ${manifest.easBuildProfile}`);
  }
  if (profile.environment !== manifest.easEnvironment) {
    throw new Error(
      `eas.json ${manifest.easBuildProfile} must set environment "${manifest.easEnvironment}"`,
    );
  }
}

function assertPreflightScript(manifest) {
  const script = readRepo(manifest.preflightScript);
  if (!script.includes('eas-production-env.json')) {
    throw new Error(`${manifest.preflightScript} must load eas-production-env.json`);
  }
  if (!script.includes('RELEASE_PREFLIGHT_STRICT')) {
    throw new Error(`${manifest.preflightScript} must support RELEASE_PREFLIGHT_STRICT`);
  }
  if (!script.includes('EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID')) {
    throw new Error(`${manifest.preflightScript} must validate Google OAuth client ids`);
  }
}

function assertCiWorkflow(manifest) {
  const workflow = readRepo(manifest.ciWorkflowFile);
  if (!workflow.includes('release:preflight:production')) {
    throw new Error(`${manifest.ciWorkflowFile} must run release:preflight:production`);
  }
  if (!workflow.includes(manifest.ciEnv.strictFlag)) {
    throw new Error(`${manifest.ciWorkflowFile} must set ${manifest.ciEnv.strictFlag}=1 for release preflight`);
  }
  for (const [envKey, secretName] of Object.entries(manifest.ciSecretMapping ?? {})) {
    if (!workflow.includes(envKey)) {
      throw new Error(`${manifest.ciWorkflowFile} must pass ${envKey} to release preflight step`);
    }
    if (!workflow.includes(`secrets.${secretName}`)) {
      throw new Error(`${manifest.ciWorkflowFile} must map ${envKey} from secrets.${secretName}`);
    }
  }
}

function assertPackageScripts() {
  const pkg = JSON.parse(readRepo('apps/offline-product/package.json'));
  if (!pkg.scripts?.['release:preflight:production']) {
    throw new Error('package.json must define release:preflight:production');
  }
  if (!pkg.scripts?.['release:preflight:assert']) {
    throw new Error('package.json must define release:preflight:assert');
  }
}

function main() {
  const manifest = loadManifest();
  assertManifestShape(manifest);
  assertEasJson(manifest);
  assertPreflightScript(manifest);
  assertCiWorkflow(manifest);
  assertPackageScripts();
  console.log('Release preflight guard passed (H24).');
}

main();
