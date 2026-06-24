#!/usr/bin/env node
/**
 * Ensures dashboard tenant roles with issues permissions map to backend operational issues API roles.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from './dashboard-guard-lib.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(root, '../..');

function extractRegistryBindings(registrySource) {
  const match = registrySource.match(
    /export const DASHBOARD_BACKEND_ISSUES_API_BINDINGS = \[([\s\S]*?)\] as const;/,
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
    /export const DASHBOARD_ISSUES_TENANT_BACKEND_JWT_ROLE = \{([\s\S]*?)\} as const;/,
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
          'sponsor',
        ].includes(role),
      );
    if (id && roles.length > 0) map.set(id, new Set(roles));
  }
  return map;
}

function extractControllerRoles(controllerSource) {
  const match = controllerSource.match(/requireOperationalIssuesAccess[\s\S]*?includes\(role\)/);
  if (!match) return new Set();
  return new Set([...match[0].matchAll(/'([a-z_]+)'/g)].map((m) => m[1]));
}

function main() {
  const issues = [];
  const registry = readFile(root, 'lib/dashboardComplianceIssuesRegistry.ts');
  const backendRegistry = readFile(repoRoot, 'tracebud-backend/src/auth/backendApiAccessRegistry.ts');
  const controller = readFile(repoRoot, 'tracebud-backend/src/requests/requests.controller.ts');

  const bindings = extractRegistryBindings(registry);
  const jwtMap = extractTenantJwtMap(registry);
  const backendEntries = extractBackendAccessEntries(backendRegistry);
  const controllerRoles = extractControllerRoles(controller);

  if (bindings.length === 0) {
    issues.push('DASHBOARD_BACKEND_ISSUES_API_BINDINGS is empty or unparsable');
  }

  for (const binding of bindings) {
    const backendRoles = backendEntries.get(binding.backendId);
    if (!backendRoles) {
      issues.push(`backendApiAccessRegistry missing entry: ${binding.backendId}`);
      continue;
    }
    for (const tenantRole of binding.tenantRoles) {
      const jwtRole = jwtMap.get(tenantRole) ?? tenantRole;
      const mappedRole = jwtRole === 'compliance_manager' ? 'compliance_manager' : jwtRole;
      if (!backendRoles.has(mappedRole) && !backendRoles.has('admin')) {
        issues.push(
          `tenant role ${tenantRole} (jwt ${mappedRole}) lacks backend access for ${binding.backendId}`,
        );
      }
      if (controllerRoles.size > 0 && !controllerRoles.has(mappedRole) && !controllerRoles.has('admin')) {
        issues.push(
          `requests.controller operational issues missing role ${mappedRole} for ${binding.permission}`,
        );
      }
    }
  }

  if (issues.length === 0) {
    console.log(`dashboard-compliance-backend-parity-guard: OK (${bindings.length} bindings)`);
    process.exit(0);
  }

  console.error('dashboard-compliance-backend-parity-guard: FAILED\n');
  for (const issue of issues) console.error(`  → ${issue}`);
  process.exit(1);
}

main();
