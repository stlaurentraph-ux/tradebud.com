#!/usr/bin/env node
/**
 * Ensures API access registry matches controller role checks.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractArray, readFile } from './backend-guard-lib.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(root, '..');

function extractAccessEntries(source) {
  const match = source.match(
    /export const BACKEND_API_ACCESS_ENTRIES[^=]*=\s*\[([\s\S]*?)\]\s*as const/,
  );
  if (!match) return [];

  const entries = [];
  const blocks = match[1].split(/\},\s*\{/);
  for (const block of blocks) {
    const id = block.match(/id:\s*'([^']+)'/)?.[1];
    const file = block.match(/file:\s*'([^']+)'/)?.[1];
    const roles = [...block.matchAll(/roles:\s*\[([\s\S]*?)\]/g)].flatMap((m) =>
      [...m[1].matchAll(/'([^']+)'/g)].map((r) => r[1]),
    );
    if (id && file && roles.length > 0) {
      entries.push({ id, file, roles });
    }
  }
  return entries;
}

function main() {
  const issues = [];
  const registrySource = readFile(root, 'src/auth/backendApiAccessRegistry.ts');
  const rolesSource = readFile(root, 'src/auth/roles.ts');
  const mdPath = path.join(repoRoot, 'product-os/04-quality/backend-api-access-registry.md');
  const entries = extractAccessEntries(registrySource);
  const appRoles = [...rolesSource.matchAll(/export type AppRole =([\s\S]*?);/g)].flatMap((m) =>
    [...m[1].matchAll(/'([^']+)'/g)].map((r) => r[1]),
  );

  if (entries.length === 0) {
    issues.push('BACKEND_API_ACCESS_ENTRIES is empty or unparsable');
  }

  for (const entry of entries) {
    const filePath = path.join(root, 'src', entry.file);
    if (!fs.existsSync(filePath)) {
      issues.push(`missing controller file for ${entry.id}: ${entry.file}`);
      continue;
    }
    const source = fs.readFileSync(filePath, 'utf8');
    for (const role of entry.roles) {
      if (!source.includes(`'${role}'`)) {
        issues.push(`${entry.id}: ${entry.file} no longer references role '${role}'`);
      }
      if (appRoles.includes(role) === false && !['importer', 'sponsor'].includes(role)) {
        issues.push(`${entry.id}: role '${role}' not in AppRole union (roles.ts)`);
      }
    }
    if (!mdPath.includes(entry.id) && fs.existsSync(mdPath)) {
      // checked below per entry
    }
  }

  if (!fs.existsSync(mdPath)) {
    issues.push('missing backend-api-access-registry.md');
  } else {
    const md = fs.readFileSync(mdPath, 'utf8');
    for (const entry of entries) {
      if (!md.includes(entry.id)) {
        issues.push(`backend-api-access-registry.md missing entry: ${entry.id}`);
      }
    }
  }

  const dashboardRoles = extractArray(readFile(root, 'src/auth/backendRoleRegistry.ts'), 'DASHBOARD_WORKSPACE_ROLES');
  for (const role of dashboardRoles) {
    if (!rolesSource.includes(`'${role}'`)) {
      issues.push(`DASHBOARD_WORKSPACE_ROLES references missing AppRole: ${role}`);
    }
  }

  if (issues.length === 0) {
    console.log(`backend-api-access-guard: OK (${entries.length} access entries)`);
    process.exit(0);
  }

  console.error('backend-api-access-guard: FAILED\n');
  for (const issue of issues) console.error(`  → ${issue}`);
  process.exit(1);
}

main();
