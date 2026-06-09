import { getTranslations } from 'next-intl/server';

const STAT_ICONS: Record<string, string> = {
  commodities: '🌱',
  offline:     '📡',
  retention:   '♻️',
};

export async function SocialProofStrip() {
  const t = await getTranslations('homeV2.socialProof');
  const stats = ['commodities', 'offline', 'retention'] as const;

  return (
    <section className="border-y border-[var(--warm-stone-dark)] bg-white px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <dl className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {stats.map((key) => (
            <div
              key={key}
              className="flex flex-col items-center gap-2 rounded-2xl border border-[var(--warm-stone-dark)] bg-[var(--warm-stone)] px-6 py-8 text-center"
            >
              <span className="mb-1 text-3xl" aria-hidden>{STAT_ICONS[key]}</span>
              <dt className="text-4xl font-bold tabular-nums text-[var(--forest-canopy)] md:text-5xl">
                {t(`stats.${key}.value`)}
              </dt>
              <dd className="text-sm leading-snug text-gray-500">{t(`stats.${key}.label`)}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-6 text-center text-xs text-gray-400">{t('disclaimer')}</p>
      </div>
    </section>
  );
}
