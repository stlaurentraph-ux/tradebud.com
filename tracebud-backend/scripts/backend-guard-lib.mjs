#!/usr/bin/env node
/**
 * Shared helpers for backend structural guards.
 */
import fs from 'node:fs';
import path from 'node:path';

export function readFile(root, rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

export function extractArray(source, exportName) {
  const match = source.match(new RegExp(`export const ${exportName} = \\[([\\s\\S]*?)\\] as const`));
  if (!match) return [];
  return [...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

export function walkTsFiles(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkTsFiles(full, acc);
      continue;
    }
    if (!entry.name.endsWith('.ts')) continue;
    if (entry.name.endsWith('.spec.ts') || entry.name.endsWith('.int.spec.ts')) continue;
    acc.push(full);
  }
  return acc;
}

export function collectAuditEventLiterals(source) {
  const events = new Set();
  const patterns = [
    /event_type\s*=\s*'([^']+)'/g,
    /event_type:\s*'([^']+)'/g,
    /emitAudit(?:Event)?\(\s*'([^']+)'/g,
    /appendChatAuditEvent\(\s*'([^']+)'/g,
    /appendAuditEvent\([^,]+,\s*'([^']+)'/g,
    /VALUES\s*\(\s*'([^']+)'\s*,\s*\$/g,
  ];

  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      events.add(match[1]);
    }
  }

  return events;
}

export function isLikelyAuditEvent(value) {
  if (!/^[a-z][a-z0-9_]*$/.test(value)) return false;
  if (value.length < 5) return false;
  const blocked = new Set([
    'open',
    'closed',
    'active',
    'draft',
    'failed',
    'started',
    'completed',
    'resolved',
    'pending',
    'unknown',
    'annual',
    'coffee',
    'claim',
    'imported',
    'polygon',
    'strict',
    'balanced',
    'lenient',
    'desc',
    'asc',
    'medium',
    'high',
    'low',
    'green',
    'amber',
    'red',
    'passed',
    'blocked',
    'ready',
    'warning',
    'accepted',
    'replayed',
    'requested',
    'evaluated',
    'generated',
    'submitted',
    'executed',
    'invited',
    'engaged',
    'cancelled',
    'timeout',
  ]);
  if (blocked.has(value)) return false;
  return value.includes('_');
}

export function expandDynamicAuditEvents(prefixes, registrySource) {
  const expanded = new Set();
  const phaseGroups = [
    ['dds_package_readiness_', 'DDS_READINESS_AUDIT_PHASES'],
    ['dds_package_risk_score_', 'DDS_RISK_SCORE_AUDIT_PHASES'],
    ['dds_package_filing_preflight_', 'DDS_FILING_PREFLIGHT_AUDIT_PHASES'],
    ['dds_package_generation_', 'DDS_GENERATION_AUDIT_PHASES'],
    ['dds_package_submission_', 'DDS_SUBMISSION_AUDIT_PHASES'],
  ];

  for (const [prefix, exportName] of phaseGroups) {
    for (const phase of extractArray(registrySource, exportName)) {
      expanded.add(`${prefix}${phase}`);
    }
  }

  for (const prefix of prefixes) {
    expanded.add(prefix);
  }

  return expanded;
}

export function buildRegisteredAuditEvents(registrySource, filingSource) {
  const events = new Set();
  const arrayNames = [
    'FIELD_CLOUD_AUDIT_EVENT_TYPES',
    'BACKEND_DASHBOARD_AUDIT_EVENT_TYPES',
    'BACKEND_ASSIGNMENT_AUDIT_EVENT_TYPES',
    'BACKEND_CHAT_AUDIT_EVENT_TYPES',
    'BACKEND_WORKFLOW_AUDIT_EVENT_TYPES',
    'BACKEND_PLOT_AUDIT_EVENT_TYPES',
    'BACKEND_HARVEST_AUDIT_EVENT_TYPES',
    'BACKEND_TENURE_AUDIT_EVENT_TYPES',
    'BACKEND_INTEGRATION_AUDIT_EVENT_TYPES',
    'BACKEND_PARTNER_AUDIT_EVENT_TYPES',
    'BACKEND_CONSENT_AUDIT_EVENT_TYPES',
    'BACKEND_CONTACT_AUDIT_EVENT_TYPES',
    'BACKEND_LAUNCH_AUDIT_EVENT_TYPES',
    'BACKEND_ONBOARDING_EMAIL_AUDIT_EVENT_TYPES',
    'BACKEND_INBOX_AUDIT_EVENT_TYPES',
    'BACKEND_YIELD_BENCHMARK_AUDIT_EVENT_TYPES',
    'BACKEND_BILLING_AUDIT_EVENT_TYPES',
  ];

  for (const name of arrayNames) {
    for (const event of extractArray(registrySource, name)) {
      events.add(event);
    }
  }

  for (const event of expandDynamicAuditEvents(
    extractArray(registrySource, 'BACKEND_AUDIT_DYNAMIC_PREFIXES'),
    filingSource,
  )) {
    if (!event.endsWith('_')) events.add(event);
  }

  return events;
}
