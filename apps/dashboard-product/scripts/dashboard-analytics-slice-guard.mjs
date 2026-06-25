#!/usr/bin/env node
/**
 * Guard dashboard analytics event surface vs trackDashboardEvent usage.
 *
 * Run: npm run analytics:slice:assert -w dashboard-product
 * Write baseline: npm run analytics:slice:write-baseline -w dashboard-product
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractObjectStringValues, listSourceFiles } from './dashboard-guard-lib.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const baselinePath = path.join(root, 'qa/automation-baselines/dashboard-analytics-slice-guard.json');
const analyticsFile = path.join(root, 'lib/observability/analytics.ts');

const args = new Set(process.argv.slice(2));
const strict = args.has('--strict') || args.has('--ci');
const writeBaseline = args.has('--write-baseline');

const SOURCE_DIRS = ['app', 'components', 'lib'];

function extractCanonicalEvents() {
  const text = fs.readFileSync(analyticsFile, 'utf8');
  return extractObjectStringValues(text, 'DASHBOARD_EVENTS').sort();
}

function extractEventKeyMap() {
  const text = fs.readFileSync(analyticsFile, 'utf8');
  const block = text.match(/export const DASHBOARD_EVENTS = \{([\s\S]*?)\n\} as const;/);
  if (!block) return new Map();
  const map = new Map();
  for (const row of block[1].matchAll(/^\s{2}([A-Z0-9_]+):\s*'([^']+)'/gm)) {
    map.set(row[1], row[2]);
  }
  return map;
}

function extractTrackUsages(eventKeyMap) {
  const usageKeys = new Set();
  const usageEvents = new Set();
  const keyRe = /trackDashboardEvent\s*\(\s*DASHBOARD_EVENTS\.([A-Z0-9_]+)/g;
  const literalRe = /trackDashboardEvent\s*\(\s*['"]([^'"]+)['"]/g;

  for (const file of listSourceFiles(root, SOURCE_DIRS)) {
    if (file.endsWith('analytics.ts')) continue;
    const text = fs.readFileSync(file, 'utf8');
    for (const match of text.matchAll(keyRe)) {
      usageKeys.add(match[1]);
      const event = eventKeyMap.get(match[1]);
      if (event) usageEvents.add(event);
    }
    for (const match of text.matchAll(literalRe)) {
      usageEvents.add(match[1]);
    }
  }

  if (textIncludesTrackUiActionFailure()) {
    usageEvents.add(eventKeyMap.get('UI_ACTION_FAILED') ?? 'dashboard_ui_action_failed');
  }

  return {
    usageKeys: [...usageKeys].sort(),
    usageEvents: [...usageEvents].sort(),
  };
}

function textIncludesTrackUiActionFailure() {
  for (const file of listSourceFiles(root, SOURCE_DIRS)) {
    if (file.endsWith('analytics.ts')) continue;
    const text = fs.readFileSync(file, 'utf8');
    if (text.includes('trackUiActionFailure(')) return true;
  }
  return false;
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
  const eventKeyMap = extractEventKeyMap();
  const canonicalEvents = extractCanonicalEvents();
  const { usageKeys, usageEvents } = extractTrackUsages(eventKeyMap);

  for (const key of usageKeys) {
    if (!eventKeyMap.has(key)) {
      throw new Error(`trackDashboardEvent uses unknown DASHBOARD_EVENTS key: ${key}`);
    }
  }

  for (const event of usageEvents) {
    if (!canonicalEvents.includes(event)) {
      throw new Error(`trackDashboardEvent uses unknown event value: ${event}`);
    }
  }

  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    canonicalEventCount: canonicalEvents.length,
    canonicalEvents,
    trackUsageEventKeys: usageKeys,
    trackUsageEvents: usageEvents,
  };

  if (writeBaseline) {
    writeBaselineFile(report);
    console.log(`Wrote baseline: ${path.relative(root, baselinePath)}`);
    process.exit(0);
  }

  console.log(
    `dashboard-analytics-slice-guard: ${canonicalEvents.length} canonical events, ${usageEvents.length} trackDashboardEvent call sites`,
  );

  const baseline = readBaseline();
  if (!baseline) {
    console.log(
      '  NOTE no baseline yet — run npm run analytics:slice:write-baseline -w dashboard-product',
    );
    process.exit(strict ? 1 : 0);
  }

  let deltaCount = 0;
  deltaCount += diffLists('canonicalEvents', canonicalEvents, baseline.canonicalEvents);
  deltaCount += diffLists('trackUsageEvents', usageEvents, baseline.trackUsageEvents);
  deltaCount += diffLists('trackUsageEventKeys', usageKeys, baseline.trackUsageEventKeys);

  if (deltaCount === 0) {
    console.log('  OK — matches baseline');
    process.exit(0);
  }

  console.log(`  DELTA count: ${deltaCount}`);
  if (strict) {
    console.error('dashboard-analytics-slice-guard: FAILED (strict)');
    process.exit(1);
  }
  console.log('  report mode — update baseline when event surface change is intentional');
  process.exit(0);
}

main();
