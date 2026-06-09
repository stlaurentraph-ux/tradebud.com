import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

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
      <section className="bg-[var(--warm-stone)] px-6 pb-20 pt-28 md:pt-32">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 max-w-3xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--data-emerald)]">
              {t('eyebrow')}
            </p>
            <h1 className="mb-4 text-4xl font-bold text-[var(--forest-canopy)] md:text-5xl">
              {t('title')}
            </h1>
            <p className="text-lg text-gray-600 md:text-xl">{t('description')}</p>
          </div>

          {posts.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-gray-600">
              {t('empty')}
            </p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <InsightsCard key={post.slug} post={post} locale={locale} />
              ))}
            </div>
          )}
        </div>
      </section>
    </MarketingPageLayout>
  );
}
