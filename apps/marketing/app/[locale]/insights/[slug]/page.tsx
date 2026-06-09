import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

import { MarkdownContent } from '@/components/marketing/markdown-content';
import { MarketingPageLayout } from '@/components/marketing/marketing-page-layout';
import { type Locale } from '@/i18n.config';
import { getInsightCategoryLabel, getInsightPostBySlug, getInsightSlugs } from '@/lib/insights';
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

  return {
    title: `${post.title} | Tracebud Insights`,
    description: post.description,
    alternates: {
      canonical: `/${locale}/insights/${post.slug}`,
    },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.description,
      publishedTime: post.publishedAt,
      images: post.heroImage ? [{ url: post.heroImage }] : undefined,
    },
    robots: noIndex ? { index: false, follow: false } : { index: true, follow: true },
  };
}

export default async function InsightArticlePage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  await assertMarketingRoutePublished('insights-article');

  const post = getInsightPostBySlug(slug, locale as Locale, { includeDrafts: true });
  if (!post) {
    notFound();
  }

  return (
    <MarketingPageLayout routeId="insights-article">
      {/* Article hero */}
      <section className="bg-[var(--forest-canopy)] px-6 pb-16 pt-28 md:pt-36">
        <div className="mx-auto max-w-3xl">
          <Link
            href={`/${locale}/insights`}
            className="mb-8 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white ring-1 ring-white/20 transition-colors hover:bg-white/20"
          >
            ← Back to Insights
          </Link>

          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-[var(--data-emerald)]">
            {getInsightCategoryLabel(post.category)}
          </p>
          <h1 className="mb-5 text-4xl font-bold leading-tight text-white text-balance md:text-5xl">
            {post.title}
          </h1>
          <p className="mb-8 text-xl leading-relaxed text-white/80">{post.description}</p>

          {/* Author + date chip */}
          <div className="flex flex-wrap items-center gap-3 text-sm text-white/60">
            <span className="font-medium text-white/80">{post.author}</span>
            <span aria-hidden className="text-white/30">·</span>
            <time dateTime={post.publishedAt}>
              {new Date(post.publishedAt).toLocaleDateString(locale, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
          </div>
        </div>
      </section>

      {/* Article body */}
      <article className="bg-white px-6 py-16">
        <div className="mx-auto max-w-3xl">
          {post.heroImage ? (
            <div className="relative mb-12 aspect-[16/9] overflow-hidden rounded-2xl">
              <Image
                src={post.heroImage}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 768px"
              />
            </div>
          ) : null}

          <MarkdownContent content={post.body} />

          {/* Footer nav */}
          <div className="mt-16 border-t border-[var(--warm-stone-dark)] pt-8">
            <Link
              href={`/${locale}/insights`}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--data-emerald)] hover:underline"
            >
              ← All Insights
            </Link>
          </div>
        </div>
      </article>
    </MarketingPageLayout>
  );
}
