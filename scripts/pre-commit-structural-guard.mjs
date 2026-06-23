#!/usr/bin/env node
/**
 * Pre-commit: run structural guards for each app with staged changes.
 */
import { execSync, spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const SURFACES = [
  { prefix: 'apps/offline-product/', cwd: 'apps/offline-product', script: 'qa:structural' },
  { prefix: 'tracebud-backend/', cwd: 'tracebud-backend', script: 'qa:structural' },
  { prefix: 'apps/dashboard-product/', cwd: 'apps/dashboard-product', script: 'qa:structural' },
  { prefix: 'apps/marketing/', cwd: 'apps/marketing', script: 'qa:structural:ci' },
  {
    prefix: 'product-os/04-quality/',
    cwd: null,
    all: true,
  },
];

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
const toRun = new Map();

for (const surface of SURFACES) {
  if (surface.all) {
    if (staged.some((f) => f.startsWith(surface.prefix))) {
      for (const s of SURFACES.filter((x) => x.cwd)) {
        toRun.set(s.cwd, s.script);
      }
    }
    continue;
  }
  if (staged.some((f) => f.startsWith(surface.prefix))) {
    toRun.set(surface.cwd, surface.script);
  }
}

if (toRun.size === 0) {
  process.exit(0);
}

let failed = 0;

for (const [cwd, script] of toRun) {
  console.log(`\npre-commit-structural-guard: ${cwd} — running ${script}\n`);
  const result = spawnSync('npm', ['run', script], {
    cwd: path.join(repoRoot, cwd),
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) failed += 1;
}

process.exit(failed > 0 ? 1 : 0);
