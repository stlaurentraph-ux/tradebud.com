#!/usr/bin/env node
/**
 * Fan-out structural guards across monorepo surfaces.
 * Run: npm run qa:structural:monorepo
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ci = process.argv.includes('--ci');

const surfaces = [
  {
    name: 'offline-product',
    cwd: path.join(repoRoot, 'apps/offline-product'),
    cmd: ['npm', 'run', ci ? 'qa:structural:ci' : 'qa:structural'],
  },
  {
    name: 'tracebud-backend',
    cwd: path.join(repoRoot, 'tracebud-backend'),
    cmd: ['npm', 'run', 'qa:structural'],
  },
  {
    name: 'dashboard-product',
    cwd: path.join(repoRoot, 'apps/dashboard-product'),
    cmd: ['npm', 'run', 'qa:structural'],
  },
  {
    name: 'tracebud-marketing',
    cwd: path.join(repoRoot, 'apps/marketing'),
    cmd: ['npm', 'run', 'qa:structural'],
  },
];

let failed = 0;

for (const surface of surfaces) {
  console.log(`\n######## ${surface.name} ########`);
  const result = spawnSync(surface.cmd[0], surface.cmd.slice(1), {
    cwd: surface.cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: process.env,
  });
  if (result.status !== 0) failed += 1;
}

if (failed > 0) {
  console.error(`\nrun-monorepo-structural-guards: ${failed} surface(s) failed.`);
  process.exit(1);
}

console.log('\nrun-monorepo-structural-guards: OK');
process.exit(0);
