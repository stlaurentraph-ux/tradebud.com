#!/usr/bin/env node
/**
 * Ensures filing state registry matches harvest.service.ts.
 */
import { readFile } from './backend-guard-lib.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(root, '..');

function extractArray(source, exportName) {
  const match = source.match(new RegExp(`export const ${exportName} = \\[([\\s\\S]*?)\\] as const`));
  if (!match) return [];
  return [...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

function main() {
  const issues = [];
  const filing = readFile(root, 'src/harvest/backendFilingStateRegistry.ts');
  const harvest = readFile(root, 'src/harvest/harvest.service.ts');
  const mdPath = path.join(repoRoot, 'product-os/04-quality/backend-structural-contracts.md');

  const preflight = extractArray(filing, 'DDS_FILING_PREFLIGHT_PHASES');
  const readiness = extractArray(filing, 'DDS_READINESS_STATES');
  const submission = extractArray(filing, 'DDS_SUBMISSION_STATES');
  const generation = extractArray(filing, 'DDS_PACKAGE_GENERATION_STATES');

  for (const state of [...preflight, ...readiness, ...submission, ...generation]) {
    if (!harvest.includes(`'${state}'`)) {
      issues.push(`harvest.service.ts missing state literal: ${state}`);
    }
  }

  const phaseExports = [
    'DDS_READINESS_AUDIT_PHASES',
    'DDS_RISK_SCORE_AUDIT_PHASES',
    'DDS_FILING_PREFLIGHT_AUDIT_PHASES',
    'DDS_GENERATION_AUDIT_PHASES',
    'DDS_SUBMISSION_AUDIT_PHASES',
  ];

  for (const exportName of phaseExports) {
    const prefixMap = {
      DDS_READINESS_AUDIT_PHASES: 'dds_package_readiness_',
      DDS_RISK_SCORE_AUDIT_PHASES: 'dds_package_risk_score_',
      DDS_FILING_PREFLIGHT_AUDIT_PHASES: 'dds_package_filing_preflight_',
      DDS_GENERATION_AUDIT_PHASES: 'dds_package_generation_',
      DDS_SUBMISSION_AUDIT_PHASES: 'dds_package_submission_',
    };
    const prefix = prefixMap[exportName];
    if (!harvest.includes(prefix)) {
      issues.push(`harvest.service.ts missing audit prefix: ${prefix}`);
    }
  }

  if (fs.existsSync(mdPath)) {
    const md = fs.readFileSync(mdPath, 'utf8');
    for (const state of preflight) {
      if (!md.includes(state)) {
        issues.push(`backend-structural-contracts.md missing preflight state: ${state}`);
      }
    }
  }

  if (issues.length === 0) {
    console.log('backend-filing-state-guard: OK');
    process.exit(0);
  }

  console.error('backend-filing-state-guard: FAILED\n');
  for (const issue of issues) console.error(`  → ${issue}`);
  process.exit(1);
}

main();
