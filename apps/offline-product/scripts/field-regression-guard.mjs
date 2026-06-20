#!/usr/bin/env node
/**
 * Field-app regression guards — catches bug classes that have shipped more than once.
 * Run: npm run qa:regression
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const PERSIST_FN =
  /\b(persistPlotTitlePhoto|persistPlotEvidenceItem|persistPlotPhoto|enqueuePendingSync)\s*\(/;

const SOURCE_DIRS = ['app', 'components', 'features'];

function listSourceFiles(dir) {
  const abs = path.join(root, dir);
  if (!fs.existsSync(abs)) return [];
  const out = [];
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'design') continue;
      out.push(...listSourceFiles(p));
      continue;
    }
    if (/\.(tsx|ts)$/.test(entry.name) && !entry.name.endsWith('.test.ts')) {
      out.push(path.join(root, p));
    }
  }
  return out;
}

function checkUnawaitedPersist(filePath) {
  const rel = path.relative(root, filePath);
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  const issues = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!PERSIST_FN.test(line)) continue;
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('*')) continue;
    if (/\bawait\s+persist/.test(line) || /\bawait\s+enqueuePendingSync/.test(line)) continue;
    if (/return\s+await\s+persist/.test(line)) continue;
    // Allowed: export async function persist* definitions
    if (/^\s*(export\s+)?async\s+function\s+(persist|enqueue)/.test(line)) continue;
    if (/^\s*function\s+(persist|enqueue)/.test(line)) continue;
    issues.push({
      file: rel,
      line: i + 1,
      text: trimmed.slice(0, 120),
      rule: 'unawaited-persist',
      hint: 'SQLite writes are async — await persist* before load* or setState.',
    });
  }
  return issues;
}

function checkSmokeChecklistCoversRegressionLedger() {
  const checklist = path.join(root, 'DEVICE_SMOKE_CHECKLIST.md');
  const ledger = path.join(root, '../../product-os/04-quality/field-app-regression-ledger.md');
  const issues = [];
  if (!fs.existsSync(checklist)) {
    issues.push({ file: 'DEVICE_SMOKE_CHECKLIST.md', rule: 'missing-checklist' });
    return issues;
  }
  if (!fs.existsSync(ledger)) {
    issues.push({ file: 'field-app-regression-ledger.md', rule: 'missing-ledger' });
    return issues;
  }
  const content = fs.readFileSync(checklist, 'utf8');
  const requiredAnchors = [
    'Land documents',
    'auto-upload',
    'Mark corners',
    'ground-truth photo',
  ];
  const maestroFlows = [
    'land-title-photo.yaml',
    'land-title-wrong-doc-replace.yaml',
    'tenure-evidence.yaml',
    'mark-three-corners.yaml',
    'settings-sync-smoke.yaml',
  ];
  for (const flow of maestroFlows) {
    if (!fs.existsSync(path.join(root, '.maestro', 'flows', flow))) {
      issues.push({
        file: `.maestro/flows/${flow}`,
        rule: 'missing-maestro-flow',
        hint: 'Golden-path Maestro flow required',
      });
    }
  }
  for (const anchor of requiredAnchors) {
    if (!content.includes(anchor)) {
      issues.push({
        file: 'DEVICE_SMOKE_CHECKLIST.md',
        rule: 'checklist-gap',
        hint: `Missing smoke anchor: "${anchor}" (see field-app-regression-ledger.md)`,
      });
    }
  }
  return issues;
}

function checkAppConfigPlainJavaScript() {
  const configPath = path.join(root, 'app.config.js');
  const issues = [];
  if (!fs.existsSync(configPath)) return issues;
  const source = fs.readFileSync(configPath, 'utf8');
  const match = /\(\s*(\w+)\s*:\s*\{/.exec(source);
  if (match) {
    issues.push({
      file: 'app.config.js',
      rule: 'app-config-typescript-in-js',
      hint: 'app.config.js is loaded by Node without transpilation — remove TypeScript types from callbacks.',
    });
  }
  return issues;
}

function main() {
  const files = SOURCE_DIRS.flatMap((d) => listSourceFiles(d));
  const issues = files.flatMap(checkUnawaitedPersist);
  issues.push(...checkSmokeChecklistCoversRegressionLedger());
  issues.push(...checkAppConfigPlainJavaScript());

  if (issues.length === 0) {
    console.log('field-regression-guard: OK');
    process.exit(0);
  }

  console.error('field-regression-guard: FAILED\n');
  for (const issue of issues) {
    if (issue.line) {
      console.error(`  ${issue.file}:${issue.line} [${issue.rule}]`);
      console.error(`    ${issue.text}`);
    } else {
      console.error(`  ${issue.file} [${issue.rule}]`);
    }
    if (issue.hint) console.error(`    → ${issue.hint}`);
  }
  console.error(`\n${issues.length} issue(s). See product-os/04-quality/field-app-regression-ledger.md`);
  process.exit(1);
}

main();
