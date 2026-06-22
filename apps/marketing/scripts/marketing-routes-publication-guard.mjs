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

function extractCreateDraftPaths(appDir) {
  const paths = new Map();

  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }
      if (!entry.name.endsWith('.tsx')) {
        continue;
      }

      const source = fs.readFileSync(fullPath, 'utf8');
      for (const match of source.matchAll(
        /createDraft(?:Hub|Content)Page\([\s\S]*?,\s*'([^']+)'\s*,?\s*\)/g,
      )) {
        paths.set(match[1], fullPath);
      }
    }
  }

  walk(appDir);
  return paths;
}

function extractSupplementalStealthPaths(source) {
  const match = source.match(
    /export const marketingStealthSupplementalPaths[\s\S]*?=\s*\[([\s\S]*?)\n\];/,
  );
  if (!match) {
    throw new Error('Could not parse marketingStealthSupplementalPaths array');
  }

  const entries = [];
  for (const row of match[1].matchAll(/\{\s*href:\s*'([^']+)',\s*routeId:\s*'([^']+)'\s*\}/g)) {
    entries.push({ href: row[1], routeId: row[2] });
  }
  return entries;
}

function extractSiteMapStealthPaths(source) {
  const arrayMatch = source.match(/export const marketingSiteMap[\s\S]*?=\s*\[([\s\S]*?)\n\];/);
  if (!arrayMatch) {
    throw new Error('Could not parse marketingSiteMap array');
  }

  const entries = [];
  const blocks = arrayMatch[1].split(/\n  \{/).slice(1);

  for (const block of blocks) {
    const href = block.match(/href:\s*'([^']+)'/)?.[1];
    const routeId = block.match(/routeId:\s*'([^']+)'/)?.[1];
    if (href && routeId) {
      entries.push({ href, routeId });
    }
  }

  return entries;
}

function normalizeHref(href) {
  if (!href || href === '/') {
    return '/';
  }
  return href.startsWith('/') ? href.replace(/\/$/, '') : `/${href.replace(/\/$/, '')}`;
}

function buildStealthRegistry(siteMapSource, supplementalSource) {
  const registry = new Map();
  for (const entry of [
    ...extractSiteMapStealthPaths(siteMapSource),
    ...extractSupplementalStealthPaths(supplementalSource),
  ]) {
    registry.set(normalizeHref(entry.href), entry.routeId);
  }
  return registry;
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

const stealthPathsSource = readUtf8('lib/marketing-stealth-paths.ts');
const stealthRegistry = buildStealthRegistry(siteMapSource, stealthPathsSource);
const createDraftPaths = extractCreateDraftPaths(appLocaleDir);
const middlewareSource = readUtf8('middleware.ts');

if (!middlewareSource.includes('shouldBlockUnpublishedMarketingPath')) {
  errors.push('middleware.ts must block unpublished stealth routes via shouldBlockUnpublishedMarketingPath');
}

for (const [href, pagePath] of createDraftPaths.entries()) {
  if (!stealthRegistry.has(normalizeHref(href))) {
    errors.push(
      `createDraft path "${href}" in ${path.relative(marketingRoot, pagePath)} must be registered in marketing-stealth-paths.ts (site map or supplemental list)`,
    );
  }
}

for (const href of ['/compliance', '/platform', '/draft', '/preview', '/impact', '/insights']) {
  if (!stealthRegistry.has(normalizeHref(href))) {
    errors.push(`assert-gated path "${href}" must be registered in marketing-stealth-paths.ts (via site map)`);
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
