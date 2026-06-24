#!/usr/bin/env node
/**
 * Ensures every CommercialPermission is granted, nav/onboarding permissions are valid.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractQuotedPermissions, readFile } from './dashboard-guard-lib.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function extractUnionPermissions(rbacSource) {
  const match = rbacSource.match(/export type CommercialPermission =([\s\S]*?);/);
  if (!match) return [];
  return [...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

function extractLegalPermissions(rbacSource) {
  const match = rbacSource.match(/export type LegalWorkflowPermission =([\s\S]*?);/);
  if (!match) return [];
  return [...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

function extractMatrixBlock(rbacSource, name) {
  const match = rbacSource.match(new RegExp(`const ${name}[\\s\\S]*?= \\{([\\s\\S]*?)\\n\\};`));
  return match ? match[1] : '';
}

function extractNavPermissions(rbacSource, exportName) {
  const navBlock = rbacSource.match(
    new RegExp(`export const ${exportName}:[\\s\\S]*?= \\[([\\s\\S]*?)\\n\\];`),
  );
  if (!navBlock) return [];
  return [...navBlock[1].matchAll(/permission:\s*'([^']+)'/g)].map((m) => m[1]);
}

function main() {
  const issues = [];
  const rbac = readFile(root, 'lib/rbac.ts');
  const onboarding = readFile(root, 'lib/onboarding-config.ts');

  const commercialPermissions = extractUnionPermissions(rbac);
  const legalPermissions = extractLegalPermissions(rbac);

  const granted = new Set();
  for (const block of [
    extractMatrixBlock(rbac, 'TIER_PERMISSION_MATRIX'),
    extractMatrixBlock(rbac, 'LEGAL_ROLE_PERMISSION_MATRIX'),
    extractMatrixBlock(rbac, 'PERMISSION_MATRIX'),
  ]) {
    for (const perm of extractQuotedPermissions(block)) {
      if (commercialPermissions.includes(perm) || legalPermissions.includes(perm)) {
        granted.add(perm);
      }
    }
  }

  for (const perm of commercialPermissions) {
    if (!granted.has(perm)) {
      issues.push(`CommercialPermission not granted to any role/tier: ${perm}`);
    }
  }

  for (const perm of [
    ...extractNavPermissions(rbac, 'NAVIGATION_ITEMS'),
    ...extractNavPermissions(rbac, 'SECONDARY_NAV_ITEMS'),
  ]) {
    if (!commercialPermissions.includes(perm)) {
      issues.push(`nav item references unknown CommercialPermission: ${perm}`);
    }
  }

  for (const match of onboarding.matchAll(/requiredPermission:\s*'([^']+)'/g)) {
    const perm = match[1];
    if (!commercialPermissions.includes(perm)) {
      issues.push(`onboarding step references unknown permission: ${perm}`);
    }
  }

  if (issues.length === 0) {
    console.log(`dashboard-permission-matrix-guard: OK (${commercialPermissions.length} permissions)`);
    process.exit(0);
  }

  console.error('dashboard-permission-matrix-guard: FAILED\n');
  for (const issue of issues) console.error(`  → ${issue}`);
  process.exit(1);
}

main();
