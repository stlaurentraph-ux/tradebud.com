#!/usr/bin/env node
/**
 * Ensures dashboard analytics events that mirror backend audit types stay aligned.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from './dashboard-guard-lib.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(root, '../..');

function extractAuditParity(registrySource) {
  const match = registrySource.match(
    /export const DASHBOARD_BACKEND_AUDIT_EVENT_PARITY = \[([\s\S]*?)\] as const;/,
  );
  if (!match) return [];
  const rows = [];
  for (const block of match[1].matchAll(
    /backendEvent:\s*'([^']+)'[\s\S]*?dashboardEvent:\s*'([^']+)'/g,
  )) {
    rows.push({ backendEvent: block[1], dashboardEvent: block[2] });
  }
  return rows;
}

function extractBackendAuditEvents(source) {
  return new Set([...source.matchAll(/'([a-z0-9_]+)'/g)].map((m) => m[1]));
}

function extractDashboardEvents(analyticsSource) {
  const match = analyticsSource.match(/export const DASHBOARD_EVENTS = \{([\s\S]*?)\n\} as const;/);
  if (!match) return new Set();
  return new Set([...match[1].matchAll(/:\s*'([^']+)'/g)].map((m) => m[1]));
}

function main() {
  const issues = [];
  const registry = readFile(root, 'lib/dashboardCrmOutreachRegistry.ts');
  const analytics = readFile(root, 'lib/observability/analytics.ts');
  const backendAuditPath = path.join(repoRoot, 'tracebud-backend/src/audit/backendAuditEventRegistry.ts');
  const backendAudit = fs.readFileSync(backendAuditPath, 'utf8');

  const parity = extractAuditParity(registry);
  const backendEvents = extractBackendAuditEvents(backendAudit);
  const dashboardEvents = extractDashboardEvents(analytics);

  if (parity.length === 0) {
    issues.push('DASHBOARD_BACKEND_AUDIT_EVENT_PARITY is empty or unparsable');
  }

  for (const row of parity) {
    if (!backendEvents.has(row.backendEvent)) {
      issues.push(`backend audit missing event: ${row.backendEvent}`);
    }
    if (!dashboardEvents.has(row.dashboardEvent)) {
      issues.push(`dashboard analytics missing event: ${row.dashboardEvent}`);
    }
  }

  if (issues.length === 0) {
    console.log(`dashboard-audit-parity-guard: OK (${parity.length} parity rows)`);
    process.exit(0);
  }

  console.error('dashboard-audit-parity-guard: FAILED\n');
  for (const issue of issues) console.error(`  → ${issue}`);
  process.exit(1);
}

main();
