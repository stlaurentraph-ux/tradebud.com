#!/usr/bin/env node
/**
 * Build assets/maestro/tracebud_offline.db for Android Maestro CI (golden_path_minimal).
 * Run from assemble script — avoids host adb seeding on non-debuggable CI APKs.
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const schemaPath = path.join(root, 'scripts/maestro-android-boot-schema.sql');
const baselinePath = path.join(root, 'qa/automation-baselines/maestro-boot-state.json');
const outDir = path.join(root, 'assets/maestro');
const outPath = path.join(outDir, 'tracebud_offline.db');

function main() {
  const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
  const profileId = baseline.goldenPathBootProfile ?? 'golden_path_minimal';
  const profile = baseline.profiles?.[profileId];
  if (!profile?.settings) {
    throw new Error(`Missing settings for Maestro boot profile ${profileId}`);
  }
  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Missing boot schema SQL at ${schemaPath}`);
  }

  fs.mkdirSync(outDir, { recursive: true });
  if (fs.existsSync(outPath)) fs.unlinkSync(outPath);

  execSync(`sqlite3 ${JSON.stringify(outPath)} < ${JSON.stringify(schemaPath)}`, {
    stdio: 'inherit',
  });

  for (const [key, value] of Object.entries(profile.settings)) {
    const escaped = String(value).replace(/'/g, "''");
    execSync(
      `sqlite3 ${JSON.stringify(outPath)} ${JSON.stringify(
        `INSERT OR REPLACE INTO settings (key, value) VALUES ('${key}', '${escaped}');`,
      )}`,
      { stdio: 'inherit' },
    );
  }

  const tables = execSync(`sqlite3 ${JSON.stringify(outPath)} ".tables"`, { encoding: 'utf8' });
  if (!tables.includes('settings')) {
    throw new Error('Generated Maestro CI boot DB is missing settings table');
  }

  console.log(`generate-maestro-ci-boot-db: wrote ${outPath}`);
}

main();
