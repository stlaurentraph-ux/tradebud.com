#!/usr/bin/env node
/**
 * Ensures cross-surface network routing registry parity:
 * - shared email resolver wired into delivery + inbox fan-out
 * - tenant farmer scope includes active consent grants
 * - registry backend modules exist
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from './backend-guard-lib.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(root, '..');

function extractRegistryConsumers(registrySource) {
  const match = registrySource.match(
    /export const NETWORK_ROUTING_EMAIL_RESOLVER_CONSUMERS = \[([\s\S]*?)\] as const;/,
  );
  if (!match) return [];
  return [...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

function extractFlowModules(registrySource) {
  const modules = new Set();
  for (const block of registrySource.matchAll(/backendModules:\s*\[([\s\S]*?)\]/g)) {
    for (const mod of block[1].matchAll(/'([^']+)'/g)) {
      modules.add(mod[1]);
    }
  }
  return [...modules];
}

function main() {
  const issues = [];
  const registrySource = readFile(root, 'src/network/networkRoutingRegistry.ts');
  const scopeSource = readFile(root, 'src/common/tenant-farmer-scope.ts');
  const mdPath = path.join(repoRoot, 'product-os/04-quality/network-routing-registry.md');

  const consumers = extractRegistryConsumers(registrySource);
  if (consumers.length < 2) {
    issues.push('NETWORK_ROUTING_EMAIL_RESOLVER_CONSUMERS must list delivery + inbox modules');
  }

  for (const rel of consumers) {
    const filePath = path.join(root, 'src', rel);
    if (!fs.existsSync(filePath)) {
      issues.push(`Missing email resolver consumer file: ${rel}`);
      continue;
    }
    const source = fs.readFileSync(filePath, 'utf8');
    if (!source.includes('email-to-tenant-resolution')) {
      issues.push(`${rel} must import network/email-to-tenant-resolution`);
    }
  }

  if (!scopeSource.includes('consent_grants')) {
    issues.push('tenant-farmer-scope.ts must union active consent_grants farmers');
  }

  for (const rel of extractFlowModules(registrySource)) {
    const filePath = path.join(root, 'src', rel);
    if (!fs.existsSync(filePath)) {
      issues.push(`Registry backend module missing: ${rel}`);
    }
  }

  if (!fs.existsSync(mdPath)) {
    issues.push('Missing product-os/04-quality/network-routing-registry.md');
  } else {
    const md = fs.readFileSync(mdPath, 'utf8');
    if (!md.includes('field_delivery_to_buyer_tenant')) {
      issues.push('network-routing-registry.md must document field_delivery_to_buyer_tenant');
    }
    if (!md.includes('tenant_signup_contacts') || !md.includes('admin_users')) {
      issues.push('network-routing-registry.md must list both email resolution sources');
    }
  }

  const resolverPath = path.join(root, 'src/network/email-to-tenant-resolution.ts');
  if (!fs.existsSync(resolverPath)) {
    issues.push('Missing src/network/email-to-tenant-resolution.ts');
  }

  if (issues.length > 0) {
    console.error('backend-network-routing-guard: FAILED');
    for (const issue of issues) {
      console.error(`  - ${issue}`);
    }
    process.exit(1);
  }

  console.log('backend-network-routing-guard: OK');
}

main();
