#!/usr/bin/env node
/**
 * Ensures audit event registry matches offline field events and production emit sites.
 * Strict mode (--ci): fail on unregistered audit_log event literals in src/.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildRegisteredAuditEvents,
  collectAuditEventLiterals,
  isLikelyAuditEvent,
  readFile,
  walkTsFiles,
} from './backend-guard-lib.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(root, '..');
const strict = process.argv.includes('--ci') || process.argv.includes('--strict');

function extractArray(source, exportName) {
  const match = source.match(new RegExp(`export const ${exportName} = \\[([\\s\\S]*?)\\] as const`));
  if (!match) return [];
  return [...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

function main() {
  const issues = [];
  const registry = readFile(root, 'src/audit/backendAuditEventRegistry.ts');
  const filing = readFile(root, 'src/harvest/backendFilingStateRegistry.ts');
  const offline = fs.readFileSync(
    path.join(repoRoot, 'apps/offline-product/features/sync/farmerArtifactRegistry.ts'),
    'utf8',
  );
  const mdPath = path.join(repoRoot, 'product-os/04-quality/backend-structural-contracts.md');

  const backendField = extractArray(registry, 'FIELD_CLOUD_AUDIT_EVENT_TYPES');
  const offlineField = extractArray(offline, 'FIELD_CLOUD_AUDIT_EVENT_TYPES');
  const registered = buildRegisteredAuditEvents(registry, filing);

  for (const event of offlineField) {
    if (!backendField.includes(event)) {
      issues.push(`backend FIELD_CLOUD_AUDIT_EVENT_TYPES missing: ${event}`);
    }
  }

  for (const event of backendField) {
    if (!offlineField.includes(event)) {
      issues.push(`offline FIELD_CLOUD_AUDIT_EVENT_TYPES missing: ${event}`);
    }
  }

  if (!fs.existsSync(mdPath)) {
    issues.push('missing backend-structural-contracts.md');
  } else {
    const md = fs.readFileSync(mdPath, 'utf8');
    for (const event of backendField) {
      if (!md.includes(`\`${event}\``)) {
        issues.push(`backend-structural-contracts.md missing field event: ${event}`);
      }
    }
  }

  const srcDir = path.join(root, 'src');
  const discovered = new Set();
  for (const file of walkTsFiles(srcDir)) {
    const source = fs.readFileSync(file, 'utf8');
    for (const event of collectAuditEventLiterals(source)) {
      if (isLikelyAuditEvent(event)) {
        discovered.add(event);
      }
    }
  }

  for (const event of registered) {
    if (!discovered.has(event) && strict) {
      // Registry entries not yet emitted are OK — only warn in strict if we want exhaustive parity
      // Skip dead registry detection for now to avoid false positives on dashboard-only events
    }
  }

  if (strict) {
    const nonAuditLogEvents = new Set([
      'integration_v2_stale_sweeper_executed',
      'SHIPMENT_FEE_ORIGIN_SEAL',
      'SHIPMENT_FEE_DESTINATION_SUBMIT',
    ]);
    for (const event of discovered) {
      if (registered.has(event)) continue;
      if (nonAuditLogEvents.has(event)) continue;
      issues.push(`unregistered audit event in src/: ${event}`);
    }
  } else if (discovered.size > 0) {
    const unregistered = [...discovered].filter((e) => !registered.has(e));
    if (unregistered.length > 0) {
      console.log(
        `backend-audit-event-guard: note — ${unregistered.length} unregistered event(s) (strict in CI): ${unregistered.slice(0, 8).join(', ')}${unregistered.length > 8 ? '…' : ''}`,
      );
    }
  }

  if (issues.length === 0) {
    console.log(`backend-audit-event-guard: OK (${registered.size} registered, ${discovered.size} discovered)`);
    process.exit(0);
  }

  console.error('backend-audit-event-guard: FAILED\n');
  for (const issue of issues) console.error(`  → ${issue}`);
  process.exit(1);
}

main();
