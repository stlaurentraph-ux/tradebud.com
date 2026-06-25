#!/usr/bin/env node
/**
 * Ensures dashboard tenant roles with network permissions map to backend API access roles.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from './dashboard-guard-lib.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(root, '../..');

function extractRegistryBindings(registrySource) {
  const match = registrySource.match(
    /export const DASHBOARD_BACKEND_NETWORK_API_BINDINGS = \[([\s\S]*?)\] as const;/,
  );
  if (!match) return [];
  const bindings = [];
  for (const block of match[1].matchAll(
    /\{\s*backendId:\s*'([^']+)'[\s\S]*?permission:\s*'([^']+)'[\s\S]*?tenantRoles:\s*\[([\s\S]*?)\]/g,
  )) {
    const tenantRoles = [...block[3].matchAll(/'([^']+)'/g)].map((m) => m[1]);
    bindings.push({ backendId: block[1], permission: block[2], tenantRoles });
  }
  return bindings;
}

function extractTenantJwtMap(registrySource) {
  const match = registrySource.match(
    /export const DASHBOARD_TENANT_BACKEND_JWT_ROLE = \{([\s\S]*?)\} as const;/,
  );
  if (!match) return new Map();
  const map = new Map();
  for (const row of match[1].matchAll(/^\s{2}([a-z_]+):\s*'([^']+)'/gm)) {
    map.set(row[1], row[2]);
  }
  return map;
}

function extractBackendAccessEntries(backendRegistrySource) {
  const match = backendRegistrySource.match(
    /export const BACKEND_API_ACCESS_ENTRIES[\s\S]*?= \[([\s\S]*?)\] as const;/,
  );
  if (!match) return new Map();
  const map = new Map();
  for (const block of match[1].split(/\},\s*\{/)) {
    const id = block.match(/id:\s*'([^']+)'/)?.[1];
    const roles = [...block.matchAll(/'([a-z_]+)'/g)]
      .map((m) => m[1])
      .filter((role) =>
        [
          'admin',
          'exporter',
          'cooperative',
          'importer',
          'compliance_manager',
          'country_reviewer',
          'agent',
        ].includes(role),
      );
    if (id && roles.length > 0) map.set(id, new Set(roles));
  }
  return map;
}

function main() {
  const issues = [];
  const registry = readFile(root, 'lib/dashboardCrmOutreachRegistry.ts');
  const backendRegistry = readFile(repoRoot, 'tracebud-backend/src/auth/backendApiAccessRegistry.ts');
  const mdPath = path.join(repoRoot, 'product-os/04-quality/dashboard-crm-outreach-registry.md');

  const bindings = extractRegistryBindings(registry);
  const jwtMap = extractTenantJwtMap(registry);
  const backendEntries = extractBackendAccessEntries(backendRegistry);

  if (bindings.length === 0) {
    issues.push('DASHBOARD_BACKEND_NETWORK_API_BINDINGS is empty or unparsable');
  }

  for (const binding of bindings) {
    const backendRoles = backendEntries.get(binding.backendId);
    if (!backendRoles) {
      issues.push(`backend API access entry missing: ${binding.backendId}`);
      continue;
    }

    for (const tenantRole of binding.tenantRoles) {
      const jwtRole = jwtMap.get(tenantRole);
      if (!jwtRole) {
        issues.push(`missing JWT mapping for tenant role: ${tenantRole}`);
        continue;
      }

      if (!backendRoles.has(jwtRole)) {
        issues.push(
          `${tenantRole} (${jwtRole}) bound to ${binding.backendId}/${binding.permission} but backend allows ${[...backendRoles].join(', ')}`,
        );
      }
    }
  }

  if (!fs.existsSync(mdPath) || !fs.readFileSync(mdPath, 'utf8').includes('Backend API parity')) {
    issues.push('dashboard-crm-outreach-registry.md must document backend API parity');
  }

  if (issues.length === 0) {
    console.log(`dashboard-backend-network-parity-guard: OK (${bindings.length} bindings)`);
    process.exit(0);
  }

  console.error('dashboard-backend-network-parity-guard: FAILED\n');
  for (const issue of issues) console.error(`  → ${issue}`);
  process.exit(1);
}

main();
