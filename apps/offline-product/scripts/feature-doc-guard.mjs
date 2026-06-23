#!/usr/bin/env node
/**
 * When offline feature code changes, require product-os / registry / smoke doc updates.
 * CI: pass --ci (uses merge-base diff). Local: checks working tree vs main.
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(root, '../..');

function gitLines(command) {
  try {
    return execSync(command, { cwd: repoRoot, encoding: 'utf8' })
      .trim()
      .split('\n')
      .filter(Boolean);
  } catch {
    return [];
  }
}

function changedFiles(ci) {
  if (ci && process.env.GITHUB_BASE_REF) {
    gitLines(`git diff --name-only origin/${process.env.GITHUB_BASE_REF}...HEAD`);
  }
  if (ci) {
    return gitLines('git diff --name-only HEAD~1..HEAD');
  }
  const againstMain = gitLines('git diff --name-only main...HEAD');
  if (againstMain.length > 0) return againstMain;
  return [
    ...gitLines('git diff --name-only HEAD'),
    ...gitLines('git diff --cached --name-only'),
  ];
}

function isSyncFeatureFile(file) {
  return (
    file.startsWith('apps/offline-product/features/sync/') &&
    !file.endsWith('.test.ts')
  );
}

function main() {
  const ci = process.argv.includes('--ci');
  const files = [...new Set(changedFiles(ci))];

  if (files.length === 0) {
    console.log('feature-doc-guard: OK (no diff — skipped)');
    process.exit(0);
  }

  const featureTouched = files.some(
    (f) =>
      f.startsWith('apps/offline-product/features/') &&
      !f.endsWith('.test.ts') &&
      !f.endsWith('.test.tsx'),
  );

  if (!featureTouched) {
    console.log('feature-doc-guard: OK (no feature code changes)');
    process.exit(0);
  }

  const docTouched = files.some(
    (f) =>
      f.startsWith('product-os/') ||
      f.includes('farmer-artifact-sync-registry.md') ||
      f.includes('DEVICE_SMOKE_CHECKLIST.md') ||
      f.includes('field-app-regression-ledger.md'),
  );

  const featDocTouched = files.some((f) => /^product-os\/02-features\/FEAT-/.test(f));
  const ledgerTouched = files.some((f) => f.includes('field-app-regression-ledger.md'));
  const syncTouched = files.some(isSyncFeatureFile);
  const registryTouched =
    files.includes('apps/offline-product/features/sync/farmerArtifactRegistry.ts') ||
    files.some((f) => f.includes('farmer-artifact-sync-registry.md'));

  const issues = [];
  if (!docTouched) {
    issues.push(
      'Feature code changed without product-os / smoke / registry doc update — add FEAT doc row, daily-log, or registry entry',
    );
  }
  if (syncTouched && !featDocTouched && !ledgerTouched) {
    issues.push(
      'features/sync/ changed — update product-os/02-features/FEAT-*.md or field-app-regression-ledger.md',
    );
  }
  if (syncTouched && !registryTouched) {
    issues.push('Sync code changed — update farmerArtifactRegistry.ts and farmer-artifact-sync-registry.md');
  }

  if (issues.length === 0) {
    console.log('feature-doc-guard: OK');
    process.exit(0);
  }

  if (!ci && issues.length > 0) {
    console.log('feature-doc-guard: WARN (local — not blocking)\n');
    for (const issue of issues) console.error(`  → ${issue}`);
    process.exit(0);
  }

  console.error('feature-doc-guard: FAILED\n');
  for (const issue of issues) console.error(`  → ${issue}`);
  process.exit(1);
}

main();
