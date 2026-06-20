#!/usr/bin/env node
/**
 * Supabase ↔ backend SQL migration mirror drift guard (slice 1.D.2).
 * Validates the maintained map in supabase/migration-mirror-map.json against
 * on-disk migrations and requires every Supabase migration to be mapped.
 *
 * Run: npm run supabase:migration:mirror:assert
 * Refresh map after intentional adds: npm run supabase:migration:mirror:baseline:refresh
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const mapPath = path.join(repoRoot, 'supabase', 'migration-mirror-map.json');
const supabaseMigrationsDir = path.join(repoRoot, 'supabase', 'migrations');
const backendSqlDir = path.join(repoRoot, 'tracebud-backend', 'sql');

/** Slug aliases where filenames diverge but purpose matches. */
const SLUG_ALIASES = new Map([
  ['crm_farmer_profile_link', 'crm_contacts_farmer_profile'],
  ['phase2_table_comments_and_advisor_fixes', 'phase2_table_comments'],
]);

function supabaseSlug(filename) {
  const legacy = filename.match(/^\d{8}_\d{3}_(.+)\.sql$/);
  if (legacy) {
    return legacy[1];
  }
  const modern = filename.match(/^\d{12,14}_(.+)\.sql$/);
  return modern ? modern[1] : null;
}

function backendSlug(filename) {
  const match = filename.match(/^tb_v16_\d+z?_(.+)\.sql$/);
  return match ? match[1] : null;
}

function listSqlFiles(dir, predicate) {
  if (!fs.existsSync(dir)) {
    throw new Error(`Missing directory: ${dir}`);
  }
  return fs
    .readdirSync(dir)
    .filter((entry) => predicate(entry))
    .sort((a, b) => a.localeCompare(b));
}

function loadMap() {
  if (!fs.existsSync(mapPath)) {
    throw new Error(`Missing mirror map: ${mapPath}`);
  }
  return JSON.parse(fs.readFileSync(mapPath, 'utf8'));
}

function slugMatches(supabaseFile, backendFile) {
  const left = supabaseSlug(supabaseFile);
  const right = backendSlug(backendFile);
  if (!left || !right) {
    return false;
  }
  if (left === right) {
    return true;
  }
  return SLUG_ALIASES.get(left) === right || SLUG_ALIASES.get(right) === left;
}

function suggestPairs(supabaseFiles, backendFiles) {
  const backendBySlug = new Map();
  for (const file of backendFiles) {
    const slug = backendSlug(file);
    if (!slug) {
      continue;
    }
    if (!backendBySlug.has(slug)) {
      backendBySlug.set(slug, []);
    }
    backendBySlug.get(slug).push(file);
  }

  const pairs = [];
  const supabaseOnly = [];

  for (const file of supabaseFiles) {
    const slug = supabaseSlug(file);
    if (!slug) {
      continue;
    }
    const alias = SLUG_ALIASES.get(slug);
    const candidates = [
      ...(backendBySlug.get(slug) ?? []),
      ...(alias ? backendBySlug.get(alias) ?? [] : []),
    ];
    if (candidates.length === 1) {
      pairs.push({
        supabase: file,
        backend: candidates[0],
        purpose: slug,
      });
      continue;
    }
    supabaseOnly.push({
      file,
      reason: candidates.length > 1 ? 'ambiguous backend slug match' : 'no backend mirror',
    });
  }

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    pairs: pairs.sort((a, b) => a.supabase.localeCompare(b.supabase)),
    supabaseOnly: supabaseOnly.sort((a, b) => a.file.localeCompare(b.file)),
  };
}

function validateMap(map) {
  const errors = [];
  const pairs = map.pairs ?? [];
  const supabaseOnly = map.supabaseOnly ?? [];

  const supabaseFiles = listSqlFiles(
    supabaseMigrationsDir,
    (name) => name.endsWith('.sql'),
  );
  const backendFiles = listSqlFiles(
    backendSqlDir,
    (name) => /^tb_v16_\d/.test(name),
  );

  const mappedSupabase = new Set([
    ...pairs.map((entry) => entry.supabase),
    ...supabaseOnly.map((entry) => entry.file),
  ]);
  const mappedBackend = new Set(pairs.map((entry) => entry.backend));

  for (const file of supabaseFiles) {
    if (!mappedSupabase.has(file)) {
      errors.push(`Unmapped Supabase migration: ${file} (add pair or supabaseOnly entry)`);
    }
  }

  for (const file of [...mappedSupabase]) {
    if (!supabaseFiles.includes(file)) {
      errors.push(`Mirror map references missing Supabase migration: ${file}`);
    }
  }

  for (const entry of pairs) {
    const supabasePath = path.join(supabaseMigrationsDir, entry.supabase);
    const backendPath = path.join(backendSqlDir, entry.backend);

    if (!fs.existsSync(supabasePath)) {
      errors.push(`Missing Supabase migration for pair: ${entry.supabase}`);
    }
    if (!fs.existsSync(backendPath)) {
      errors.push(`Missing backend SQL mirror for pair: ${entry.backend}`);
    }
    if (entry.supabase && entry.backend && !slugMatches(entry.supabase, entry.backend)) {
      errors.push(
        `Pair slug mismatch: ${entry.supabase} ↔ ${entry.backend} (purpose: ${entry.purpose ?? 'unknown'})`,
      );
    }
  }

  for (const backendFile of mappedBackend) {
    if (!backendFiles.includes(backendFile)) {
      errors.push(`Mirror map references missing backend SQL file: ${backendFile}`);
    }
  }

  const duplicateSupabase = pairs.map((entry) => entry.supabase).filter((file, index, all) => all.indexOf(file) !== index);
  const duplicateBackend = pairs.map((entry) => entry.backend).filter((file, index, all) => all.indexOf(file) !== index);
  if (duplicateSupabase.length > 0) {
    errors.push(`Duplicate Supabase entries in pairs: ${[...new Set(duplicateSupabase)].join(', ')}`);
  }
  if (duplicateBackend.length > 0) {
    errors.push(`Duplicate backend entries in pairs: ${[...new Set(duplicateBackend)].join(', ')}`);
  }

  return { errors, supabaseFiles, backendFiles, pairCount: pairs.length, supabaseOnlyCount: supabaseOnly.length };
}

function main() {
  const writeBaseline = process.argv.includes('--write-baseline');

  if (writeBaseline) {
    const supabaseFiles = listSqlFiles(
      supabaseMigrationsDir,
      (name) => name.endsWith('.sql'),
    );
    const backendFiles = listSqlFiles(
      backendSqlDir,
      (name) => /^tb_v16_\d/.test(name),
    );
    const draft = suggestPairs(supabaseFiles, backendFiles);
    fs.writeFileSync(mapPath, `${JSON.stringify(draft, null, 2)}\n`);
    console.log(
      `Wrote migration mirror map (${draft.pairs.length} pairs, ${draft.supabaseOnly.length} supabase-only) → supabase/migration-mirror-map.json`,
    );
    console.log('Review slug aliases and supabaseOnly reasons before committing.');
    return;
  }

  const map = loadMap();
  const { errors, pairCount, supabaseOnlyCount, supabaseFiles } = validateMap(map);

  if (errors.length > 0) {
    console.error('Supabase migration mirror drift guard failed:\n');
    for (const error of errors) {
      console.error(`  - ${error}`);
    }
    process.exit(1);
  }

  console.log(
    `Supabase migration mirror drift guard passed (${pairCount} pairs, ${supabaseOnlyCount} supabase-only, ${supabaseFiles.length} Supabase migrations).`,
  );
}

main();
