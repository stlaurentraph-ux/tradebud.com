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
      <article className="bg-white px-6 pb-20 pt-28 md:pt-32">
        <div className="mx-auto max-w-3xl">
          <Link
            href={`/${locale}/insights`}
            className="mb-8 inline-flex text-sm font-medium text-[var(--data-emerald)] hover:underline"
          >
            ← Back to Insights
          </Link>

          <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--data-emerald)]">
            {getInsightCategoryLabel(post.category)}
          </p>
          <h1 className="mb-4 text-4xl font-bold text-[var(--forest-canopy)] md:text-5xl">
            {post.title}
          </h1>
          <p className="mb-6 text-xl text-gray-600">{post.description}</p>
          <div className="mb-10 flex flex-wrap items-center gap-3 text-sm text-gray-500">
            <span>{post.author}</span>
            <span aria-hidden>·</span>
            <time dateTime={post.publishedAt}>
              {new Date(post.publishedAt).toLocaleDateString(locale, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
          </div>

          {post.heroImage ? (
            <div className="relative mb-10 aspect-[16/9] overflow-hidden rounded-2xl">
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
        </div>
      </article>
    </MarketingPageLayout>
  );
}
