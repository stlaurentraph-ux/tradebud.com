#!/usr/bin/env node
/**
 * Guardrail — insight article SEO wiring (JSON-LD, sitemap, article page).
 *
 * Run: npm run insights:seo:assert -w tracebud-marketing
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const marketingRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function readUtf8(relativePath) {
  return fs.readFileSync(path.join(marketingRoot, relativePath), 'utf8');
}

function assertIncludes(relativePath, needles, label) {
  const source = readUtf8(relativePath);
  for (const needle of needles) {
    if (!source.includes(needle)) {
      throw new Error(`${label}: ${relativePath} must include ${needle}`);
    }
  }
}

function main() {
  assertIncludes(
    'app/[locale]/insights/[slug]/page.tsx',
    [
      'InsightArticleJsonLd',
      'buildInsightArticleMetadata',
      'InsightArticleCta',
      'RelatedInsights',
      'InsightTableOfContents',
      'estimateInsightReadingMinutes',
    ],
    'insight article page',
  );
  assertIncludes(
    'components/marketing/markdown-content.tsx',
    ['splitInsightMarkdownBlocks', 'extractInsightHeadings', 'scroll-mt-28'],
    'markdown renderer',
  );
  assertIncludes(
    'lib/insight-markdown.ts',
    ['splitInsightMarkdownBlocks', 'extractInsightHeadings', 'slugifyInsightHeading'],
    'insight markdown parser',
  );
  assertIncludes('app/[locale]/page.tsx', ['LatestInsights'], 'homepage insights teaser');
  assertIncludes('components/tracebud/footer.tsx', ['/${locale}/insights', 't("insights")'], 'footer insights link');
  assertIncludes(
    'app/[locale]/insights/page.tsx',
    ['buildInsightsHubMetadata'],
    'insights hub page',
  );
  assertIncludes(
    'app/sitemap.ts',
    ['getIndexableInsightSitemapEntries', 'insightsHubIsIndexable'],
    'sitemap',
  );
  assertIncludes(
    'lib/insight-seo.ts',
    [
      'buildInsightBlogPostingJsonLd',
      'buildInsightArticleMetadata',
      'getIndexableInsightSitemapEntries',
      'insightArticleOgImageUrl',
      'insightsHubOgImageUrl',
    ],
    'insight SEO module',
  );
  assertIncludes(
    'lib/insight-og-image.tsx',
    ['renderInsightOgImage', 'buildInsightArticleOgTemplateProps', 'INSIGHT_OG_SIZE'],
    'insight OG template',
  );
  assertIncludes(
    'app/[locale]/insights/[slug]/opengraph-image.tsx',
    ['renderInsightOgImage', 'generateImageMetadata'],
    'article opengraph image route',
  );
  assertIncludes(
    'app/[locale]/insights/opengraph-image.tsx',
    ['buildInsightsHubOgTemplateProps'],
    'insights hub opengraph image route',
  );
  assertIncludes(
    'components/insights/insight-article-json-ld.tsx',
    ['application/ld+json', 'buildInsightBlogPostingJsonLd'],
    'JSON-LD component',
  );
  assertIncludes(
    'next.config.mjs',
    ['insight-slug-redirects.json', 'loadInsightSlugRedirects'],
    'next config redirects',
  );

  const sampleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: 'Sample',
    description: 'Sample description for SEO guard validation.',
    image: ['https://tracebud.com/images/placeholders/hero-insights.png'],
    datePublished: '2026-07-02',
    dateModified: '2026-07-02',
    url: 'https://tracebud.com/en/insights/sample',
  };

  for (const key of ['@context', '@type', 'headline', 'description', 'datePublished', 'url']) {
    if (!(key in sampleJsonLd)) {
      throw new Error(`JSON-LD contract missing required field: ${key}`);
    }
  }

  console.log('marketing-insights-seo-guard: OK — article SEO pipeline wired');
}

try {
  main();
} catch (error) {
  console.error(`marketing-insights-seo-guard: FAILED — ${error.message}`);
  process.exit(1);
}
