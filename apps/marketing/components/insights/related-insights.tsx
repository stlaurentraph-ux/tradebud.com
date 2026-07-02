import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import { InsightsCard } from '@/components/insights/insights-card';
import type { Locale } from '@/i18n.config';
import { getRelatedInsightPosts } from '@/lib/insights';

type RelatedInsightsProps = {
  locale: string;
  slug: string;
  limit?: number;
};

export async function RelatedInsights({ locale, slug, limit = 3 }: RelatedInsightsProps) {
  const t = await getTranslations('insights.article');
  const related = getRelatedInsightPosts(slug, locale as Locale, {
    includeDrafts: true,
    limit,
  });

  if (related.length === 0) {
    return null;
  }

  return (
    <section className="mt-16 border-t border-[var(--warm-stone-dark)] pt-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[var(--data-emerald)]">
            {t('relatedEyebrow')}
          </p>
          <h2 className="text-2xl font-bold text-[var(--forest-canopy)] md:text-3xl">
            {t('relatedTitle')}
          </h2>
        </div>
        <Link
          href={`/${locale}/insights`}
          className="text-sm font-semibold text-[var(--data-emerald)] hover:underline"
        >
          {t('viewAll')} →
        </Link>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {related.map((post, index) => (
          <InsightsCard key={post.slug} post={post} locale={locale} index={index} />
        ))}
      </div>
    </section>
  );
}
