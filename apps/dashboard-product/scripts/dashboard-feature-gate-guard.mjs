#!/usr/bin/env node
/**
 * Ensures deferred feature gates cover network/outreach routes and middleware wiring.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from './dashboard-guard-lib.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function extractGateRoutes(featureGatesSource) {
  const routes = new Set();
  for (const block of featureGatesSource.matchAll(
    /key:\s*'([^']+)'[\s\S]*?routes:\s*\[([\s\S]*?)\]/g,
  )) {
    for (const route of block[2].matchAll(/'([^']+)'/g)) {
      routes.add(route[1]);
    }
  }
  return routes;
}

function extractRegistryNetworkRoutes(registrySource) {
  const routes = new Set();
  for (const row of registrySource.matchAll(/route:\s*'(\/[^']+)'/g)) {
    routes.add(row[1]);
  }
  return routes;
}

function main() {
  const issues = [];
  const featureGates = readFile(root, 'lib/feature-gates.ts');
  const middleware = readFile(root, 'middleware.ts');
  const registry = readFile(root, 'lib/dashboardCrmOutreachRegistry.ts');
  const middlewareTest = readFile(root, 'middleware.test.ts');

  if (!middleware.includes('getDeferredGateForPath')) {
    issues.push('middleware.ts must call getDeferredGateForPath for deferred gates');
  }

  const gateRoutes = extractGateRoutes(featureGates);
  const networkRoutes = extractRegistryNetworkRoutes(registry);
  const campaignRoutes = ['/outreach', '/inbox', '/programmes'];

  for (const route of campaignRoutes) {
    if (!gateRoutes.has(route)) {
      issues.push(`request_campaigns gate missing route: ${route}`);
    }
  }

  for (const route of networkRoutes) {
    if (campaignRoutes.includes(route) && !gateRoutes.has(route)) {
      issues.push(`network route ${route} not covered by FEATURE_GATE_CONFIG`);
    }
  }

  if (!middlewareTest.includes('request_campaigns')) {
    issues.push('middleware.test.ts must assert request_campaigns gate redirect');
  }

  if (issues.length === 0) {
    console.log(`dashboard-feature-gate-guard: OK (${gateRoutes.size} gated routes)`);
    process.exit(0);
  }

  console.error('dashboard-feature-gate-guard: FAILED\n');
  for (const issue of issues) console.error(`  → ${issue}`);
  process.exit(1);
}

main();
