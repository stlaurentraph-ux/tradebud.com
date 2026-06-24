#!/usr/bin/env node
/**
 * Ensures operational issue statuses/kinds align with UI, ownership helpers, and backend service.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractArray, readFile } from './dashboard-guard-lib.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(root, '../..');

function extractBackendIssueStatuses(serviceSource) {
  const match = serviceSource.match(
    /status:\s*'open'\s*\|\s*'in_progress'[\s\S]*?'closed'/,
  );
  if (!match) return [];
  return [...match[0].matchAll(/'([a-z_]+)'/g)].map((m) => m[1]);
}

function main() {
  const issues = [];
  const registry = readFile(root, 'lib/dashboardComplianceIssuesRegistry.ts');
  const kanban = readFile(root, 'components/compliance/compliance-issues-kanban.tsx');
  const ownership = readFile(root, 'lib/compliance-issue-ownership.ts');
  const servicePath = path.join(repoRoot, 'tracebud-backend/src/requests/requests.service.ts');
  const service = fs.readFileSync(servicePath, 'utf8');
  const mdPath = path.join(repoRoot, 'product-os/04-quality/dashboard-compliance-issues-registry.md');

  const regStatuses = extractArray(registry, 'DASHBOARD_OPERATIONAL_ISSUE_STATUSES');
  const regSeverities = extractArray(registry, 'DASHBOARD_OPERATIONAL_ISSUE_SEVERITIES');
  const regKinds = extractArray(registry, 'DASHBOARD_OPERATIONAL_ISSUE_KINDS');
  const backendStatuses = extractBackendIssueStatuses(service);

  for (const status of regStatuses) {
    if (!backendStatuses.includes(status)) {
      issues.push(`backend service missing operational status: ${status}`);
    }
  }

  for (const severity of regSeverities) {
    if (!kanban.includes(`'${severity}'`) && !registry.includes(`'${severity}'`)) {
      issues.push(`missing severity constant: ${severity}`);
    }
  }

  for (const kind of regKinds) {
    if (!ownership.includes(`'${kind}'`)) {
      issues.push(`compliance-issue-ownership missing kind: ${kind}`);
    }
  }

  if (!kanban.includes('dashboardComplianceIssuesRegistry')) {
    issues.push('kanban must import dashboardComplianceIssuesRegistry');
  }

  if (!ownership.includes('dashboardComplianceIssuesRegistry')) {
    issues.push('compliance-issue-ownership must import dashboardComplianceIssuesRegistry');
  }

  if (!registry.includes('DASHBOARD_ISSUE_STATUS_TRANSITIONS')) {
    issues.push('registry missing DASHBOARD_ISSUE_STATUS_TRANSITIONS');
  }

  if (!fs.existsSync(mdPath)) {
    issues.push('missing product-os/04-quality/dashboard-compliance-issues-registry.md');
  }

  if (issues.length === 0) {
    console.log('dashboard-compliance-issues-guard: OK');
    process.exit(0);
  }

  console.error('dashboard-compliance-issues-guard: FAILED\n');
  for (const issue of issues) console.error(`  → ${issue}`);
  process.exit(1);
}

main();
