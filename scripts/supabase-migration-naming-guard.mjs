#!/usr/bin/env node
/**
 * Supabase migration naming/order guard (slice 1.D.1).
 * Enforces supabase/README.md rules: allowed filename shapes, unique timestamp
 * prefixes (with documented historical exceptions), and lexicographic apply order.
 *
 * Run: npm run supabase:migration:naming:assert
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const migrationsDir = path.join(repoRoot, 'supabase', 'migrations');

/** Applied on Tracebud CRM 2026-06-20 — unique full filenames, shared date prefix. */
const ALLOWED_DUPLICATE_PREFIXES = new Map([
  [
    '202606200004',
    new Set([
      '202606200004_plot_duplicate_prevention.sql',
      '202606200004_plot_status_rename_compliant_to_deforestation_clear.sql',
    ]),
  ],
]);

const LEGACY_FOUNDER_PATTERN = /^(\d{8})_(\d{3})_([a-z0-9][a-z0-9_]*)\.sql$/;
const TIMESTAMP_SLUG_PATTERN = /^(\d{12,14})_([a-z0-9][a-z0-9_]*)\.sql$/;

function parseMigrationFilename(filename) {
  const legacy = filename.match(LEGACY_FOUNDER_PATTERN);
  if (legacy) {
    return {
      filename,
      prefix: `${legacy[1]}_${legacy[2]}`,
      slug: legacy[3],
      style: 'legacy-founder',
    };
  }

  const modern = filename.match(TIMESTAMP_SLUG_PATTERN);
  if (modern) {
    return {
      filename,
      prefix: modern[1],
      slug: modern[2],
      style: 'timestamp-slug',
    };
  }

  return null;
}

function listMigrationFiles() {
  if (!fs.existsSync(migrationsDir)) {
    throw new Error(`Missing migrations directory: ${migrationsDir}`);
  }

  const entries = fs.readdirSync(migrationsDir, { withFileTypes: true });
  const errors = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      errors.push(`Unexpected subdirectory in migrations/: ${entry.name}`);
    } else if (!entry.name.endsWith('.sql')) {
      errors.push(`Non-SQL file in migrations/: ${entry.name}`);
    }
  }

  if (errors.length > 0) {
    return { errors, files: [] };
  }

  return {
    errors,
    files: entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.sql'))
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b)),
  };
}

function validateMigrations(filenames) {
  const errors = [];
  const parsed = [];
  const prefixToFiles = new Map();

  for (const filename of filenames) {
    const filePath = path.join(migrationsDir, filename);
    const stat = fs.statSync(filePath);
    if (stat.size === 0) {
      errors.push(`${filename}: migration file is empty`);
    }

    const info = parseMigrationFilename(filename);
    if (!info) {
      errors.push(
        `${filename}: invalid migration filename (expected YYYYMMDDNNNN_slug.sql or YYYYMMDD_NNN_slug.sql)`,
      );
      continue;
    }

    parsed.push(info);
    const group = prefixToFiles.get(info.prefix) ?? new Set();
    group.add(filename);
    prefixToFiles.set(info.prefix, group);
  }

  for (const [prefix, files] of prefixToFiles) {
    if (files.size <= 1) {
      continue;
    }

    const allowed = ALLOWED_DUPLICATE_PREFIXES.get(prefix);
    if (allowed && files.size === allowed.size && [...files].every((file) => allowed.has(file))) {
      continue;
    }

    errors.push(
      `Duplicate migration timestamp prefix "${prefix}": ${[...files].sort().join(', ')}`,
    );
  }

  const sorted = [...filenames].sort((a, b) => a.localeCompare(b));
  if (sorted.join('\n') !== filenames.join('\n')) {
    errors.push(
      'Migration filenames are not listed in lexicographic apply order in guard scan (unexpected sort drift)',
    );
  }

  return { errors, parsed, sorted };
}

function main() {
  const { errors: listErrors, files } = listMigrationFiles();
  const { errors: validateErrors, parsed, sorted } = validateMigrations(files);
  const errors = [...listErrors, ...validateErrors];

  if (errors.length > 0) {
    console.error('Supabase migration naming guard failed:\n');
    for (const error of errors) {
      console.error(`  - ${error}`);
    }
    process.exit(1);
  }

  console.log(
    `Supabase migration naming guard passed (${parsed.length} migrations; lex order ${sorted[0]} → ${sorted[sorted.length - 1]}).`,
  );
}

main();
