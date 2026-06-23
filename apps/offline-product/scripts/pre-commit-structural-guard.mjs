#!/usr/bin/env node
/**
 * Pre-commit: run structural guards when offline-product files are staged.
 */
import { execSync, spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(root, '../..');

function stagedFiles() {
  try {
    return execSync('git diff --cached --name-only', {
      cwd: repoRoot,
      encoding: 'utf8',
    })
      .trim()
      .split('\n')
      .filter(Boolean);
  } catch {
    return [];
  }
}

const staged = stagedFiles();
const offlineTouched = staged.some((f) => f.startsWith('apps/offline-product/'));

if (!offlineTouched) {
  process.exit(0);
}

console.log('pre-commit-structural-guard: offline-product changes detected — running qa:structural\n');

const result = spawnSync('npm', ['run', 'qa:structural'], {
  cwd: root,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

process.exit(result.status ?? 1);
