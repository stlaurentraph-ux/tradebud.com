import Link from 'next/link';

import { getInsightCategoryLabel, type InsightSummary } from '@/lib/insights';

type InsightsCardProps = {
  post: InsightSummary;
  locale: string;
};

export function InsightsCard({ post, locale }: InsightsCardProps) {
  return (
    <article className="group flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--data-emerald)]">
        {getInsightCategoryLabel(post.category)}
      </p>
      <h2 className="mb-3 text-xl font-bold text-[var(--forest-canopy)] group-hover:text-[var(--forest-light)]">
        <Link href={`/${locale}/insights/${post.slug}`}>{post.title}</Link>
      </h2>
      <p className="mb-6 flex-1 text-gray-600">{post.description}</p>
      <div className="flex items-center justify-between text-sm text-gray-500">
        <time dateTime={post.publishedAt}>
          {new Date(post.publishedAt).toLocaleDateString(locale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </time>
        <Link
          href={`/${locale}/insights/${post.slug}`}
          className="font-medium text-[var(--data-emerald)] hover:underline"
        >
          Read →
        </Link>
      </div>
    </article>
  );
}
