import fs from 'node:fs';
import path from 'node:path';

import type { Locale } from '@/i18n.config';
import { parseFrontmatter, parseTags } from '@/lib/markdown';

export const INSIGHT_CATEGORIES = [
  'regulation',
  'field-notes',
  'technology',
  'playbooks',
  'product',
  'compare',
  'impact',
] as const;

export type InsightCategory = (typeof INSIGHT_CATEGORIES)[number];

export type InsightPost = {
  slug: string;
  title: string;
  description: string;
  category: InsightCategory;
  tags: string[];
  locale: Locale;
  publishedAt: string;
  updatedAt?: string;
  author: string;
  heroImage?: string;
  draft: boolean;
  body: string;
};

export type InsightSummary = Omit<InsightPost, 'body'>;

const INSIGHTS_DIR = path.join(process.cwd(), 'content/insights');

function isInsightCategory(value: string): value is InsightCategory {
  return (INSIGHT_CATEGORIES as readonly string[]).includes(value);
}

function parseInsightFile(filename: string, raw: string): InsightPost | null {
  const { data, body } = parseFrontmatter(raw);
  const slug = filename.replace(/\.md$/, '');

  const title = data.title?.trim();
  const description = data.description?.trim();
  const category = data.category?.trim() ?? 'regulation';
  const locale = (data.locale?.trim() ?? 'en') as Locale;
  const publishedAt = data.publishedAt?.trim();
  const author = data.author?.trim() ?? 'Tracebud Team';

  if (!title || !description || !publishedAt || !isInsightCategory(category)) {
    return null;
  }

  return {
    slug,
    title,
    description,
    category,
    tags: parseTags(data.tags),
    locale,
    publishedAt,
    updatedAt: data.updatedAt?.trim(),
    author,
    heroImage: data.heroImage?.trim(),
    draft: data.draft === 'true',
    body,
  };
}

function readAllInsightPosts(): InsightPost[] {
  if (!fs.existsSync(INSIGHTS_DIR)) {
    return [];
  }

  const files = fs
    .readdirSync(INSIGHTS_DIR)
    .filter((name) => name.endsWith('.md'))
    .sort();

  const posts: InsightPost[] = [];
  for (const filename of files) {
    const raw = fs.readFileSync(path.join(INSIGHTS_DIR, filename), 'utf8');
    const post = parseInsightFile(filename, raw);
    if (post) {
      posts.push(post);
    }
  }

  return posts.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

function toSummary(post: InsightPost): InsightSummary {
  const { body: _body, ...summary } = post;
  return summary;
}

export function getInsightPosts(locale: Locale, options?: { includeDrafts?: boolean }): InsightSummary[] {
  const includeDrafts = options?.includeDrafts ?? false;

  return readAllInsightPosts()
    .filter((post) => post.locale === locale)
    .filter((post) => includeDrafts || !post.draft)
    .map(toSummary);
}

export function getInsightPostBySlug(
  slug: string,
  locale: Locale,
  options?: { includeDrafts?: boolean },
): InsightPost | null {
  const includeDrafts = options?.includeDrafts ?? false;
  const post = readAllInsightPosts().find((entry) => entry.slug === slug && entry.locale === locale);

  if (!post || (!includeDrafts && post.draft)) {
    return null;
  }

  return post;
}

export function getInsightSlugs(locale: Locale, options?: { includeDrafts?: boolean }): string[] {
  return getInsightPosts(locale, options).map((post) => post.slug);
}

export function getInsightCategoryLabel(category: InsightCategory): string {
  const labels: Record<InsightCategory, string> = {
    regulation: 'Regulation & EUDR',
    'field-notes': 'Field notes',
    technology: 'Technology',
    playbooks: 'Playbooks',
    product: 'Product updates',
    compare: 'Comparisons',
    impact: 'Impact',
  };
  return labels[category];
}
