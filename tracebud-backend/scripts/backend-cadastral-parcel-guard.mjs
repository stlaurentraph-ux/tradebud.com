#!/usr/bin/env node
/**
 * Ensures cadastral demo fixtures, registry, Sentry tags, and product-os doc stay aligned.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from './backend-guard-lib.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(root, '..');

function main() {
  const issues = [];
  const registrySource = readFile(root, 'src/plots/backendCadastralParcelRegistry.ts');
  const fixturesSource = readFile(root, 'src/plots/cadastral-parcel-fixtures.ts');
  const serviceSource = readFile(root, 'src/plots/cadastral-parcel-lookup.service.ts');
  const mdPath = path.join(repoRoot, 'product-os/04-quality/cadastral-parcel-registry.md');

  const demoMatch = registrySource.match(
    /export const BACKEND_CADASTRAL_PARCEL_DEMO_KEYS = \{([\s\S]*?)\} as const/,
  );
  if (!demoMatch) {
    issues.push('backendCadastralParcelRegistry missing BACKEND_CADASTRAL_PARCEL_DEMO_KEYS');
  } else {
    for (const key of ['HN', 'GT']) {
      if (!demoMatch[1].includes(`${key}:`)) {
        issues.push(`demo keys missing ${key}`);
      }
    }
  }

  if (!serviceSource.includes('BACKEND_CADASTRAL_PARCEL_LOOKUP_SENTRY_TAGS')) {
    issues.push('lookup service must import BACKEND_CADASTRAL_PARCEL_LOOKUP_SENTRY_TAGS');
  }
  for (const tag of ['cadastral.lookup.miss', 'cadastral.lookup.invalid_key', 'cadastral.lookup.unsupported_country']) {
    if (!registrySource.includes(tag)) {
      issues.push(`registry missing Sentry tag ${tag}`);
    }
  }

  if (!serviceSource.includes('cadastral_parcel_lookup_miss')) {
    issues.push('lookup service must emit cadastral_parcel_lookup_miss message');
  }

  if (!fixturesSource.includes('CADASTRAL_PARCEL_FIXTURES')) {
    issues.push('cadastral-parcel-fixtures missing CADASTRAL_PARCEL_FIXTURES export');
  }

  if (!fs.existsSync(mdPath)) {
    issues.push('missing product-os/04-quality/cadastral-parcel-registry.md');
  } else {
    const md = fs.readFileSync(mdPath, 'utf8');
    if (!md.includes('BACKEND_CADASTRAL_PARCEL_DEMO_KEYS')) {
      issues.push('cadastral-parcel-registry.md must document demo keys');
    }
  }

  if (issues.length === 0) {
    console.log('backend-cadastral-parcel-guard: OK');
    process.exit(0);
  }

  console.error('backend-cadastral-parcel-guard: FAILED\n');
  for (const issue of issues) console.error(`  → ${issue}`);
  process.exit(1);
}

main();
