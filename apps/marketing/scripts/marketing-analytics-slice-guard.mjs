#!/usr/bin/env node
/**
 * Guardrail 1.M.3 — marketing analytics event surface vs trackMarketingEvent usage.
 *
 * Run: npm run analytics:slice:assert -w tracebud-marketing
 * Write baseline: npm run analytics:slice:write-baseline -w tracebud-marketing
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const marketingRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const baselinePath = path.join(
  marketingRoot,
  'qa/automation-baselines/marketing-analytics-slice-guard.json',
);
const analyticsFile = path.join(marketingRoot, 'lib/marketing-analytics.ts');

const args = new Set(process.argv.slice(2));
const strict = args.has('--strict');
const writeBaseline = args.has('--write-baseline');

const SOURCE_DIRS = ['app', 'components', 'lib'];

function listSourceFiles(dir) {
  const abs = path.join(marketingRoot, dir);
  if (!fs.existsSync(abs)) return [];
  const out = [];
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules') continue;
      out.push(...listSourceFiles(rel));
      continue;
    }
    if (/\.(tsx|ts)$/.test(entry.name) && !entry.name.endsWith('.test.ts')) {
      out.push(path.join(marketingRoot, rel));
    }
  }
  return out;
}

function extractCanonicalEvents() {
  const text = fs.readFileSync(analyticsFile, 'utf8');
  const match = text.match(/export type MarketingAnalyticsEvent\s*=[\s\S]*?;/);
  if (!match) {
    throw new Error('Could not find MarketingAnalyticsEvent union in marketing-analytics.ts');
  }
  return [...new Set([...match[0].matchAll(/\|\s*'([^']+)'/g)].map((m) => m[1]))].sort();
}

function extractTrackEventUsages() {
  const usages = new Set();
  const re = /trackMarketingEvent\s*\(\s*['"]([^'"]+)['"]/g;
  for (const file of SOURCE_DIRS.flatMap((d) => listSourceFiles(d))) {
    if (file.endsWith('marketing-analytics.ts')) continue;
    const text = fs.readFileSync(file, 'utf8');
    for (const match of text.matchAll(re)) {
      usages.add(match[1]);
    }
  }
  return [...usages].sort();
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
  const canonicalEvents = extractCanonicalEvents();
  const trackUsages = extractTrackEventUsages();
  const unknownUsages = trackUsages.filter((event) => !canonicalEvents.includes(event));
  if (unknownUsages.length) {
    throw new Error(`trackMarketingEvent uses unknown events: ${unknownUsages.join(', ')}`);
  }

  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    canonicalEventCount: canonicalEvents.length,
    canonicalEvents,
    trackUsageEvents: trackUsages,
  };

  if (writeBaseline) {
    writeBaselineFile(report);
    console.log(`Wrote baseline: ${path.relative(marketingRoot, baselinePath)}`);
    process.exit(0);
  }

  console.log(
    `marketing-analytics-slice-guard: ${canonicalEvents.length} canonical events, ${trackUsages.length} trackMarketingEvent call sites`,
  );

  const baseline = readBaseline();
  if (!baseline) {
    console.log('  NOTE no baseline yet — run npm run analytics:slice:write-baseline -w tracebud-marketing');
    process.exit(strict ? 1 : 0);
  }

  let deltaCount = 0;
  deltaCount += diffLists('canonicalEvents', canonicalEvents, baseline.canonicalEvents);
  deltaCount += diffLists('trackUsageEvents', trackUsages, baseline.trackUsageEvents);

  if (deltaCount === 0) {
    console.log('  OK — matches baseline');
    process.exit(0);
  }

  console.log(`  DELTA count: ${deltaCount}`);
  if (strict) {
    console.error('marketing-analytics-slice-guard: FAILED (strict)');
    process.exit(1);
  }
  console.log('  report mode — update baseline when event surface change is intentional');
  process.exit(0);
}

main();
