#!/usr/bin/env node
/**
 * Ensures dashboard workspace roles stay aligned with backend JWT AppRole claims.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractArray, readFile } from './dashboard-guard-lib.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(root, '../..');

function main() {
  const issues = [];
  const legalRegistry = readFile(root, 'lib/dashboardLegalWorkflowRegistry.ts');
  const rbacRegistry = readFile(root, 'lib/dashboardRbacRegistry.ts');
  const backendRegistry = readFile(repoRoot, 'tracebud-backend/src/auth/backendRoleRegistry.ts');
  const mdPath = path.join(repoRoot, 'product-os/04-quality/dashboard-rbac-registry.md');

  const tenantRoles = extractArray(rbacRegistry, 'DASHBOARD_TENANT_ROLES');
  const aligned = extractArray(legalRegistry, 'DASHBOARD_BACKEND_ALIGNED_TENANT_ROLES');
  const dashboardOnly = extractArray(legalRegistry, 'DASHBOARD_ONLY_TENANT_ROLES');
  const backendWorkspace = extractArray(backendRegistry, 'DASHBOARD_WORKSPACE_ROLES');

  for (const role of aligned) {
    if (!tenantRoles.includes(role)) {
      issues.push(`DASHBOARD_TENANT_ROLES missing backend-aligned role: ${role}`);
    }
    if (!backendWorkspace.includes(role)) {
      issues.push(`backend DASHBOARD_WORKSPACE_ROLES missing aligned role: ${role}`);
    }
  }

  for (const role of dashboardOnly) {
    if (!tenantRoles.includes(role)) {
      issues.push(`DASHBOARD_TENANT_ROLES missing dashboard-only role: ${role}`);
    }
    if (backendWorkspace.includes(role)) {
      issues.push(`dashboard-only role must not appear in backend workspace roles: ${role}`);
    }
  }

  for (const role of tenantRoles) {
    if (!aligned.includes(role) && !dashboardOnly.includes(role)) {
      issues.push(`TenantRole ${role} not classified in legal workflow registry`);
    }
  }

  for (const role of ['admin', 'compliance_manager']) {
    if (!backendWorkspace.includes(role)) {
      issues.push(`backend workspace roles missing JWT role: ${role}`);
    }
    if (tenantRoles.includes(role)) {
      issues.push(`TenantRole must not duplicate backend JWT role: ${role}`);
    }
  }

  if (fs.existsSync(mdPath)) {
    const md = fs.readFileSync(mdPath, 'utf8');
    if (!md.includes('backend') && !md.includes('Backend')) {
      issues.push('dashboard-rbac-registry.md should document backend role alignment');
    }
  }

  if (issues.length === 0) {
    console.log('dashboard-backend-role-parity-guard: OK');
    process.exit(0);
  }

  console.error('dashboard-backend-role-parity-guard: FAILED\n');
  for (const issue of issues) console.error(`  → ${issue}`);
  process.exit(1);
}

main();
