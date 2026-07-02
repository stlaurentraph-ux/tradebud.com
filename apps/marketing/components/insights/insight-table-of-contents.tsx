import { getTranslations } from 'next-intl/server';

import { extractInsightHeadings } from '@/lib/insight-markdown';

type InsightTableOfContentsProps = {
  content: string;
  variant?: 'sidebar' | 'inline';
};

const MIN_HEADINGS = 3;

export async function InsightTableOfContents({
  content,
  variant = 'sidebar',
}: InsightTableOfContentsProps) {
  const t = await getTranslations('insights.article');
  const headings = extractInsightHeadings(content).filter((heading) => heading.level === 2);

  if (headings.length < MIN_HEADINGS) {
    return null;
  }

  const navClass =
    variant === 'sidebar'
      ? 'sticky top-28 hidden lg:block'
      : 'mb-10 rounded-2xl border border-[var(--warm-stone-dark)] bg-[var(--warm-stone)] p-5 lg:hidden';

  return (
    <nav aria-label={t('tocLabel')} className={navClass}>
      <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[var(--data-emerald)]">
        {t('tocTitle')}
      </p>
      <ol className="space-y-2 text-sm">
        {headings.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              className="block rounded-md px-2 py-1.5 text-gray-600 transition-colors hover:bg-white hover:text-[var(--forest-canopy)]"
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
