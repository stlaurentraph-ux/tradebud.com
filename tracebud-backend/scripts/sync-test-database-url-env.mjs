#!/usr/bin/env node
/**
 * Copies TEST_DATABASE_URL from repo root .env.local into tracebud-backend/.env.local
 * when missing (keeps prod DATABASE_URL untouched).
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadEnvFile, validateDatabaseEnvSplit } from './db-url-from-env.mjs';

const backendRoot = process.cwd();
const repoRoot = resolve(backendRoot, '..');
const rootEnvPath = resolve(repoRoot, '.env.local');
const backendEnvLocalPath = resolve(backendRoot, '.env.local');

const rootEnv = loadEnvFile(rootEnvPath);
const backendEnv = loadEnvFile(backendEnvLocalPath);
const testUrl = rootEnv.TEST_DATABASE_URL?.trim();

if (!testUrl) {
  console.error('TEST_DATABASE_URL missing in repo root .env.local');
  process.exit(1);
}

let backendContents = existsSync(backendEnvLocalPath)
  ? readFileSync(backendEnvLocalPath, 'utf8')
  : '';

if (backendEnv.TEST_DATABASE_URL?.trim() === testUrl) {
  console.log('tracebud-backend/.env.local already has matching TEST_DATABASE_URL');
} else if (/^TEST_DATABASE_URL=/m.test(backendContents)) {
  backendContents = backendContents.replace(/^TEST_DATABASE_URL=.*$/m, `TEST_DATABASE_URL=${testUrl}`);
  writeFileSync(backendEnvLocalPath, backendContents, 'utf8');
  console.log('Updated TEST_DATABASE_URL in tracebud-backend/.env.local');
} else {
  const block = `\n# Supabase Test project — integration tests only (npm run test:integration)\nTEST_DATABASE_URL=${testUrl}\n`;
  writeFileSync(backendEnvLocalPath, backendContents.replace(/\s*$/, '') + block, 'utf8');
  console.log('Added TEST_DATABASE_URL to tracebud-backend/.env.local');
}

const { issues } = validateDatabaseEnvSplit();
if (issues.length > 0) {
  console.error('Split validation failed:');
  for (const issue of issues) {
    console.error(`  - ${issue}`);
  }
  process.exit(1);
}

console.log('Prod vs test database split validated OK');
