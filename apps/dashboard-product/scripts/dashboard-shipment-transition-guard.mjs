#!/usr/bin/env node
/**
 * Ensures shipment status registry matches types and canTransitionPackage().
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

function extractArray(source, exportName) {
  const match = source.match(new RegExp(`export const ${exportName} = \\[([\\s\\S]*?)\\] as const`));
  if (!match) return [];
  return [...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

function extractShipmentStatusUnion(typesSource) {
  const match = typesSource.match(/export type ShipmentStatus =([\s\S]*?);/);
  if (!match) return [];
  return [...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

function extractTransitionStatuses(rbacSource) {
  const block = rbacSource.match(/function canTransitionPackage[\s\S]*?const transitions:[\s\S]*?= \{([\s\S]*?)\n  \};/);
  if (!block) return [];
  return [...block[1].matchAll(/'([A-Z_]+)'/g)].map((m) => m[1]);
}

function main() {
  const issues = [];
  const registry = read('lib/dashboardRbacRegistry.ts');
  const types = read('types/index.ts');
  const rbac = read('lib/rbac.ts');

  const registryStatuses = extractArray(registry, 'DASHBOARD_SHIPMENT_STATUSES');
  const typeStatuses = extractShipmentStatusUnion(types);
  const transitionStatuses = new Set(extractTransitionStatuses(rbac));

  for (const status of registryStatuses) {
    if (!typeStatuses.includes(status)) {
      issues.push(`ShipmentStatus type missing registry status: ${status}`);
    }
  }

  for (const status of typeStatuses) {
    if (!registryStatuses.includes(status)) {
      issues.push(`dashboardRbacRegistry.ts missing ShipmentStatus: ${status}`);
    }
  }

  for (const status of registryStatuses) {
    if (!transitionStatuses.has(status) && status !== 'ARCHIVED' && status !== 'ACCEPTED') {
      // ARCHIVED/ACCEPTED may be terminal-only — warn only if completely absent from rbac
      if (!rbac.includes(`'${status}'`)) {
        issues.push(`lib/rbac.ts does not reference status: ${status}`);
      }
    }
  }

  if (!rbac.includes('canTransitionPackage')) {
    issues.push('lib/rbac.ts missing canTransitionPackage()');
  }

  if (issues.length === 0) {
    console.log('dashboard-shipment-transition-guard: OK');
    process.exit(0);
  }

  console.error('dashboard-shipment-transition-guard: FAILED\n');
  for (const issue of issues) console.error(`  → ${issue}`);
  process.exit(1);
}

main();
