#!/usr/bin/env node
/**
 * Release health gate evaluator (slice 4.7).
 *
 * Reads a collected report JSON and returns GO/NO-GO against manifest thresholds.
 *
 * Run:
 *   npm run release:health:gate -- --report=product-os/04-quality/release-health-report.example.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = path.join(repoRoot, 'product-os/04-quality/release-health-gate.json');

function parseArgs(argv) {
  const reportArg = argv.find((arg) => arg.startsWith('--report='));
  return {
    reportPath: reportArg ? reportArg.split('=')[1] : 'release-health-report.json',
  };
}

function loadManifest() {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (manifest.schemaVersion !== 1 || manifest.slice !== '4.7') {
    throw new Error('Invalid release-health-gate.json');
  }
  if (!Array.isArray(manifest.signals) || manifest.signals.length === 0) {
    throw new Error('manifest must define signals');
  }
  return manifest;
}

function loadReport(reportPath) {
  const absolutePath = path.isAbsolute(reportPath) ? reportPath : path.join(process.cwd(), reportPath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Release health report not found at ${absolutePath}`);
  }
  const report = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
  if (!report.signals || typeof report.signals !== 'object') {
    throw new Error('Report must include signals object');
  }
  return { absolutePath, report };
}

function evaluate(manifest, report) {
  const checks = [];

  for (const signal of manifest.signals) {
    const entry = report.signals[signal.id];
    if (!entry) {
      checks.push({
        id: signal.id,
        required: signal.required,
        status: 'fail',
        detail: 'missing from report',
        blocksVerdict: true,
      });
      continue;
    }

    const status = entry.status;
    if (status === 'skip') {
      checks.push({
        id: signal.id,
        required: signal.required,
        status,
        detail: entry.detail ?? 'skipped',
        blocksVerdict: signal.required,
      });
      continue;
    }

    if (status !== 'pass' && status !== 'fail') {
      checks.push({
        id: signal.id,
        required: signal.required,
        status: 'fail',
        detail: `invalid status "${status}"`,
        blocksVerdict: true,
      });
      continue;
    }

    const blocksVerdict = status === 'fail' || (signal.required && status !== 'pass');
    checks.push({
      id: signal.id,
      required: signal.required,
      status,
      detail: entry.detail ?? status,
      blocksVerdict,
    });
  }

  const verdict = checks.some((check) => check.blocksVerdict) ? 'NO-GO' : 'GO';
  return { checks, verdict };
}

function main() {
  const { reportPath } = parseArgs(process.argv.slice(2));
  const manifest = loadManifest();
  const { absolutePath, report } = loadReport(reportPath);
  const { checks, verdict } = evaluate(manifest, report);

  console.log(`Release health report: ${absolutePath}`);
  console.log(`Release ref: ${report.releaseRef ?? 'unknown'}`);
  console.log(`Generated at: ${report.generatedAt ?? 'unknown'}`);

  for (const check of checks) {
    const label = check.status.padEnd(4);
    const req = check.required ? 'required' : 'optional';
    console.log(`[${label}] ${check.id} (${req}): ${check.detail}`);
  }

  console.log(`\nVerdict: ${verdict}`);
  if (verdict === 'NO-GO') {
    process.exit(1);
  }
}

main();
