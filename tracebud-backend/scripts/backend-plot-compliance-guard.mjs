#!/usr/bin/env node
/**
 * Ensures plot compliance registry aligns with plot-compliance-status.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractArray, readFile } from './backend-guard-lib.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(root, '..');

function extractUnion(source, exportName) {
  const match = source.match(new RegExp(`export type ${exportName} =([\\s\\S]*?);`));
  if (!match) return [];
  return [...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

function main() {
  const issues = [];
  const registry = readFile(root, 'src/compliance/backendPlotComplianceRegistry.ts');
  const canonical = readFile(root, 'src/compliance/plot-compliance-status.ts');
  const plots = readFile(root, 'src/plots/plots.service.ts');
  const mdPath = path.join(repoRoot, 'product-os/04-quality/backend-plot-compliance-registry.md');

  const registryStatuses = extractArray(registry, 'PLOT_COMPLIANCE_STATUSES');
  const typeStatuses = extractUnion(canonical, 'PlotComplianceStatus');
  const aliases = extractArray(registry, 'PLOT_DEFORESTATION_FREE_ALIASES');

  for (const status of registryStatuses) {
    if (!typeStatuses.includes(status)) {
      issues.push(`PlotComplianceStatus missing registry status: ${status}`);
    }
    if (!canonical.includes(`'${status}'`)) {
      issues.push(`plot-compliance-status.ts missing status literal: ${status}`);
    }
  }

  for (const status of typeStatuses) {
    if (!registryStatuses.includes(status)) {
      issues.push(`backendPlotComplianceRegistry.ts missing status: ${status}`);
    }
  }

  for (const alias of aliases) {
    if (!canonical.includes(`'${alias}'`)) {
      issues.push(`isPlotDeforestationFreeVerified must reference alias: ${alias}`);
    }
  }

  if (!plots.includes('plot_compliance_checked') || !plots.includes('plot_deforestation_decision_recorded')) {
    issues.push('plots.service.ts must emit plot compliance audit events');
  }

  if (!fs.existsSync(mdPath)) {
    issues.push('missing backend-plot-compliance-registry.md');
  } else {
    const md = fs.readFileSync(mdPath, 'utf8');
    for (const status of registryStatuses) {
      if (!md.includes(`\`${status}\``)) {
        issues.push(`backend-plot-compliance-registry.md missing status: ${status}`);
      }
    }
  }

  if (issues.length === 0) {
    console.log('backend-plot-compliance-guard: OK');
    process.exit(0);
  }

  console.error('backend-plot-compliance-guard: FAILED\n');
  for (const issue of issues) console.error(`  → ${issue}`);
  process.exit(1);
}

main();
