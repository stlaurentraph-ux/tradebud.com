#!/usr/bin/env node
/**
 * Ensures field role/permission registry aligns with backend roles and fieldAppEligibility.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(root, '../..');

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

function readRepo(rel) {
  return fs.readFileSync(path.join(repoRoot, rel), 'utf8');
}

function extractArray(source, exportName) {
  const match = source.match(new RegExp(`export const ${exportName} = \\[([\\s\\S]*?)\\] as const`));
  if (!match) return [];
  return [...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

function main() {
  const issues = [];
  const registry = read('features/auth/fieldRolePermissionRegistry.ts');
  const eligibility = read('features/auth/fieldAppEligibility.ts');
  const backendRoles = readRepo('tracebud-backend/src/auth/roles.ts');
  const mdPath = path.join(repoRoot, 'product-os/04-quality/field-role-permission-registry.md');

  const fieldRoles = extractArray(registry, 'FIELD_APP_ROLES');
  const permissions = extractArray(registry, 'FIELD_APP_PERMISSIONS');
  const blocked = extractArray(registry, 'DASHBOARD_ROLES_BLOCKED_FROM_FIELD_APP');

  for (const role of fieldRoles) {
    if (!backendRoles.includes(`'${role}'`)) {
      issues.push(`backend roles.ts missing field role: ${role}`);
    }
    if (!registry.includes(`  ${role}:`)) {
      issues.push(`FIELD_ROLE_PERMISSIONS missing matrix row: ${role}`);
    }
  }

  if (!eligibility.includes("'farmer'") || !eligibility.includes("'agent'")) {
    issues.push('fieldAppEligibility.ts must reference farmer and agent roles');
  }
  if (!eligibility.includes('isDashboardWorkspaceRole')) {
    issues.push('fieldAppEligibility.ts must block dashboard workspace roles');
  }

  if (!fs.existsSync(mdPath)) {
    issues.push('missing field-role-permission-registry.md');
  } else {
    const md = fs.readFileSync(mdPath, 'utf8');
    for (const perm of permissions) {
      if (!md.includes(perm)) {
        issues.push(`field-role-permission-registry.md missing permission: ${perm}`);
      }
    }
  }

  for (const role of blocked) {
    if (!backendRoles.includes(`'${role}'`)) {
      issues.push(`blocked dashboard role not in backend: ${role}`);
    }
  }

  const permissionGate = read('features/auth/fieldPermissionGate.ts');
  if (!permissionGate.includes('fieldRoleHasPermission')) {
    issues.push('fieldPermissionGate.ts must use fieldRoleHasPermission');
  }
  if (!permissionGate.includes('DASHBOARD_ROLES_BLOCKED_FROM_FIELD_APP')) {
    issues.push('fieldPermissionGate.ts must use DASHBOARD_ROLES_BLOCKED_FROM_FIELD_APP');
  }

  const syncPipeline = read('features/sync/runFieldSyncPipeline.ts');
  if (!syncPipeline.includes('assertFieldAppPermission')) {
    issues.push('runFieldSyncPipeline.ts must assert sync:manual permission');
  }

  const submitHarvest = read('features/harvest/submitHarvest.ts');
  if (!submitHarvest.includes("checkFieldAppPermission('harvest:log')")) {
    issues.push('submitHarvest.ts must check harvest:log permission');
  }

  const groundTruthSync = read('features/evidence/syncGroundTruthPhotosWithFiles.ts');
  if (!groundTruthSync.includes("checkFieldAppPermission('evidence:upload')")) {
    issues.push('syncGroundTruthPhotosWithFiles.ts must check evidence:upload permission');
  }

  const useFieldPermission = read('features/auth/useFieldPermission.ts');
  if (!useFieldPermission.includes('checkFieldAppPermissionForRole')) {
    issues.push('useFieldPermission.ts must use checkFieldAppPermissionForRole');
  }
  if (
    !useFieldPermission.includes('const can =') ||
    !useFieldPermission.includes('const denyReason =')
  ) {
    issues.push('useFieldPermission.ts must expose can() and denyReason()');
  }
  if (!useFieldPermission.includes('refresh')) {
    issues.push('useFieldPermission.ts must expose refresh()');
  }

  if (issues.length === 0) {
    console.log('role-permission-guard: OK');
    process.exit(0);
  }

  console.error('role-permission-guard: FAILED\n');
  for (const issue of issues) console.error(`  → ${issue}`);
  process.exit(1);
}

main();
