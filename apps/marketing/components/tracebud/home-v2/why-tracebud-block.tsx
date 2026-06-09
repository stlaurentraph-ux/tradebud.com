import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

type WhyTracebudBlockProps = {
  locale: string;
};

export async function WhyTracebudBlock({ locale }: WhyTracebudBlockProps) {
  const t = await getTranslations('homeV2.whyTracebud');
  const items = ['captureOnce', 'offline', 'sovereignty', 'identity', 'network'] as const;

  return (
    <section className="bg-white px-6 py-20">
      <div className="mx-auto max-w-3xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[var(--data-emerald)]">
          Principles
        </p>
        <h2 className="mb-4 text-3xl font-bold text-[var(--forest-canopy)] text-balance md:text-4xl">
          {t('title')}
        </h2>
        <p className="mb-12 text-lg leading-relaxed text-gray-600">{t('description')}</p>

        <ol className="space-y-5">
          {items.map((key, index) => (
            <li key={key} className="flex gap-5">
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--warm-stone)] text-sm font-bold text-[var(--forest-canopy)] ring-1 ring-[var(--warm-stone-dark)]"
                aria-hidden
              >
                {index + 1}
              </span>
              <div className="pt-1">
                <span className="font-semibold text-[var(--forest-canopy)]">
                  {t(`items.${key}.title`)}
                </span>
                <span className="text-gray-500"> — </span>
                <span className="text-gray-600">{t(`items.${key}.description`)}</span>
              </div>
            </li>
          ))}
        </ol>

        <p className="mt-10">
          <Link
            href={`/${locale}/why-tracebud`}
            className="inline-flex items-center gap-1.5 font-semibold text-[var(--data-emerald)] hover:underline"
          >
            {t('readMore')} →
          </Link>
        </p>
      </div>
    </section>
  );
}
