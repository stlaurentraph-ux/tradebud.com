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
    <section className="border-t border-[var(--warm-stone-dark)] bg-white px-6 py-20">
      <div className="mx-auto max-w-5xl">

        {/* Header row */}
        <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[var(--data-emerald)]">
              Insights
            </p>
            <h2 className="text-balance text-3xl font-bold text-[var(--forest-canopy)] md:text-4xl">
              {t('title')}
            </h2>
            <p className="mt-3 max-w-xl text-gray-500">{t('description')}</p>
          </div>
          <Link
            href={`/${locale}/insights`}
            className="shrink-0 inline-flex items-center gap-1 rounded-full border border-[var(--warm-stone-dark)] bg-[var(--warm-stone)] px-5 py-2.5 text-sm font-semibold text-[var(--forest-canopy)] transition-colors hover:bg-[var(--warm-stone-dark)]"
          >
            {t('viewAll')} →
          </Link>
        </div>

        {/* Cards */}
        {posts.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[var(--warm-stone-dark)] bg-[var(--warm-stone)] py-16 text-center">
            <p className="text-gray-500">{t('empty')}</p>
            <p className="text-xs text-gray-400">
              Add markdown files to{' '}
              <code className="rounded bg-[var(--warm-stone-dark)] px-1 py-0.5 font-mono">
                content/insights/
              </code>{' '}
              to populate this section.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {posts.map((post, i) => (
              <InsightsCard key={post.slug} post={post} locale={locale} index={i} />
            ))}
          </div>
        )}

      </div>
    </section>
  );
}
