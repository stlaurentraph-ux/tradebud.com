#!/usr/bin/env node
/**
 * Prevents prod/test DATABASE_URL regressions in scripts and npm db:* tasks.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const scriptsDir = path.join(root, 'scripts');

const ALLOW_TEST_FALLBACK = new Set([
  'run-with-root-test-db.mjs',
  'sync-test-database-url-env.mjs',
  'check-db-connection-hygiene.mjs',
  'db-url-from-env.mjs',
  'db-url-from-env.test.mjs',
  'supabase-db-refs.mjs',
  'backend-db-url-split-guard.mjs',
]);

const TEST_FALLBACK_RE =
  /process\.env\.(?:[A-Z0-9_]+_DATABASE_URL|DATABASE_URL)[\s\S]{0,80}process\.env\.TEST_DATABASE_URL|process\.env\.TEST_DATABASE_URL[\s\S]{0,80}process\.env\.DATABASE_URL/;

function main() {
  const issues = [];

  for (const name of fs.readdirSync(scriptsDir)) {
    if (!name.endsWith('.mjs') || ALLOW_TEST_FALLBACK.has(name)) continue;
    const source = fs.readFileSync(path.join(scriptsDir, name), 'utf8');
    if (TEST_FALLBACK_RE.test(source)) {
      issues.push(`${name}: must not fall back between DATABASE_URL and TEST_DATABASE_URL`);
    }
  }

  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  for (const [scriptName, command] of Object.entries(pkg.scripts ?? {})) {
    if (!scriptName.startsWith('db:')) continue;
    if (typeof command !== 'string') continue;
    if (command.includes('run-with-root-test-db.mjs')) {
      issues.push(`package.json script "${scriptName}" must not wrap prod db tasks with run-with-root-test-db`);
    }
  }

  if (issues.length > 0) {
    console.error('backend-db-url-split-guard failed:\n');
    for (const issue of issues) {
      console.error(`  - ${issue}`);
    }
    process.exit(1);
  }

  console.log('backend-db-url-split-guard: OK');
}

main();
