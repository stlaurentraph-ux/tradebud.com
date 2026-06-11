#!/usr/bin/env node
/**
 * Push GFW_* variables from local env into the linked Railway service.
 * Requires: npx @railway/cli login && railway link (in tracebud-backend).
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const backendRoot = path.resolve(import.meta.dirname, '..');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx <= 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(path.join(backendRoot, '.env'));
loadEnvFile(path.join(backendRoot, '.env.local'));

const gfwKeys = [
  'GFW_API_KEY',
  'GFW_BASE_URL',
  'GFW_DATASET',
  'GFW_VERSION',
  'GFW_RADD_DATASET',
  'GFW_DEFORESTATION_SQL_TEMPLATE',
  'GFW_FALLBACK_DEFORESTATION_SQL_TEMPLATE',
];

const toSet = gfwKeys.filter((key) => process.env[key]?.trim());

if (!process.env.GFW_API_KEY?.trim()) {
  console.error('FAIL GFW_API_KEY missing locally. Set tracebud-backend/.env first.');
  process.exit(1);
}

const whoami = spawnSync('npx', ['--yes', '@railway/cli', 'whoami'], {
  cwd: backendRoot,
  encoding: 'utf8',
});

if (whoami.status !== 0) {
  console.error('Railway CLI is not logged in.\n');
  console.error('Run:');
  console.error('  cd tracebud-backend');
  console.error('  npx @railway/cli login');
  console.error('  npx @railway/cli link -p dynamic-perception -s tradebud.com');
  console.error('  npm run railway:sync:gfw');
  console.error('\nOr paste these keys manually in Railway → Variables:\n');
  for (const key of toSet) {
    console.error(`  ${key}=<from tracebud-backend/.env>`);
  }
  process.exit(1);
}

console.log(`Syncing ${toSet.length} GFW variable(s) to Railway…\n`);

for (const key of toSet) {
  const value = process.env[key].trim();
  const result = spawnSync('npx', ['--yes', '@railway/cli', 'variables', 'set', `${key}=${value}`], {
    cwd: backendRoot,
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    console.error(`FAIL setting ${key}`);
    console.error(result.stderr || result.stdout);
    process.exit(1);
  }
  console.log(`[OK] ${key}`);
}

console.log('\nDone. Redeploy the Railway service if it was already running.');
