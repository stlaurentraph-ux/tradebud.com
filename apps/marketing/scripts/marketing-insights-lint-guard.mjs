#!/usr/bin/env node
/**
 * Guardrail 1.M.4 — insights markdown frontmatter, slug rules, internal links.
 *
 * Run: npm run insights:lint:assert -w tracebud-marketing
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const marketingRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const insightsDir = path.join(marketingRoot, 'content/insights');

const INSIGHT_CATEGORIES = [
  'regulation',
  'field-notes',
  'technology',
  'playbooks',
  'product',
  'compare',
  'impact',
];

const LOCALES = ['en', 'fr', 'es', 'pt', 'id', 'vi', 'de', 'nl', 'it', 'am', 'no'];

const REQUIRED_FIELDS = ['title', 'description', 'category', 'locale', 'publishedAt', 'author', 'draft'];

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function readUtf8(relativePath) {
  return fs.readFileSync(path.join(marketingRoot, relativePath), 'utf8');
}

function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    throw new Error('missing frontmatter delimiters (---)');
  }

  const data = {};
  for (const line of match[1].split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) continue;
    const key = trimmed.slice(0, colonIndex).trim();
    let value = trimmed.slice(colonIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    data[key] = value;
  }

  return { data, body: match[2] };
}

function loadStaticHrefs() {
  const source = readUtf8('lib/marketing-site-map.ts');
  return new Set([...source.matchAll(/href:\s*'([^']+)'/g)].map((match) => match[1]));
}

function assertDate(value, label) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`${label} must be YYYY-MM-DD (got "${value}")`);
  }
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    throw new Error(`${label} is not a valid date (got "${value}")`);
  }
}

function extractMarkdownLinks(body) {
  return [...body.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)].map((match) => match[1].trim());
}

function validateInsightFile(filename, staticHrefs, allSlugs) {
  const slug = filename.replace(/\.md$/, '');
  const fileLabel = `content/insights/${filename}`;

  if (!SLUG_PATTERN.test(slug)) {
    throw new Error(`${fileLabel}: slug/filename must be kebab-case (${slug})`);
  }

  const raw = fs.readFileSync(path.join(insightsDir, filename), 'utf8');
  const { data, body } = parseFrontmatter(raw);

  if (data.slug && data.slug !== slug) {
    throw new Error(`${fileLabel}: frontmatter slug "${data.slug}" must match filename "${slug}"`);
  }

  for (const field of REQUIRED_FIELDS) {
    if (!data[field]?.trim()) {
      throw new Error(`${fileLabel}: missing required frontmatter field "${field}"`);
    }
  }

  if (!INSIGHT_CATEGORIES.includes(data.category.trim())) {
    throw new Error(
      `${fileLabel}: invalid category "${data.category}" (expected one of ${INSIGHT_CATEGORIES.join(', ')})`,
    );
  }

  if (!LOCALES.includes(data.locale.trim())) {
    throw new Error(`${fileLabel}: invalid locale "${data.locale}"`);
  }

  assertDate(data.publishedAt.trim(), `${fileLabel} publishedAt`);
  if (data.updatedAt?.trim()) {
    assertDate(data.updatedAt.trim(), `${fileLabel} updatedAt`);
  }

  if (!['true', 'false'].includes(data.draft.trim())) {
    throw new Error(`${fileLabel}: draft must be "true" or "false"`);
  }

  if (data.heroImage?.trim() && !data.heroImage.trim().startsWith('/')) {
    throw new Error(`${fileLabel}: heroImage must be a root-relative path`);
  }

  for (const href of extractMarkdownLinks(body)) {
    if (/^(https?:|mailto:|#)/.test(href)) continue;

    const insightMatch = href.match(/^\/insights\/([^/?#]+)$/);
    if (insightMatch) {
      if (!allSlugs.has(insightMatch[1])) {
        throw new Error(`${fileLabel}: link "${href}" points to unknown insight slug`);
      }
      continue;
    }

    const localizedInsightMatch = href.match(/^\/([a-z]{2})\/insights\/([^/?#]+)$/);
    if (localizedInsightMatch) {
      const [, locale, linkedSlug] = localizedInsightMatch;
      if (!LOCALES.includes(locale)) {
        throw new Error(`${fileLabel}: link "${href}" uses unknown locale`);
      }
      if (!allSlugs.has(linkedSlug)) {
        throw new Error(`${fileLabel}: link "${href}" points to unknown insight slug`);
      }
      continue;
    }

    if (href.startsWith('/')) {
      if (!staticHrefs.has(href)) {
        throw new Error(`${fileLabel}: internal link "${href}" is not in marketing-site-map hrefs`);
      }
      continue;
    }

    throw new Error(`${fileLabel}: unsupported relative link "${href}" (use root-relative /paths)`);
  }
}

function main() {
  if (!fs.existsSync(insightsDir)) {
    throw new Error(`Missing insights directory: ${insightsDir}`);
  }

  const files = fs.readdirSync(insightsDir).filter((name) => name.endsWith('.md')).sort();
  if (files.length === 0) {
    throw new Error('No insight markdown files found');
  }

  const slugCounts = new Map();
  for (const filename of files) {
    const slug = filename.replace(/\.md$/, '');
    slugCounts.set(slug, (slugCounts.get(slug) ?? 0) + 1);
  }
  const duplicates = [...slugCounts.entries()].filter(([, count]) => count > 1);
  if (duplicates.length) {
    throw new Error(`Duplicate insight slugs: ${duplicates.map(([slug]) => slug).join(', ')}`);
  }

  const allSlugs = new Set(files.map((filename) => filename.replace(/\.md$/, '')));
  const staticHrefs = loadStaticHrefs();
  staticHrefs.add('/insights');

  for (const filename of files) {
    validateInsightFile(filename, staticHrefs, allSlugs);
  }

  console.log(`marketing-insights-lint: OK — ${files.length} insight articles validated`);
}

try {
  main();
} catch (error) {
  console.error(`marketing-insights-lint: FAILED — ${error.message}`);
  process.exit(1);
}
