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
    <section className="px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">{t('title')}</h2>
            <p>{t('description')}</p>
          </div>
          <Link href={`/${locale}/insights`} className="text-sm underline">
            {t('viewAll')} →
          </Link>
        </div>
        {posts.length === 0 ? (
          <p>{t('empty')}</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {posts.map((post) => (
              <InsightsCard key={post.slug} post={post} locale={locale} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
