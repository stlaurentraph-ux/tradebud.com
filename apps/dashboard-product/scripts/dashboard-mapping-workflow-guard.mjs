#!/usr/bin/env node
/**
 * Ensures mapping workflow registry, plot detail wiring, and proxy routes stay aligned.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from './dashboard-guard-lib.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(root, '../..');

function main() {
  const issues = [];
  const registry = readFile(root, 'lib/dashboardMappingWorkflowRegistry.ts');
  const plotDetail = readFile(root, 'components/plots/plot-detail-page-content.tsx');
  const mapPreviewHook = readFile(root, 'lib/use-plot-map-preview.ts');
  const mdPath = path.join(repoRoot, 'product-os/04-quality/dashboard-mapping-workflow-registry.md');

  if (!plotDetail.includes('PlotGeometryApprovalCard')) {
    issues.push('plot-detail-page-content must render PlotGeometryApprovalCard');
  }

  if (!mapPreviewHook.includes('geometry_approved_at')) {
    issues.push('use-plot-map-preview must expose geometry_approved_at');
  }

  for (const testId of ['plot-geometry-approval-card', 'plot-geometry-approval-action']) {
    const card = readFile(root, 'components/plots/plot-geometry-approval-card.tsx');
    if (!card.includes(testId)) {
      issues.push(`plot-geometry-approval-card missing testid ${testId}`);
    }
  }

  if (!registry.includes('DASHBOARD_MAPPING_WORKFLOW_SURFACES')) {
    issues.push('dashboardMappingWorkflowRegistry missing surfaces export');
  }

  for (const routeRel of [
    'app/api/plots/[id]/approve-geometry/route.ts',
    'app/api/cadastral/parcels/lookup/route.ts',
  ]) {
    if (!fs.existsSync(path.join(root, routeRel))) {
      issues.push(`missing proxy route ${routeRel}`);
    }
  }

  if (!fs.existsSync(mdPath)) {
    issues.push('missing product-os/04-quality/dashboard-mapping-workflow-registry.md');
  }

  if (issues.length === 0) {
    console.log('dashboard-mapping-workflow-guard: OK');
    process.exit(0);
  }

  console.error('dashboard-mapping-workflow-guard: FAILED\n');
  for (const issue of issues) console.error(`  → ${issue}`);
  process.exit(1);
}

main();
