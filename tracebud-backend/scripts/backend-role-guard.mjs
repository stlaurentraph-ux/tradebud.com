#!/usr/bin/env node
/**
 * Ensures backendRoleRegistry.ts aligns with roles.ts and offline field roles.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(root, '..');

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

function extractAppRoleUnion(rolesSource) {
  const match = rolesSource.match(/export type AppRole =([\s\S]*?);/);
  if (!match) return [];
  return [...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

function main() {
  const issues = [];
  const registry = read('src/auth/backendRoleRegistry.ts');
  const roles = read('src/auth/roles.ts');
  const offlineRegistry = readRepo('apps/offline-product/features/auth/fieldRolePermissionRegistry.ts');
  const mdPath = path.join(repoRoot, 'product-os/04-quality/backend-structural-contracts.md');

  const backendRoles = extractArray(registry, 'BACKEND_APP_ROLES');
  const appRoles = extractAppRoleUnion(roles);
  const fieldRoles = extractArray(registry, 'FIELD_APP_ROLES');
  const offlineFieldRoles = extractArray(offlineRegistry, 'FIELD_APP_ROLES');

  for (const role of backendRoles) {
    if (!appRoles.includes(role)) {
      issues.push(`roles.ts AppRole missing registry role: ${role}`);
    }
  }

  for (const role of appRoles) {
    if (!backendRoles.includes(role)) {
      issues.push(`backendRoleRegistry.ts missing AppRole: ${role}`);
    }
  }

  for (const role of fieldRoles) {
    if (!offlineFieldRoles.includes(role)) {
      issues.push(`offline FIELD_APP_ROLES missing: ${role}`);
    }
  }

  for (const role of offlineFieldRoles) {
    if (!fieldRoles.includes(role)) {
      issues.push(`backend FIELD_APP_ROLES missing offline role: ${role}`);
    }
  }

  if (!fs.existsSync(mdPath)) {
    issues.push('missing backend-structural-contracts.md');
  } else {
    const md = fs.readFileSync(mdPath, 'utf8');
    for (const role of fieldRoles) {
      if (!md.includes(`\`${role}\``)) {
        issues.push(`backend-structural-contracts.md missing field role: ${role}`);
      }
    }
  }

  if (issues.length === 0) {
    console.log('backend-role-guard: OK');
    process.exit(0);
  }

  console.error('backend-role-guard: FAILED\n');
  for (const issue of issues) console.error(`  → ${issue}`);
  process.exit(1);
}

main();
