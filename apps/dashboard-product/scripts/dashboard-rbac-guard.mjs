#!/usr/bin/env node
/**
 * Ensures dashboard RBAC registry aligns with lib/rbac.ts and types.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(root, '../..');

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

function extractArray(source, exportName) {
  const match = source.match(new RegExp(`export const ${exportName} = \\[([\\s\\S]*?)\\] as const`));
  if (!match) return [];
  return [...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

function extractUnionPermissions(rbacSource) {
  const match = rbacSource.match(/export type CommercialPermission =([\s\S]*?);/);
  if (!match) return [];
  return [...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

function extractTenantRolesFromTypes(typesSource) {
  const match = typesSource.match(/export type TenantRole = ([^;]+);/);
  if (!match) return [];
  return [...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

function extractMatrixRoles(rbacSource) {
  const match = rbacSource.match(/const PERMISSION_MATRIX: Record<TenantRole, CommercialPermission\[\]> = \{([\s\S]*?)\n\};/);
  if (!match) return [];
  return [...match[1].matchAll(/^\s{2}(\w+):/gm)].map((m) => m[1]);
}

function extractNavPermissions(rbacSource) {
  const navBlock = rbacSource.match(/export const NAVIGATION_ITEMS:[\s\S]*?=\ \[([\s\S]*?)\n\];/);
  if (!navBlock) return [];
  return [...navBlock[1].matchAll(/permission:\s*'([^']+)'/g)].map((m) => m[1]);
}

function main() {
  const issues = [];
  const registry = read('lib/dashboardRbacRegistry.ts');
  const rbac = read('lib/rbac.ts');
  const types = read('types/index.ts');
  const mdPath = path.join(repoRoot, 'product-os/04-quality/dashboard-rbac-registry.md');

  const registryRoles = extractArray(registry, 'DASHBOARD_TENANT_ROLES');
  const typeRoles = extractTenantRolesFromTypes(types);
  const matrixRoles = extractMatrixRoles(rbac);
  const permissions = extractUnionPermissions(rbac);
  const navPermissions = extractNavPermissions(rbac);

  for (const role of registryRoles) {
    if (!typeRoles.includes(role)) {
      issues.push(`TenantRole missing registry role: ${role}`);
    }
    if (!matrixRoles.includes(role)) {
      issues.push(`PERMISSION_MATRIX missing role: ${role}`);
    }
  }

  for (const role of typeRoles) {
    if (!registryRoles.includes(role)) {
      issues.push(`dashboardRbacRegistry.ts missing TenantRole: ${role}`);
    }
  }

  for (const perm of navPermissions) {
    if (!permissions.includes(perm)) {
      issues.push(`NAVIGATION_ITEMS references unknown permission: ${perm}`);
    }
  }

  if (!fs.existsSync(mdPath)) {
    issues.push('missing dashboard-rbac-registry.md');
  } else {
    const md = fs.readFileSync(mdPath, 'utf8');
    for (const role of registryRoles) {
      if (!md.includes(`\`${role}\``)) {
        issues.push(`dashboard-rbac-registry.md missing role: ${role}`);
      }
    }
  }

  if (issues.length === 0) {
    console.log('dashboard-rbac-guard: OK');
    process.exit(0);
  }

  console.error('dashboard-rbac-guard: FAILED\n');
  for (const issue of issues) console.error(`  → ${issue}`);
  process.exit(1);
}

main();
