#!/usr/bin/env node
/**
 * Ensures exporter critical-path pages wire readiness gates, lineage, and north-star CTAs.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from './dashboard-guard-lib.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(root, '../..');

function main() {
  const issues = [];
  const registry = readFile(root, 'lib/dashboardExporterWorkflowRegistry.ts');
  const northStar = readFile(root, 'lib/dashboard-north-star.ts');
  const handoffTest = readFile(root, 'lib/supply-chain-terminology-handoff.test.ts');
  const mdPath = path.join(repoRoot, 'product-os/04-quality/dashboard-exporter-workflow-registry.md');

  for (const surface of [
    {
      pagePath: 'app/packages/[id]/page.tsx',
      required: ['usePackageReadiness', 'BlockerCard', 'PackageLineageSummaryCard', 'readinessBlockers.length'],
    },
    {
      pagePath: 'app/packages/[id]/assemble/page.tsx',
      required: ['usePackageReadiness', 'readinessBlockers.length'],
    },
    {
      pagePath: 'components/dashboards/exporter-dashboard.tsx',
      required: ['getNorthStarForRole', 'VirginStatePanel', 'isVirginTenantForRole'],
    },
  ]) {
    const source = readFile(root, surface.pagePath);
    for (const token of surface.required) {
      if (!source.includes(token)) {
        issues.push(`${surface.pagePath} missing exporter wiring: ${token}`);
      }
    }
  }

  for (const cta of ['/compliance/issues', '/packages?status=READY', '/packages?status=SEALED']) {
    if (!northStar.includes(`'${cta}'`)) {
      issues.push(`dashboard-north-star.ts missing exporter CTA: ${cta}`);
    }
  }

  for (const helper of [
    'getPackageFilingWorkflowHint',
    'getAssembleShipmentSubtitle',
    'getPackagePreflightBlockersTitle',
  ]) {
    if (!handoffTest.includes(helper)) {
      issues.push(`supply-chain-terminology-handoff.test.ts must cover ${helper}`);
    }
  }

  if (!registry.includes('DASHBOARD_EXPORTER_READINESS_GATE_SURFACES')) {
    issues.push('dashboardExporterWorkflowRegistry missing readiness gate surfaces');
  }

  if (!fs.existsSync(mdPath)) {
    issues.push('missing product-os/04-quality/dashboard-exporter-workflow-registry.md');
  }

  if (issues.length === 0) {
    console.log('dashboard-exporter-workflow-guard: OK');
    process.exit(0);
  }

  console.error('dashboard-exporter-workflow-guard: FAILED\n');
  for (const issue of issues) console.error(`  → ${issue}`);
  process.exit(1);
}

main();
