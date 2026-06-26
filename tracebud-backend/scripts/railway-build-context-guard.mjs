#!/usr/bin/env node
/**
 * Railway deploy guard — vendor package must ship in build context and package.json must
 * resolve it via file: (not npm registry *).
 */
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(backendRoot, '..');

function read(relPath) {
  return readFileSync(path.join(backendRoot, relPath), 'utf8');
}

function readRepo(relPath) {
  return readFileSync(path.join(repoRoot, relPath), 'utf8');
}

const vendorDir = path.join(backendRoot, 'vendor/import-v1-canonical');
for (const file of ['index.cjs', 'index.d.ts', 'package.json']) {
  if (!existsSync(path.join(vendorDir, file))) {
    console.error(`railway-build-context-guard: missing vendor/import-v1-canonical/${file}`);
    process.exit(1);
  }
}

const pkg = JSON.parse(read('package.json'));
const dep = pkg.dependencies?.['@tracebud/import-v1-canonical'];
if (dep !== 'file:./vendor/import-v1-canonical') {
  console.error(
    `railway-build-context-guard: package.json must pin @tracebud/import-v1-canonical to file:./vendor/import-v1-canonical (got ${JSON.stringify(dep)})`,
  );
  process.exit(1);
}

const dockerfile = read('Dockerfile');
if (!dockerfile.includes('COPY vendor/import-v1-canonical')) {
  console.error('railway-build-context-guard: Dockerfile must COPY vendor/import-v1-canonical before npm install');
  process.exit(1);
}

const serviceRailwayIgnore = read('.railwayignore');
const ignoreLines = serviceRailwayIgnore
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith('#'));
if (ignoreLines.some((line) => line === 'vendor' || line === 'vendor/**' || line.startsWith('vendor/'))) {
  console.error('railway-build-context-guard: tracebud-backend/.railwayignore must not exclude vendor/');
  process.exit(1);
}

const rootRailwayIgnore = readRepo('.railwayignore');
if (!rootRailwayIgnore.includes('!vendor')) {
  console.error('railway-build-context-guard: repo .railwayignore must un-ignore !vendor for Root Directory=tracebud-backend');
  process.exit(1);
}

const railwayToml = read('railway.toml');
if (!railwayToml.includes('builder = "DOCKERFILE"')) {
  console.error('railway-build-context-guard: railway.toml must set builder = DOCKERFILE');
  process.exit(1);
}

console.log('railway-build-context-guard: OK');
