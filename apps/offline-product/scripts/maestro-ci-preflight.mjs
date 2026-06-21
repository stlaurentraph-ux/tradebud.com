#!/usr/bin/env node
/**
 * Maestro CI preflight — static wiring for golden-path flows (slice 1.O.3).
 * Validates flow files, appId, and testID references without a booted simulator.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = new Set(process.argv.slice(2));
const writeBaseline = args.has('--write-baseline');

const BASELINE_PATH = path.join(root, 'qa/automation-baselines/maestro-flows.json');
const FLOWS_DIR = path.join(root, '.maestro/flows');
const SOURCE_DIRS = ['app', 'components', 'features'];

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

function listSourceFiles(dir) {
  const abs = path.join(root, dir);
  if (!fs.existsSync(abs)) return [];
  const out = [];
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'design') continue;
      out.push(...listSourceFiles(rel));
      continue;
    }
    if (/\.(tsx|ts)$/.test(entry.name) && !entry.name.endsWith('.test.ts')) {
      out.push(path.join(root, rel));
    }
  }
  return out;
}

function loadBaseline() {
  if (!fs.existsSync(BASELINE_PATH)) {
    throw new Error(`Missing baseline: ${path.relative(root, BASELINE_PATH)}`);
  }
  return JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'));
}

function parseFlowAppId(content) {
  const match = content.match(/^appId:\s*(\S+)/m);
  return match?.[1] ?? null;
}

function extractFlowTestIds(content) {
  const ids = new Set();
  for (const match of content.matchAll(/\bid:\s*["']([^"']+)["']/g)) {
    ids.add(match[1]);
  }
  return [...ids];
}

function testIdPresentInSources(testId, sourceBlob) {
  const patterns = [
    `testID="${testId}"`,
    `testID='${testId}'`,
    `testID={\`${testId}\`}`,
    `testID={'${testId}'}`,
    `testID={"${testId}"}`,
    `'${testId}'`,
    `"${testId}"`,
  ];
  return patterns.some((needle) => sourceBlob.includes(needle));
}

function discoverFlowsOnDisk() {
  if (!fs.existsSync(FLOWS_DIR)) return [];
  return fs
    .readdirSync(FLOWS_DIR)
    .filter((name) => name.endsWith('.yaml'))
    .sort();
}

function writeBaselineFile(baseline) {
  fs.writeFileSync(BASELINE_PATH, `${JSON.stringify(baseline, null, 2)}\n`);
  console.log(`Wrote baseline: ${path.relative(root, BASELINE_PATH)}`);
}

function main() {
  console.log('Maestro CI preflight — static wiring\n');

  for (const rel of [
    '.maestro/config.yaml',
    'scripts/maestro-test.sh',
    'scripts/seed-maestro-simulator.mjs',
  ]) {
    const full = path.join(root, rel);
    if (!fs.existsSync(full)) {
      console.error(`FAIL missing: ${rel}`);
      process.exit(1);
    }
    console.log(`OK file: ${rel}`);
  }

  const appJson = JSON.parse(read('app.json'));
  const bundleId = appJson.expo?.ios?.bundleIdentifier ?? appJson.expo?.android?.package;
  const baseline = loadBaseline();

  if (writeBaseline) {
    const next = {
      schemaVersion: 1,
      appId: bundleId ?? baseline.appId,
      goldenPathFlow: baseline.goldenPathFlow ?? 'settings-sync-smoke.yaml',
      flows: discoverFlowsOnDisk(),
    };
    writeBaselineFile(next);
    return;
  }

  if (bundleId !== baseline.appId) {
    console.error(`FAIL appId: app.json has ${bundleId}, baseline expects ${baseline.appId}`);
    process.exit(1);
  }
  console.log(`OK appId: ${baseline.appId}`);

  const golden = baseline.goldenPathFlow;
  if (!golden || typeof golden !== 'string') {
    console.error('FAIL baseline: missing goldenPathFlow');
    process.exit(1);
  }
  if (!baseline.flows.includes(golden)) {
    console.error(`FAIL baseline: goldenPathFlow ${golden} not in flows list`);
    process.exit(1);
  }
  console.log(`OK goldenPathFlow: ${golden}`);

  const config = read('.maestro/config.yaml');
  if (!config.includes(`APP_ID: ${baseline.appId}`)) {
    console.error('FAIL .maestro/config.yaml APP_ID does not match baseline');
    process.exit(1);
  }
  console.log('OK .maestro/config.yaml APP_ID');

  const onDisk = discoverFlowsOnDisk();
  const expected = [...baseline.flows].sort();
  const diskSorted = [...onDisk].sort();
  if (JSON.stringify(diskSorted) !== JSON.stringify(expected)) {
    console.error('FAIL flow manifest drift vs baseline');
    console.error(`  baseline: ${expected.join(', ')}`);
    console.error(`  on disk:  ${diskSorted.join(', ')}`);
    console.error('  refresh: npm run qa:maestro:write-baseline');
    process.exit(1);
  }
  console.log(`OK flows manifest (${expected.length} files)`);

  const sourceBlob = SOURCE_DIRS.flatMap((d) => listSourceFiles(d))
    .map((file) => fs.readFileSync(file, 'utf8'))
    .join('\n');

  for (const flow of expected) {
    const flowPath = path.join(FLOWS_DIR, flow);
    const content = fs.readFileSync(flowPath, 'utf8');
    const appId = parseFlowAppId(content);
    if (appId !== baseline.appId) {
      console.error(`FAIL ${flow}: appId ${appId} != ${baseline.appId}`);
      process.exit(1);
    }
    if (!content.includes('---')) {
      console.error(`FAIL ${flow}: missing YAML document separator (---)`);
      process.exit(1);
    }
    const testIds = extractFlowTestIds(content);
    for (const testId of testIds) {
      if (!testIdPresentInSources(testId, sourceBlob)) {
        console.error(`FAIL ${flow}: testID "${testId}" not found in app source`);
        process.exit(1);
      }
    }
    console.log(`OK flow: ${flow} (${testIds.length} testID refs)`);
  }

  console.log('\nMaestro CI preflight passed.');
}

main();
