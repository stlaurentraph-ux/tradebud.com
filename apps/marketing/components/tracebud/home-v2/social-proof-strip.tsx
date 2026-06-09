import { getTranslations } from 'next-intl/server';

export async function SocialProofStrip() {
  const t = await getTranslations('homeV2.socialProof');
  const stats = ['commodities', 'offline', 'retention'] as const;

  return (
    <section className="border-y border-[var(--warm-stone-dark)] bg-white px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <dl className="flex flex-wrap justify-between gap-8">
          {stats.map((key) => (
            <div key={key} className="flex flex-col gap-1">
              <dt className="text-2xl font-bold text-[var(--forest-canopy)] md:text-3xl">
                {t(`stats.${key}.value`)}
              </dt>
              <dd className="text-sm text-gray-500">{t(`stats.${key}.label`)}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-6 text-xs text-gray-400">{t('disclaimer')}</p>
      </div>
    </section>
  );
}
