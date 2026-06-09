import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import { InsightsCard } from '@/components/insights/insights-card';
import type { Locale } from '@/i18n.config';
import { getInsightPosts } from '@/lib/insights';

type LatestInsightsProps = {
  locale: string;
  limit?: number;
};

export async function LatestInsights({ locale, limit = 3 }: LatestInsightsProps) {
  const t = await getTranslations('homeV2.latestInsights');
  const posts = getInsightPosts(locale as Locale, { includeDrafts: true }).slice(0, limit);

  return (
    <section className="bg-[var(--warm-stone)] px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-[var(--data-emerald)]">
              Insights
            </p>
            <h2 className="text-3xl font-bold text-[var(--forest-canopy)] text-balance md:text-4xl">
              {t('title')}
            </h2>
            <p className="mt-2 text-gray-600">{t('description')}</p>
          </div>
          <Link
            href={`/${locale}/insights`}
            className="shrink-0 text-sm font-semibold text-[var(--data-emerald)] hover:underline"
          >
            {t('viewAll')} →
          </Link>
        </div>

        {posts.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[var(--warm-stone-dark)] bg-white p-8 text-gray-500">
            {t('empty')}
          </p>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {posts.map((post) => (
              <InsightsCard key={post.slug} post={post} locale={locale} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
