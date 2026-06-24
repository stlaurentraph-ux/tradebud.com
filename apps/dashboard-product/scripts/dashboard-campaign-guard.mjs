#!/usr/bin/env node
/**
 * Ensures campaign/inbox/request types align with types, hooks, UI mappers, and backend.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractArray, extractUnion, readFile } from './dashboard-guard-lib.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(root, '../..');

function extractRequestTypeUnion(typesSource) {
  const block = typesSource.match(/export interface RequestCampaign \{[\s\S]*?request_type:([\s\S]*?);/);
  if (!block) return [];
  return [...block[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

function extractBackendRequestTypes(source) {
  const match = source.match(/export type RequestType =([\s\S]*?);/);
  if (!match) return [];
  return [...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

function extractBackendCampaignStatuses(source) {
  const match = source.match(
    /status: 'DRAFT' \| 'QUEUED'[\s\S]*?'CANCELLED'/,
  );
  if (!match) return [];
  return [...match[0].matchAll(/'([A-Z_]+)'/g)].map((m) => m[1]);
}

function extractRegistryOutreachMap(registrySource) {
  const match = registrySource.match(
    /export const DASHBOARD_CAMPAIGN_TO_OUTREACH_UI[\s\S]*?= \{([\s\S]*?)\n\};/,
  );
  if (!match) return new Map();
  const map = new Map();
  for (const row of match[1].matchAll(/^\s{2}([A-Z_]+):\s*'([^']+)'/gm)) {
    map.set(row[1], row[2]);
  }
  return map;
}

function extractOutreachPageMapper(outreachSource) {
  if (outreachSource.includes('mapCampaignStatusToOutreachUi')) {
    return null;
  }
  const match = outreachSource.match(/function mapCampaignStatus\(status: string\)[\s\S]*?\n\}/);
  return match ? match[0] : null;
}

function main() {
  const issues = [];
  const registry = readFile(root, 'lib/dashboardCrmOutreachRegistry.ts');
  const types = readFile(root, 'types/index.ts');
  const useRequests = readFile(root, 'lib/use-requests.ts');
  const requestService = readFile(root, 'lib/request-service.ts');
  const outreach = readFile(root, 'app/outreach/page.tsx');
  const inbox = readFile(root, 'app/inbox/page.tsx');
  const backendRequests = readFile(repoRoot, 'tracebud-backend/src/requests/requests.service.ts');
  const sqlPath = path.join(repoRoot, 'tracebud-backend/sql/tb_v16_025_request_campaigns.sql');

  const regCampaignStatuses = extractArray(registry, 'DASHBOARD_REQUEST_CAMPAIGN_STATUSES');
  const regInboxStatuses = extractArray(registry, 'DASHBOARD_INBOX_REQUEST_STATUSES');
  const regRequestTypes = extractArray(registry, 'DASHBOARD_REQUEST_TYPES');
  const regOutreachUi = extractArray(registry, 'DASHBOARD_OUTREACH_UI_STATUSES');
  const regInboxUi = extractArray(registry, 'DASHBOARD_INBOX_UI_STATUSES');
  const typeCampaignStatuses = extractUnion(types, 'RequestCampaignStatus');
  const typeRequestTypes = extractRequestTypeUnion(types);
  const hookCampaignStatuses = extractUnion(useRequests, 'RequestCampaignStatus');
  const backendRequestTypes = extractBackendRequestTypes(backendRequests);
  const backendCampaignStatuses = extractBackendCampaignStatuses(backendRequests);
  const outreachMap = extractRegistryOutreachMap(registry);

  for (const status of regCampaignStatuses) {
    if (!typeCampaignStatuses.includes(status)) {
      issues.push(`RequestCampaignStatus type missing: ${status}`);
    }
    if (!hookCampaignStatuses.includes(status)) {
      issues.push(`use-requests RequestCampaignStatus missing: ${status}`);
    }
    if (!backendCampaignStatuses.includes(status)) {
      issues.push(`backend campaign status missing: ${status}`);
    }
    if (!outreachMap.has(status)) {
      issues.push(`DASHBOARD_CAMPAIGN_TO_OUTREACH_UI missing: ${status}`);
    }
  }

  for (const status of typeCampaignStatuses) {
    if (!regCampaignStatuses.includes(status)) {
      issues.push(`registry missing RequestCampaignStatus: ${status}`);
    }
  }

  for (const status of regInboxStatuses) {
    if (!useRequests.includes(`'${status}'`)) {
      issues.push(`use-requests missing inbox status: ${status}`);
    }
    if (!requestService.includes(`'${status}'`)) {
      issues.push(`request-service missing inbox status: ${status}`);
    }
  }

  for (const requestType of regRequestTypes) {
    if (!typeRequestTypes.includes(requestType)) {
      issues.push(`RequestCampaign.request_type missing: ${requestType}`);
    }
    if (!backendRequestTypes.includes(requestType)) {
      issues.push(`backend RequestType missing: ${requestType}`);
    }
  }

  for (const requestType of typeRequestTypes) {
    if (!regRequestTypes.includes(requestType)) {
      issues.push(`registry missing request_type: ${requestType}`);
    }
  }

  for (const [, uiStatus] of outreachMap) {
    if (!regOutreachUi.includes(uiStatus)) {
      issues.push(`outreach UI tab missing for mapped status: ${uiStatus}`);
    }
  }

  for (const ui of regInboxUi) {
    if (!registry.includes(`'${ui}'`)) {
      issues.push(`registry inbox UI status missing: ${ui}`);
    }
  }

  if (!outreach.includes('mapCampaignStatusToOutreachUi')) {
    issues.push('outreach/page.tsx must use mapCampaignStatusToOutreachUi from registry');
  }

  if (extractOutreachPageMapper(outreach)) {
    issues.push('outreach/page.tsx must not define local mapCampaignStatus()');
  }

  if (!inbox.includes('mapInboxStatusToUi')) {
    issues.push('inbox/page.tsx must use mapInboxStatusToUi from registry');
  }

  if (!registry.includes('DASHBOARD_CAMPAIGN_STATUS_TRANSITIONS')) {
    issues.push('registry missing DASHBOARD_CAMPAIGN_STATUS_TRANSITIONS');
  }

  if (fs.existsSync(sqlPath)) {
    const sql = fs.readFileSync(sqlPath, 'utf8');
    for (const status of regCampaignStatuses) {
      if (!sql.includes(`'${status}'`)) {
        issues.push(`tb_v16_025 migration missing campaign status: ${status}`);
      }
    }
    for (const requestType of regRequestTypes) {
      if (!sql.includes(`'${requestType}'`)) {
        issues.push(`tb_v16_025 migration missing request_type: ${requestType}`);
      }
    }
  }

  if (!registry.includes('canSendDraftCampaign')) {
    issues.push('registry missing canSendDraftCampaign()');
  }

  if (!registry.includes('canArchiveCampaign')) {
    issues.push('registry missing canArchiveCampaign()');
  }

  if (issues.length === 0) {
    console.log('dashboard-campaign-guard: OK');
    process.exit(0);
  }

  console.error('dashboard-campaign-guard: FAILED\n');
  for (const issue of issues) console.error(`  → ${issue}`);
  process.exit(1);
}

main();
