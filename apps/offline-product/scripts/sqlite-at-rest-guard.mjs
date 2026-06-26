#!/usr/bin/env node
/**
 * Audit H18 — SQLite at-rest decision + secret storage wiring.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const offlineRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(offlineRoot, '../..');

function readFromRepo(relativePath) {
  const fullPath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing required file: ${relativePath}`);
  }
  return fs.readFileSync(fullPath, 'utf8');
}

function loadManifest() {
  try {
    return JSON.parse(readFromRepo('product-os/04-quality/offline-sqlite-at-rest.json'));
  } catch (error) {
    throw new Error(`Invalid offline-sqlite-at-rest.json: ${error.message}`);
  }
}

function assertManifestShape(manifest) {
  if (manifest.schemaVersion !== 1) {
    throw new Error('offline-sqlite-at-rest.json schemaVersion must be 1');
  }
  if (manifest.slice !== 'H18') {
    throw new Error('offline-sqlite-at-rest.json slice must be H18');
  }
  if (manifest.decision !== 'accept_os_sandbox_v1') {
    throw new Error('manifest decision must be accept_os_sandbox_v1');
  }
}

function assertDecisionDoc(manifest) {
  const doc = readFromRepo(manifest.decisionDoc);
  if (!doc.includes('Accept OS-sandboxed SQLite without SQLCipher')) {
    throw new Error(`${manifest.decisionDoc} must document v1.6 acceptance`);
  }
  if (!doc.includes('deferred')) {
    throw new Error(`${manifest.decisionDoc} must document SQLCipher deferral`);
  }
}

function assertCredentialWiring(manifest) {
  const syncAuth = readFromRepo(manifest.credentialModule);
  if (!syncAuth.includes('expo-secure-store')) {
    throw new Error(`${manifest.credentialModule} must use SecureStore for secrets`);
  }
  if (!syncAuth.includes(manifest.legacyMigrationExport)) {
    throw new Error(`${manifest.credentialModule} must export ${manifest.legacyMigrationExport}`);
  }
  if (syncAuth.includes('setSetting(LEGACY_SYNC_AUTH_PASSWORD_KEY')) {
    throw new Error('sync auth must not write legacy passwords back to SQLite settings');
  }
}

function assertPersistenceDbName(manifest) {
  const persistence = readFromRepo('apps/offline-product/features/state/persistence.native.ts');
  if (!persistence.includes(`'${manifest.databaseFile}'`)) {
    throw new Error(`persistence.native.ts must use database file ${manifest.databaseFile}`);
  }
}

function assertGuardRegistered(manifest) {
  const runner = readFromRepo('apps/offline-product/scripts/run-structural-guards.mjs');
  if (!runner.includes('sqlite-at-rest-guard.mjs')) {
    throw new Error('run-structural-guards.mjs must include sqlite-at-rest-guard.mjs');
  }
  const preflight = readFromRepo(manifest.securityPreflightScript);
  if (!preflight.includes(manifest.legacyMigrationExport)) {
    throw new Error(`${manifest.securityPreflightScript} must assert legacy sync auth migration`);
  }
}

function main() {
  const manifest = loadManifest();
  assertManifestShape(manifest);
  assertDecisionDoc(manifest);
  assertCredentialWiring(manifest);
  assertPersistenceDbName(manifest);
  assertGuardRegistered(manifest);
  console.log('sqlite-at-rest-guard: OK (H18).');
}

main();
