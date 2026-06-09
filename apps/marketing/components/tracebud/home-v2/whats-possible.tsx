import { getTranslations } from 'next-intl/server';

export async function WhatsPossible() {
  const t = await getTranslations('homeV2.whatsPossible');
  const scenarios = ['brand', 'farmer', 'exporter', 'country'] as const;

  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-2 text-2xl font-bold">{t('title')}</h2>
        <p className="mb-8">{t('description')}</p>
        <ul className="space-y-4">
          {scenarios.map((key) => (
            <li key={key} className="border-l-2 pl-4">
              <h3 className="font-semibold">{t(`scenarios.${key}.title`)}</h3>
              <p className="text-sm">{t(`scenarios.${key}.description`)}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
