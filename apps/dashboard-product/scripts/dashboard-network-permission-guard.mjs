#!/usr/bin/env node
/**
 * Ensures network/outreach nav permissions and page PermissionGate actions match registry contracts.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from './dashboard-guard-lib.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function extractNavHrefPermission(rbacSource, href) {
  const navBlock = rbacSource.match(/export const NAVIGATION_ITEMS:[\s\S]*?= \[([\s\S]*?)\n\];/);
  if (!navBlock) return [];
  const matches = [];
  for (const row of navBlock[1].matchAll(
    /href:\s*'([^']+)'[\s\S]*?permission:\s*'([^']+)'/g,
  )) {
    if (row[1] === href || row[1].startsWith(`${href}?`)) {
      matches.push(row[2]);
    }
  }
  return matches;
}

function extractRegistryContracts(registrySource) {
  const match = registrySource.match(
    /export const DASHBOARD_NETWORK_PAGE_CONTRACTS = \[([\s\S]*?)\] as const;/,
  );
  if (!match) return [];
  const contracts = [];
  for (const block of match[1].matchAll(
    /\{\s*id:\s*'([^']+)'[\s\S]*?route:\s*'([^']+)'[\s\S]*?navPermission:\s*'([^']+)'[\s\S]*?pagePath:\s*'([^']+)'[\s\S]*?actionPermissions:\s*\[([\s\S]*?)\]/g,
  )) {
    const actions = [...block[5].matchAll(/'([^']+)'/g)].map((m) => m[1]);
    contracts.push({
      id: block[1],
      route: block[2],
      navPermission: block[3],
      pagePath: block[4],
      actionPermissions: actions,
    });
  }
  return contracts;
}

function extractPermissionGates(pageSource) {
  return [...pageSource.matchAll(/<PermissionGate permission="([^"]+)"/g)].map((m) => m[1]);
}

function main() {
  const issues = [];
  const registry = readFile(root, 'lib/dashboardCrmOutreachRegistry.ts');
  const rbac = readFile(root, 'lib/rbac.ts');
  const contracts = extractRegistryContracts(registry);

  if (contracts.length === 0) {
    issues.push('DASHBOARD_NETWORK_PAGE_CONTRACTS is empty or unparsable');
  }

  for (const contract of contracts) {
    const navPerms = extractNavHrefPermission(rbac, contract.route);
    if (navPerms.length === 0) {
      issues.push(`NAVIGATION_ITEMS missing href ${contract.route}`);
    } else if (!navPerms.includes(contract.navPermission)) {
      issues.push(
        `nav permission drift for ${contract.route}: expected ${contract.navPermission}, got ${navPerms.join(', ')}`,
      );
    }

    const pageSource = readFile(root, contract.pagePath);
    const gates = new Set(extractPermissionGates(pageSource));
    for (const perm of contract.actionPermissions) {
      if (!gates.has(perm)) {
        issues.push(`${contract.pagePath} missing PermissionGate for ${perm}`);
      }
    }
  }

  const networkPerms = ['contacts:view', 'farmers:view', 'outreach:view', 'inbox:view'];
  for (const perm of networkPerms) {
    if (!rbac.includes(`'${perm}'`)) {
      issues.push(`CommercialPermission missing network permission: ${perm}`);
    }
  }

  if (issues.length === 0) {
    console.log(`dashboard-network-permission-guard: OK (${contracts.length} routes)`);
    process.exit(0);
  }

  console.error('dashboard-network-permission-guard: FAILED\n');
  for (const issue of issues) console.error(`  → ${issue}`);
  process.exit(1);
}

main();
