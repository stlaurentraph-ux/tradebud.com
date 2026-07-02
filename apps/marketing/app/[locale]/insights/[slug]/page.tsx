import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { InsightArticleCta } from '@/components/insights/insight-article-cta';
import { InsightArticleJsonLd } from '@/components/insights/insight-article-json-ld';
import { InsightTableOfContents } from '@/components/insights/insight-table-of-contents';
import { RelatedInsights } from '@/components/insights/related-insights';
import { MarkdownContent } from '@/components/marketing/markdown-content';
import { MarketingPageLayout } from '@/components/marketing/marketing-page-layout';
import { type Locale } from '@/i18n.config';
import { buildInsightArticleMetadata } from '@/lib/insight-seo';
import {
  estimateInsightReadingMinutes,
  getInsightCategoryLabel,
  getInsightPostBySlug,
  getInsightSlugs,
} from '@/lib/insights';
import {
  assertMarketingRoutePublished,
  shouldNoIndexMarketingRoute,
} from '@/lib/marketing-publication';

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateStaticParams() {
  const locales: Locale[] = ['en'];
  return locales.flatMap((locale) =>
    getInsightSlugs(locale, { includeDrafts: true }).map((slug) => ({ locale, slug })),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = getInsightPostBySlug(slug, locale as Locale, { includeDrafts: true });
  const noIndex = await shouldNoIndexMarketingRoute('insights-article');

  if (!post) {
    return { title: 'Insight not found | Tracebud' };
  }

  return buildInsightArticleMetadata(post, locale, { noIndex });
}

export default async function InsightArticlePage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  await assertMarketingRoutePublished('insights-article');

  const t = await getTranslations('insights.article');
  const post = getInsightPostBySlug(slug, locale as Locale, { includeDrafts: true });
  if (!post) {
    notFound();
  }

  const readingMinutes = estimateInsightReadingMinutes(post.body);

  return (
    <MarketingPageLayout routeId="insights-article">
      <InsightArticleJsonLd post={post} locale={locale} />
      <section className="bg-[var(--forest-canopy)] px-6 pb-16 pt-28 md:pt-36">
        <div className="mx-auto max-w-3xl">
          <Link
            href={`/${locale}/insights`}
            className="mb-8 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white ring-1 ring-white/20 transition-colors hover:bg-white/20"
          >
            ← {t('backToInsights')}
          </Link>

          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-[var(--data-emerald)]">
            {getInsightCategoryLabel(post.category)}
          </p>
          <h1 className="mb-5 text-balance text-4xl font-bold leading-tight text-white md:text-5xl">
            {post.title}
          </h1>
          <p className="mb-8 text-xl leading-relaxed text-white/80">{post.description}</p>

          <div className="flex flex-wrap items-center gap-3 text-sm text-white/60">
            <span className="font-medium text-white/80">{post.author}</span>
            <span aria-hidden className="text-white/30">
              ·
            </span>
            <time dateTime={post.publishedAt}>
              {new Date(post.publishedAt).toLocaleDateString(locale, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
            <span aria-hidden className="text-white/30">
              ·
            </span>
            <span>{t('readingTime', { minutes: readingMinutes })}</span>
            {post.updatedAt && post.updatedAt !== post.publishedAt ? (
              <>
                <span aria-hidden className="text-white/30">
                  ·
                </span>
                <span>
                  {t('updated')}{' '}
                  <time dateTime={post.updatedAt}>
                    {new Date(post.updatedAt).toLocaleDateString(locale, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </time>
                </span>
              </>
            ) : null}
          </div>
        </div>
      </section>

      <article className="bg-white px-6 py-16">
        <div className="mx-auto max-w-6xl lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12 xl:grid-cols-[240px_minmax(0,1fr)]">
          <InsightTableOfContents content={post.body} variant="sidebar" />

          <div className="min-w-0 max-w-3xl lg:max-w-none">
            <div className="relative mb-12 aspect-[16/9] overflow-hidden rounded-2xl shadow-md">
              <Image
                src={post.heroImage ?? '/images/placeholders/hero-insights.png'}
                alt={post.title}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 768px"
                priority
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"
              />
            </div>

            <InsightTableOfContents content={post.body} variant="inline" />
            <MarkdownContent content={post.body} />

            <InsightArticleCta locale={locale} />
            <RelatedInsights locale={locale} slug={slug} />

            <div className="mt-12 border-t border-[var(--warm-stone-dark)] pt-8">
              <Link
                href={`/${locale}/insights`}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--data-emerald)] hover:underline"
              >
                ← {t('allInsights')}
              </Link>
            </div>
          </div>
        </div>
      </article>
    </MarketingPageLayout>
  );
}
