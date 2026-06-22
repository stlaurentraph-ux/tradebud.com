#!/usr/bin/env node
/**
 * Guard mobile rollout SLO wiring (offline slice 4.O.1).
 *
 * Run: npm run mobile:slo:assert
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const offlineRoot = path.join(repoRoot, 'apps/offline-product');

function readRepo(relativePath) {
  const fullPath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing required file: ${relativePath}`);
  }
  return fs.readFileSync(fullPath, 'utf8');
}

function loadJson(relativePath) {
  try {
    return JSON.parse(readRepo(relativePath));
  } catch (error) {
    throw new Error(`Invalid ${relativePath}: ${error.message}`);
  }
}

function main() {
  const manifest = loadJson('product-os/04-quality/mobile-rollout-slo.json');
  if (manifest.schemaVersion !== 1) {
    throw new Error('mobile-rollout-slo.json schemaVersion must be 1');
  }

  const requiredFiles = [
    'apps/offline-product/scripts/mobile-rollout-slo-collect.mjs',
    'apps/offline-product/scripts/release-rollout-slo-gate.mjs',
    manifest.exampleReport,
    manifest.workflowFile,
  ];
  for (const file of requiredFiles) {
    if (!fs.existsSync(path.join(repoRoot, file))) {
      throw new Error(`Missing required file: ${file}`);
    }
  }

  const pkg = JSON.parse(readRepo('apps/offline-product/package.json'));
  for (const script of ['mobile:slo:collect', 'mobile:slo:gate', 'mobile:slo:assert']) {
    if (!pkg.scripts?.[script]) {
      throw new Error(`apps/offline-product/package.json must define ${script}`);
    }
  }

  const workflow = readRepo(manifest.workflowFile);
  if (!workflow.includes('mobile:slo:collect') || !workflow.includes('mobile:slo:gate')) {
    throw new Error(`${manifest.workflowFile} must run mobile:slo:collect and mobile:slo:gate`);
  }

  const ci = readRepo('.github/workflows/ci.yml');
  if (!ci.includes('mobile:slo:assert')) {
    throw new Error('ci.yml app job must run mobile:slo:assert');
  }

  const exampleReportPath = path.join(repoRoot, manifest.exampleReport);
  const gate = spawnSync(
    process.execPath,
    ['scripts/release-rollout-slo-gate.mjs', `--report=${exampleReportPath}`],
    { cwd: offlineRoot, encoding: 'utf8' },
  );
  if (gate.status !== 0) {
    throw new Error(`Example SLO report failed gate:\n${gate.stdout}\n${gate.stderr}`);
  }

  console.log('Mobile rollout SLO guard passed.');
}

main();
