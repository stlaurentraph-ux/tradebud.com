#!/usr/bin/env node
/**
 * Ensures CRM contact statuses/types align with contact-service, activity types, and backend.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractArray, readFile } from './dashboard-guard-lib.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(root, '../..');

function extractContactStatusUnion(source) {
  const match = source.match(/export type ContactStatus =([\s\S]*?);/);
  if (!match) return [];
  const literals = [...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
  if (literals.length > 0) return literals;
  if (match[1].includes('DashboardContactStatus')) return null;
  return [];
}

function extractBackendContactStatuses(source) {
  const match = source.match(/export type ContactStatus =([\s\S]*?);/);
  if (!match) return [];
  return [...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

function extractBackendContactTypes(source) {
  const match = source.match(/export type ContactType =([\s\S]*?);/);
  if (!match) return [];
  return [...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

function extractPageStatusArrays(rootDir) {
  const pages = [
    'app/contacts/page.tsx',
    'app/contacts/[id]/page.tsx',
    'app/contacts/organization/page.tsx',
  ];
  const duplicates = [];
  for (const rel of pages) {
    const source = readFile(rootDir, rel);
    if (source.includes('DASHBOARD_CONTACT_STATUSES')) continue;
    const match = source.match(/const CONTACT_STATUSES[^=]*=\s*\[([\s\S]*?)\]/);
    if (match) {
      duplicates.push({ rel, statuses: [...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1]) });
    }
  }
  return duplicates;
}

function main() {
  const issues = [];
  const registry = readFile(root, 'lib/dashboardCrmOutreachRegistry.ts');
  const contactService = readFile(root, 'lib/contact-service.ts');
  const activityTypes = readFile(root, 'lib/contact-activity-types.ts');
  const farmersPage = readFile(root, 'app/farmers/page.tsx');
  const backendContacts = readFile(repoRoot, 'tracebud-backend/src/contacts/contacts.service.ts');
  const mdPath = path.join(repoRoot, 'product-os/04-quality/dashboard-crm-outreach-registry.md');

  const regStatuses = extractArray(registry, 'DASHBOARD_CONTACT_STATUSES');
  const regConsent = extractArray(registry, 'DASHBOARD_CONTACT_CONSENT_STATUSES');
  const regActivity = extractArray(activityTypes, 'CONTACT_ACTIVITY_TYPES');
  const serviceStatuses = extractContactStatusUnion(contactService);
  const backendStatuses = extractBackendContactStatuses(backendContacts);
  const backendTypes = extractBackendContactTypes(backendContacts);
  const farmerType = registry.match(/DASHBOARD_FARMER_CONTACT_TYPE = '([^']+)'/)?.[1];

  if (serviceStatuses === null) {
    if (!contactService.includes('dashboardCrmOutreachRegistry')) {
      issues.push('contact-service must alias ContactStatus from dashboardCrmOutreachRegistry');
    }
  } else {
    for (const status of regStatuses) {
      if (!serviceStatuses.includes(status)) {
        issues.push(`contact-service ContactStatus missing registry status: ${status}`);
      }
    }
    for (const status of serviceStatuses) {
      if (!regStatuses.includes(status)) {
        issues.push(`registry missing ContactStatus from contact-service: ${status}`);
      }
    }
  }

  for (const status of regStatuses) {
    if (!backendStatuses.includes(status)) {
      issues.push(`backend ContactStatus missing registry status: ${status}`);
    }
  }

  for (const consent of regConsent) {
    if (!contactService.includes(`'${consent}'`)) {
      issues.push(`contact-service missing consent_status: ${consent}`);
    }
    if (!backendContacts.includes(`'${consent}'`)) {
      issues.push(`backend contacts missing consent_status: ${consent}`);
    }
  }

  for (const activity of regActivity) {
    if (!backendTypes.includes(activity)) {
      issues.push(`backend ContactType missing dashboard activity type: ${activity}`);
    }
  }

  for (const backendType of backendTypes) {
    if (!regActivity.includes(backendType)) {
      issues.push(`contact-activity-types missing backend ContactType: ${backendType}`);
    }
  }

  if (farmerType !== 'farmer') {
    issues.push('DASHBOARD_FARMER_CONTACT_TYPE must be farmer');
  }

  if (!farmersPage.includes("contact.contact_type === 'farmer'")) {
    issues.push('farmers page must filter contacts by contact_type === farmer');
  }

  if (!farmersPage.includes('listContacts')) {
    issues.push('farmers page must load producers via listContacts() CRM API');
  }

  const pageDuplicates = extractPageStatusArrays(root);
  for (const { rel, statuses } of pageDuplicates) {
    if (statuses.join(',') !== regStatuses.join(',')) {
      issues.push(`${rel} CONTACT_STATUSES drift from registry — import DASHBOARD_CONTACT_STATUSES`);
    }
  }

  if (!registry.includes('mapCampaignStatusToOutreachUi')) {
    issues.push('registry missing mapCampaignStatusToOutreachUi()');
  }

  if (!fs.existsSync(mdPath)) {
    issues.push('missing dashboard-crm-outreach-registry.md');
  }

  if (issues.length === 0) {
    console.log('dashboard-crm-guard: OK');
    process.exit(0);
  }

  console.error('dashboard-crm-guard: FAILED\n');
  for (const issue of issues) console.error(`  → ${issue}`);
  process.exit(1);
}

main();
