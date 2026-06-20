#!/usr/bin/env node
/**
 * Compare mobile /v1/* fetch paths against docs/openapi/tracebud-v1-draft.yaml.
 * Phase 1.O.1: report mode (non-blocking). Phase 1.O.2: --strict in CI.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(root, '../..');
const baselinePath = path.join(root, 'qa/automation-baselines/mobile-api-openapi-parity.json');
const openapiPath = path.join(repoRoot, 'docs/openapi/tracebud-v1-draft.yaml');

const args = new Set(process.argv.slice(2));
const strict = args.has('--strict');
const writeBaseline = args.has('--write-baseline');

const SOURCE_DIRS = ['features/api', 'features/sync', 'features/network'];

function listSourceFiles(dir) {
  const abs = path.join(root, dir);
  if (!fs.existsSync(abs)) return [];
  const out = [];
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listSourceFiles(rel));
      continue;
    }
    if (/\.(tsx|ts)$/.test(entry.name) && !entry.name.endsWith('.test.ts')) {
      out.push(path.join(root, rel));
    }
  }
  return out;
}

function normalizeMobilePath(raw) {
  let p = raw.split('?')[0];
  p = p.replace(/\$\{encodeURIComponent\([^)]+\)\}/g, '{id}');
  p = p.replace(/\$\{[^}]+\}/g, '{id}');
  p = p.replace(/\/+/g, '/');
  return p;
}

function extractMobilePaths() {
  const paths = new Set();
  const apiBaseTemplate = /`\$\{API_BASE_URL\}(\/v1\/[^`]+)`/g;
  const stringLiteral = /[`'"](\/v1\/[^`'"]+)[`'"]/g;

  for (const file of SOURCE_DIRS.flatMap((d) => listSourceFiles(d))) {
    const text = fs.readFileSync(file, 'utf8');
    for (const match of text.matchAll(apiBaseTemplate)) {
      paths.add(normalizeMobilePath(match[1]));
    }
    for (const match of text.matchAll(stringLiteral)) {
      paths.add(normalizeMobilePath(match[1]));
    }
  }
  return [...paths].sort();
}

function extractOpenApiPaths() {
  if (!fs.existsSync(openapiPath)) {
    throw new Error(`Missing OpenAPI draft: ${openapiPath}`);
  }
  const text = fs.readFileSync(openapiPath, 'utf8');
  const paths = new Set();
  for (const match of text.matchAll(/^\s+(\/v1\/[^\s:]+):/gm)) {
    paths.add(match[1]);
  }
  return [...paths].sort();
}

function openApiTemplate(pathname) {
  return pathname.replace(/\{[^}]+\}/g, '{id}');
}

function compare(mobilePaths, openApiPaths) {
  const openApiTemplates = new Set(openApiPaths.map(openApiTemplate));
  const missingInOpenApi = mobilePaths.filter((p) => !openApiTemplates.has(openApiTemplate(p)));
  const mobileTemplates = new Set(mobilePaths.map(openApiTemplate));
  const unusedByMobile = openApiPaths.filter((p) => !mobileTemplates.has(openApiTemplate(p)));
  return { missingInOpenApi, unusedByMobile };
}

function readBaseline() {
  if (!fs.existsSync(baselinePath)) return null;
  return JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
}

function writeBaselineFile(payload) {
  fs.mkdirSync(path.dirname(baselinePath), { recursive: true });
  fs.writeFileSync(baselinePath, `${JSON.stringify(payload, null, 2)}\n`);
}

function diffLists(label, current, previous) {
  const prev = new Set(previous ?? []);
  const added = current.filter((x) => !prev.has(x));
  const removed = (previous ?? []).filter((x) => !new Set(current).has(x));
  if (added.length) console.log(`  + ${label} added: ${added.join(', ')}`);
  if (removed.length) console.log(`  - ${label} removed: ${removed.join(', ')}`);
  return added.length + removed.length;
}

function main() {
  const mobilePaths = extractMobilePaths();
  const openApiPaths = extractOpenApiPaths();
  const { missingInOpenApi, unusedByMobile } = compare(mobilePaths, openApiPaths);

  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    mobilePathCount: mobilePaths.length,
    openApiPathCount: openApiPaths.length,
    mobilePaths,
    missingInOpenApi,
    unusedByMobile,
  };

  if (writeBaseline) {
    writeBaselineFile(report);
    console.log(`Wrote baseline: ${path.relative(root, baselinePath)}`);
    process.exit(0);
  }

  const baseline = readBaseline();
  console.log(`mobile-api-openapi-parity: ${mobilePaths.length} mobile paths, ${openApiPaths.length} OpenAPI paths`);

  if (missingInOpenApi.length) {
    console.log(`  WARN missing in OpenAPI (${missingInOpenApi.length}):`);
    for (const p of missingInOpenApi) console.log(`    - ${p}`);
  }

  if (!baseline) {
    console.log('  NOTE no baseline yet — run npm run qa:automation:write-baselines');
    process.exit(strict ? 1 : 0);
  }

  let deltaCount = 0;
  deltaCount += diffLists('mobilePaths', mobilePaths, baseline.mobilePaths);
  deltaCount += diffLists('missingInOpenApi', missingInOpenApi, baseline.missingInOpenApi);

  if (deltaCount === 0 && missingInOpenApi.length === baseline.missingInOpenApi?.length) {
    console.log('  OK — matches baseline');
    process.exit(0);
  }

  console.log(`  DELTA count: ${deltaCount}`);
  if (strict) {
    console.error('mobile-api-openapi-parity: FAILED (strict)');
    process.exit(1);
  }
  console.log('  report mode — non-blocking until slice 1.O.2');
  process.exit(0);
}

main();
