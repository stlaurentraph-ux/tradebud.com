import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import Image from 'next/image';

import { InsightsCard } from '@/components/insights/insights-card';
import { MarketingPageLayout } from '@/components/marketing/marketing-page-layout';
import { type Locale } from '@/i18n.config';
import { getInsightPosts } from '@/lib/insights';
import {
  assertMarketingRoutePublished,
  shouldNoIndexMarketingRoute,
} from '@/lib/marketing-publication';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const noIndex = await shouldNoIndexMarketingRoute('insights');

  return {
    title: 'Insights | Tracebud',
    description:
      'Regulatory guidance, field notes, and playbooks for EUDR traceability across the supply chain.',
    alternates: {
      canonical: `/${locale}/insights`,
    },
    robots: noIndex ? { index: false, follow: false } : { index: true, follow: true },
  };
}

export default async function InsightsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  await assertMarketingRoutePublished('insights');

  const t = await getTranslations('insights');
  const posts = getInsightPosts(locale as Locale, { includeDrafts: true });

  return (
    <MarketingPageLayout routeId="insights">
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-[var(--forest-canopy)] px-6 pb-20 pt-28 md:pt-36">
        <Image
          src="/images/placeholders/hero-insights.png"
          alt=""
          fill
          className="absolute inset-0 -z-10 object-cover opacity-20"
          sizes="100vw"
          priority
        />
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-b from-[var(--forest-canopy)]/70 via-[var(--forest-canopy)]/85 to-[var(--forest-canopy)]" />
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--data-emerald)]/30 bg-[var(--data-emerald)]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[var(--data-emerald)]">
              {t('eyebrow')}
            </p>
            <h1 className="mb-4 text-balance text-4xl font-bold leading-tight text-white md:text-5xl">
              {t('title')}
            </h1>
            <p className="text-lg leading-relaxed text-white/75 md:text-xl">{t('description')}</p>
          </div>
        </div>
      </section>

      {/* Count strip */}
      <div className="border-b border-[var(--warm-stone-dark)] bg-white px-6 py-4">
        <p className="mx-auto max-w-7xl text-sm text-gray-500">
          {posts.length === 0
            ? 'No articles yet'
            : `${posts.length} article${posts.length === 1 ? '' : 's'}`}
        </p>
      </div>

      {/* Grid */}
      <section className="bg-[var(--warm-stone)] px-6 py-16">
        <div className="mx-auto max-w-7xl">
          {posts.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-[var(--warm-stone-dark)] bg-white p-10 text-center text-gray-500">
              {t('empty')}
            </p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post, i) => (
                <InsightsCard key={post.slug} post={post} locale={locale} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>
    </MarketingPageLayout>
  );
}
