import { getTranslations } from 'next-intl/server';

export async function WhatsPossible() {
  const t = await getTranslations('homeV2.whatsPossible');
  const scenarios = ['brand', 'farmer', 'exporter', 'country'] as const;

  return (
    <section className="bg-[var(--forest-canopy)] px-6 py-20">
      <div className="mx-auto max-w-3xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[var(--data-emerald)]">
          Network
        </p>
        <h2 className="mb-4 text-3xl font-bold text-white text-balance md:text-4xl">
          {t('title')}
        </h2>
        <p className="mb-12 text-lg leading-relaxed text-white/80">{t('description')}</p>

        <ol className="space-y-6">
          {scenarios.map((key, index) => (
            <li
              key={key}
              className="flex gap-5 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--data-emerald)] text-sm font-bold text-[var(--forest-canopy)]"
                aria-hidden
              >
                {index + 1}
              </span>
              <div>
                <h3 className="mb-1 font-semibold text-white">
                  {t(`scenarios.${key}.title`)}
                </h3>
                <p className="text-sm leading-relaxed text-white/70">
                  {t(`scenarios.${key}.description`)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
