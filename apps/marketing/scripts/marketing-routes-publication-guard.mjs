#!/usr/bin/env node
/**
 * Guard marketing stealth routes: publication registry, site map, draft content,
 * and page-level assertMarketingRoutePublished / createDraft* wiring stay aligned.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const marketingRoot = path.join(__dirname, '..');
const appLocaleDir = path.join(marketingRoot, 'app', '[locale]');

/** Route IDs referenced only from dynamic app pages, not the static site map. */
const ROUTE_IDS_WITHOUT_SITE_MAP = new Set(['insights-article']);

const GATE_PATTERNS = [
  'createDraftHubPage',
  'createDraftContentPage',
  'assertMarketingRoutePublished',
];

function readUtf8(relativePath) {
  return fs.readFileSync(path.join(marketingRoot, relativePath), 'utf8');
}

function extractUnionRouteIds(source) {
  const match = source.match(/export type MarketingRouteId\s*=[\s\S]*?;/);
  if (!match) {
    throw new Error('Could not find MarketingRouteId union in marketing-publication.ts');
  }
  return [...match[0].matchAll(/\|\s*'([^']+)'/g)].map((m) => m[1]);
}

function extractPublicationRecordKeys(source) {
  const match = source.match(/export const marketingRoutePublication[\s\S]*?=\s*\{([\s\S]*?)\n\};/);
  if (!match) {
    throw new Error('Could not find marketingRoutePublication record');
  }
  return [...match[1].matchAll(/^\s*'?([^':\s]+)'?\s*:/gm)].map((m) => m[1]);
}

function extractRouteIds(source) {
  return [...source.matchAll(/routeId:\s*'([^']+)'/g)].map((m) => m[1]);
}

function hrefToLocalePagePath(href) {
  const normalized = href.replace(/^\//, '');
  if (!normalized) {
    return path.join(appLocaleDir, 'page.tsx');
  }
  return path.join(appLocaleDir, normalized, 'page.tsx');
}

function pageHasPublicationGate(pagePath) {
  if (!fs.existsSync(pagePath)) {
    return false;
  }
  const source = fs.readFileSync(pagePath, 'utf8');
  return GATE_PATTERNS.some((pattern) => source.includes(pattern));
}

const publicationSource = readUtf8('lib/marketing-publication.ts');
const unionIds = new Set(extractUnionRouteIds(publicationSource));
const recordKeys = new Set(extractPublicationRecordKeys(publicationSource));
const siteMapRouteIds = new Set(extractRouteIds(readUtf8('lib/marketing-site-map.ts')));
const draftRouteIds = new Set(extractRouteIds(readUtf8('lib/marketing-draft-content.ts')));

const errors = [];

function setDiff(left, right) {
  return [...left].filter((id) => !right.has(id));
}

for (const id of setDiff(unionIds, recordKeys)) {
  errors.push(`marketingRoutePublication missing key for MarketingRouteId: ${id}`);
}
for (const id of setDiff(recordKeys, unionIds)) {
  errors.push(`marketingRoutePublication has key not in MarketingRouteId union: ${id}`);
}

for (const id of siteMapRouteIds) {
  if (!recordKeys.has(id)) {
    errors.push(`Site map routeId "${id}" is missing from marketingRoutePublication`);
  }
}

for (const id of draftRouteIds) {
  if (!recordKeys.has(id)) {
    errors.push(`Draft content routeId "${id}" is missing from marketingRoutePublication`);
  }
}

const referencedIds = new Set([...siteMapRouteIds, ...draftRouteIds, ...ROUTE_IDS_WITHOUT_SITE_MAP]);
for (const id of recordKeys) {
  if (!referencedIds.has(id)) {
    errors.push(
      `Publication route "${id}" is not referenced in site map, draft content, or ROUTE_IDS_WITHOUT_SITE_MAP`,
    );
  }
}

const siteMapSource = readUtf8('lib/marketing-site-map.ts');

for (const match of siteMapSource.matchAll(
  /\{[\s\S]*?href:\s*'([^']+)'[\s\S]*?(?:routeId:\s*'([^']+)')?[\s\S]*?\}/g,
)) {
  const href = match[1];
  const routeId = match[2];
  if (!routeId) {
    continue;
  }

  const pagePath = hrefToLocalePagePath(href);
  if (!pageHasPublicationGate(pagePath)) {
    errors.push(
      `Gated route "${routeId}" (${href}) must use createDraft* or assertMarketingRoutePublished in ${path.relative(marketingRoot, pagePath)}`,
    );
  }
}

if (errors.length > 0) {
  console.error('Marketing routes/publication guard failed:\n');
  for (const error of errors) {
    console.error(`  - ${error}`);
  }
  process.exit(1);
}

console.log(
  `Marketing routes/publication guard passed (${unionIds.size} route IDs, ${siteMapRouteIds.size} site-map gates checked).`,
);
