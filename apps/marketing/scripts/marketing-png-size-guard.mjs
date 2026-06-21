#!/usr/bin/env node
/**
 * Guardrail 1.M.5 — marketing public PNG size budget (regression guard).
 *
 * Baseline captures current per-file byte sizes; CI fails when PNGs grow or
 * new files appear without an intentional baseline refresh.
 *
 * Run: npm run png:size:assert -w tracebud-marketing
 * Refresh: npm run png:size:write-baseline -w tracebud-marketing
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const marketingRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(marketingRoot, 'public');
const baselinePath = path.join(
  marketingRoot,
  'qa/automation-baselines/marketing-png-size-budget.json',
);

const args = new Set(process.argv.slice(2));
const strict = args.has('--strict');
const writeBaseline = args.has('--write-baseline');

/** Absolute ceiling for a single PNG (current largest ~9.9MB). */
const HARD_MAX_SINGLE_BYTES = Number.parseInt(
  process.env.MARKETING_PNG_HARD_MAX_BYTES ?? `${11 * 1024 * 1024}`,
  10,
);

function walkPngs(dir, prefix = '') {
  const out = [];
  if (!fs.existsSync(dir)) return out;

  for (const name of fs.readdirSync(dir)) {
    const fp = path.join(dir, name);
    const rel = prefix ? `${prefix}/${name}` : name;
    if (fs.statSync(fp).isDirectory()) {
      out.push(...walkPngs(fp, rel));
      continue;
    }
    if (name.endsWith('.png')) {
      out.push({
        rel: `public/${rel.replace(/\\/g, '/')}`,
        size: fs.statSync(fp).size,
      });
    }
  }
  return out.sort((a, b) => a.rel.localeCompare(b.rel));
}

function formatMb(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function readBaseline() {
  if (!fs.existsSync(baselinePath)) return null;
  return JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
}

function writeBaselineFile(payload) {
  fs.mkdirSync(path.dirname(baselinePath), { recursive: true });
  fs.writeFileSync(baselinePath, `${JSON.stringify(payload, null, 2)}\n`);
}

function collectInventory() {
  const pngs = walkPngs(publicDir);
  const files = Object.fromEntries(
    pngs.map((png) => [png.rel, { maxBytes: png.size }]),
  );
  const totalBytes = pngs.reduce((sum, png) => sum + png.size, 0);
  return { pngs, files, totalBytes };
}

function main() {
  const { pngs, files, totalBytes } = collectInventory();
  if (pngs.length === 0) {
    throw new Error('No PNG files found under public/');
  }

  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    hardMaxSingleBytes: HARD_MAX_SINGLE_BYTES,
    fileCount: pngs.length,
    totalBytes,
    files,
  };

  if (writeBaseline) {
    writeBaselineFile(report);
    console.log(`Wrote baseline: ${path.relative(marketingRoot, baselinePath)}`);
    console.log(`  ${pngs.length} PNGs, total ${formatMb(totalBytes)}`);
    process.exit(0);
  }

  console.log(
    `marketing-png-size-guard: ${pngs.length} PNGs, total ${formatMb(totalBytes)} (hard max ${formatMb(HARD_MAX_SINGLE_BYTES)} per file)`,
  );

  const oversize = pngs.filter((png) => png.size > HARD_MAX_SINGLE_BYTES);
  if (oversize.length) {
    for (const png of oversize) {
      console.error(`  HARD MAX exceeded: ${png.rel} — ${formatMb(png.size)}`);
    }
    process.exit(1);
  }

  const baseline = readBaseline();
  if (!baseline) {
    console.log('  NOTE no baseline yet — run npm run png:size:write-baseline -w tracebud-marketing');
    process.exit(strict ? 1 : 0);
  }

  let deltaCount = 0;
  const baselineFiles = baseline.files ?? {};

  for (const png of pngs) {
    const expected = baselineFiles[png.rel];
    if (!expected) {
      console.log(`  + new PNG: ${png.rel} (${formatMb(png.size)})`);
      deltaCount += 1;
      continue;
    }
    if (png.size > expected.maxBytes) {
      console.log(
        `  + grew: ${png.rel} ${formatMb(expected.maxBytes)} -> ${formatMb(png.size)}`,
      );
      deltaCount += 1;
    }
  }

  for (const rel of Object.keys(baselineFiles)) {
    if (!files[rel]) {
      console.log(`  - removed PNG: ${rel}`);
      deltaCount += 1;
    }
  }

  if (typeof baseline.totalBytes === 'number' && totalBytes > baseline.totalBytes) {
    console.log(
      `  + total footprint grew: ${formatMb(baseline.totalBytes)} -> ${formatMb(totalBytes)}`,
    );
    deltaCount += 1;
  }

  if (deltaCount === 0) {
    console.log('  OK — matches baseline');
    process.exit(0);
  }

  console.log(`  DELTA count: ${deltaCount}`);
  if (strict) {
    console.error('marketing-png-size-guard: FAILED (strict)');
    process.exit(1);
  }
  console.log('  report mode — refresh baseline when PNG changes are intentional');
  process.exit(0);
}

try {
  main();
} catch (error) {
  console.error(`marketing-png-size-guard: FAILED — ${error.message}`);
  process.exit(1);
}
