import Image from 'next/image';
import Link from 'next/link';

import { getInsightCategoryLabel, type InsightSummary } from '@/lib/insights';

const PLACEHOLDER_IMAGES = [
  '/images/placeholders/hero-farmer.png',
  '/images/placeholders/hero-forest.png',
  '/images/placeholders/hero-supply-chain.png',
  '/images/placeholders/hero-insights.png',
];

type InsightsCardProps = {
  post: InsightSummary;
  locale: string;
  index?: number;
};

export function InsightsCard({ post, locale, index = 0 }: InsightsCardProps) {
  const imageSrc = post.heroImage ?? PLACEHOLDER_IMAGES[index % PLACEHOLDER_IMAGES.length];

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative h-44 w-full overflow-hidden bg-[var(--warm-stone)]">
        <Image
          src={imageSrc}
          alt=""
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        <span className="absolute left-4 top-4 inline-flex items-center rounded-full bg-[var(--forest-canopy)]/80 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[var(--data-emerald)] backdrop-blur-sm">
          {getInsightCategoryLabel(post.category)}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h2 className="mb-3 text-lg font-bold leading-snug text-[var(--forest-canopy)] group-hover:text-[var(--forest-light)]">
          <Link
            href={`/${locale}/insights/${post.slug}`}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--data-emerald)]"
          >
            {post.title}
          </Link>
        </h2>
        <p className="mb-6 flex-1 text-sm leading-relaxed text-gray-600">{post.description}</p>

        <div className="flex items-center justify-between border-t border-gray-100 pt-4 text-sm">
          <div className="flex flex-col gap-0.5">
            <span className="font-medium text-gray-700">{post.author}</span>
            <time dateTime={post.publishedAt} className="text-xs text-gray-400">
              {new Date(post.publishedAt).toLocaleDateString(locale, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
          </div>
          <Link
            href={`/${locale}/insights/${post.slug}`}
            className="inline-flex items-center gap-1 font-semibold text-[var(--data-emerald)] hover:underline"
            aria-label={`Read ${post.title}`}
          >
            Read →
          </Link>
        </div>
      </div>
    </article>
  );
}
