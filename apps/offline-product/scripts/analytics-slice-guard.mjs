#!/usr/bin/env node
/**
 * Guard analytics event surface — canonical ANALYTICS_EVENTS + trackEvent usage.
 * Prevents silent event sprawl without FEAT doc / ledger updates.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const baselinePath = path.join(root, 'qa/automation-baselines/analytics-slice-guard.json');
const analyticsFile = path.join(root, 'features/observability/analytics.ts');

const args = new Set(process.argv.slice(2));
const strict = args.has('--strict');
const writeBaseline = args.has('--write-baseline');

const SOURCE_DIRS = ['app', 'components', 'features'];

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

function extractCanonicalEvents() {
  const text = fs.readFileSync(analyticsFile, 'utf8');
  const events = [];
  for (const match of text.matchAll(/^\s+[A-Z0-9_]+:\s+'([^']+)'/gm)) {
    events.push(match[1]);
  }
  return [...new Set(events)].sort();
}

function extractTrackEventUsages() {
  const usages = new Set();
  const re = /trackEvent\s*\(\s*ANALYTICS_EVENTS\.([A-Z0-9_]+)/g;
  for (const file of SOURCE_DIRS.flatMap((d) => listSourceFiles(d))) {
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
  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    canonicalEventCount: canonicalEvents.length,
    canonicalEvents,
    trackUsageKeys: trackUsages,
  };

  if (writeBaseline) {
    writeBaselineFile(report);
    console.log(`Wrote baseline: ${path.relative(root, baselinePath)}`);
    process.exit(0);
  }

  console.log(`analytics-slice-guard: ${canonicalEvents.length} canonical events, ${trackUsages.length} trackEvent call sites`);

  const baseline = readBaseline();
  if (!baseline) {
    console.log('  NOTE no baseline yet — run npm run qa:automation:write-baselines');
    process.exit(strict ? 1 : 0);
  }

  let deltaCount = 0;
  deltaCount += diffLists('canonicalEvents', canonicalEvents, baseline.canonicalEvents);
  deltaCount += diffLists('trackUsageKeys', trackUsages, baseline.trackUsageKeys);

  if (deltaCount === 0) {
    console.log('  OK — matches baseline');
    process.exit(0);
  }

  console.log(`  DELTA count: ${deltaCount}`);
  if (strict) {
    console.error('analytics-slice-guard: FAILED (strict)');
    process.exit(1);
  }
  console.log('  report mode — non-blocking until slice 1.O.2');
  process.exit(0);
}

main();
