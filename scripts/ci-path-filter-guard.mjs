#!/usr/bin/env node
/**
 * Guardrail — CI path-filter wiring (offline/Maestro cost hygiene).
 *
 * Run: npm run ci:path-filter:assert
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function read(rel) {
  const full = path.join(repoRoot, rel);
  if (!fs.existsSync(full)) throw new Error(`Missing: ${rel}`);
  return fs.readFileSync(full, 'utf8');
}

function main() {
  const ci = read('.github/workflows/ci.yml');

  if (!ci.includes('founder_os: ${{ steps.filter.outputs.founder_os }}')) {
    throw new Error('ci.yml changes job must export founder_os path filter output');
  }
  if (!ci.includes('if: github.event_name != \'pull_request\' || needs.changes.outputs.founder_os == \'true\'')) {
    throw new Error('founder-os job must be path-filter gated on pull_request');
  }
  if (ci.includes("product-os/**")) {
    throw new Error('contracts path filter must not use blanket product-os/** (Maestro doc edits fan out OpenAPI CI)');
  }
  if (!ci.includes('product-os/04-quality/maestro-*.json')) {
    throw new Error('offline path filter must include product-os Maestro manifests');
  }
  if (ci.includes('CI_RUN')) {
    throw new Error('ci.yml must use job-level path if: gates (no CI_RUN step skips)');
  }

  const uptime = read('.github/workflows/uptime-probes.yml');
  if (uptime.includes('*/30 * * * *')) {
    throw new Error('uptime-probes.yml must not run every 30 minutes (use 0 */6 * * * or slower)');
  }

  console.log('CI path-filter guard passed.');
}

main();
