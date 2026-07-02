import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import { Button } from '@/components/ui/button';

type InsightArticleCtaProps = {
  locale: string;
};

export async function InsightArticleCta({ locale }: InsightArticleCtaProps) {
  const t = await getTranslations('insights.article');

  return (
    <aside className="mt-16 rounded-2xl border border-[var(--forest-canopy)]/10 bg-[var(--warm-stone)] p-8 md:p-10">
      <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[var(--data-emerald)]">
        {t('ctaEyebrow')}
      </p>
      <h2 className="mb-3 text-2xl font-bold text-[var(--forest-canopy)] md:text-3xl">
        {t('ctaTitle')}
      </h2>
      <p className="mb-8 max-w-2xl text-base leading-relaxed text-gray-600 md:text-lg">
        {t('ctaDescription')}
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button
          asChild
          size="lg"
          className="rounded-full bg-[var(--data-emerald)] px-8 font-semibold text-[var(--forest-canopy)] hover:bg-emerald-400"
        >
          <Link href={`/${locale}/get-started?utm_source=insights&utm_medium=article_cta`}>
            {t('ctaPrimary')}
          </Link>
        </Button>
        <Button
          asChild
          size="lg"
          variant="outline"
          className="rounded-full border-[var(--forest-canopy)]/20 px-8 font-semibold text-[var(--forest-canopy)]"
        >
          <Link href={`/${locale}/pilot?utm_source=insights&utm_medium=article_cta`}>
            {t('ctaSecondary')}
          </Link>
        </Button>
      </div>
    </aside>
  );
}
