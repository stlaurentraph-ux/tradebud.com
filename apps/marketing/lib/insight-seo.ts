import type { Metadata } from 'next';

import type { Locale } from '@/i18n.config';
import {
  getInsightCategoryLabel,
  getInsightPosts,
  type InsightPost,
} from '@/lib/insights';
import { marketingAbsoluteUrl, marketingLocalePath, MARKETING_SITE_ORIGIN } from '@/lib/marketing-site-url';
import { isRouteFlagPublished } from '@/lib/marketing-publication';

const DEFAULT_INSIGHT_OG_IMAGE = '/images/placeholders/hero-insights.png';
const PUBLISHER_LOGO = '/tracebud-logo-v6.png';

export function insightArticlePath(locale: string, slug: string): string {
  return marketingLocalePath(locale, `/insights/${slug}`);
}

export function insightArticleAbsoluteUrl(locale: string, slug: string): string {
  return marketingAbsoluteUrl(locale, `/insights/${slug}`);
}

export function insightArticleOgImagePath(locale: string, slug: string): string {
  return marketingLocalePath(locale, `/insights/${slug}/opengraph-image`);
}

export function insightArticleOgImageUrl(locale: string, slug: string): string {
  return marketingAbsoluteUrl(locale, `/insights/${slug}/opengraph-image`);
}

export function insightsHubOgImageUrl(locale: string): string {
  return marketingAbsoluteUrl(locale, '/insights/opengraph-image');
}

export function resolveInsightImageUrl(heroImage?: string): string {
  const path = heroImage?.trim() || DEFAULT_INSIGHT_OG_IMAGE;
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  return `${MARKETING_SITE_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`;
}

type InsightSeoPost = Pick<
  InsightPost,
  | 'slug'
  | 'title'
  | 'description'
  | 'category'
  | 'tags'
  | 'publishedAt'
  | 'updatedAt'
  | 'author'
  | 'heroImage'
>;

export function buildInsightBlogPostingJsonLd(post: InsightSeoPost, locale: string) {
  const url = insightArticleAbsoluteUrl(locale, post.slug);
  const image = insightArticleOgImageUrl(locale, post.slug);

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    image: [image],
    datePublished: post.publishedAt,
    dateModified: post.updatedAt ?? post.publishedAt,
    author: {
      '@type': 'Organization',
      name: post.author,
      url: MARKETING_SITE_ORIGIN,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Tracebud',
      logo: {
        '@type': 'ImageObject',
        url: `${MARKETING_SITE_ORIGIN}${PUBLISHER_LOGO}`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    url,
    articleSection: getInsightCategoryLabel(post.category),
    keywords: post.tags.length > 0 ? post.tags.join(', ') : undefined,
  };
}

export function buildInsightArticleMetadata(
  post: InsightSeoPost,
  locale: string,
  options: { noIndex: boolean },
): Metadata {
  const canonicalPath = insightArticlePath(locale, post.slug);
  const ogImage = insightArticleOgImageUrl(locale, post.slug);

  return {
    title: `${post.title} | Tracebud Insights`,
    description: post.description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      type: 'article',
      url: insightArticleAbsoluteUrl(locale, post.slug),
      title: post.title,
      description: post.description,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt ?? post.publishedAt,
      section: getInsightCategoryLabel(post.category),
      tags: post.tags,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: [ogImage],
    },
    robots: options.noIndex ? { index: false, follow: false } : { index: true, follow: true },
  };
}

export function buildInsightsHubMetadata(locale: string, options: { noIndex: boolean }): Metadata {
  const title = 'Insights | Tracebud';
  const description =
    'Regulatory guidance, field notes, and playbooks for EUDR traceability across the supply chain.';
  const canonicalPath = marketingLocalePath(locale, '/insights');

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      type: 'website',
      url: marketingAbsoluteUrl(locale, '/insights'),
      title,
      description,
      images: [
        {
          url: insightsHubOgImageUrl(locale),
          width: 1200,
          height: 630,
          alt: 'Tracebud Insights',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [insightsHubOgImageUrl(locale)],
    },
    robots: options.noIndex ? { index: false, follow: false } : { index: true, follow: true },
  };
}

export type InsightSitemapEntry = {
  locale: Locale;
  slug: string;
  lastModified: Date;
};

/** Non-draft insights included in sitemap once insights routes are published (Stage B). */
export function getIndexableInsightSitemapEntries(): InsightSitemapEntry[] {
  if (!isRouteFlagPublished('insights') || !isRouteFlagPublished('insights-article')) {
    return [];
  }

  const locales: Locale[] = ['en'];
  const entries: InsightSitemapEntry[] = [];

  for (const locale of locales) {
    for (const post of getInsightPosts(locale, { includeDrafts: false })) {
      entries.push({
        locale,
        slug: post.slug,
        lastModified: new Date(post.updatedAt ?? post.publishedAt),
      });
    }
  }

  return entries;
}

export function insightsHubIsIndexable(): boolean {
  return isRouteFlagPublished('insights');
}
