import { getTranslations } from 'next-intl/server';

export async function SocialProofStrip() {
  const t = await getTranslations('homeV2.socialProof');
  const stats = ['commodities', 'offline', 'retention'] as const;

  return (
    <section className="border-y px-6 py-8">
      <div className="mx-auto flex max-w-5xl flex-wrap justify-between gap-6">
        {stats.map((key) => (
          <div key={key}>
            <p className="text-lg font-bold">{t(`stats.${key}.value`)}</p>
            <p className="text-sm">{t(`stats.${key}.label`)}</p>
          </div>
        ))}
      </div>
      <p className="mx-auto mt-4 max-w-5xl text-xs">{t('disclaimer')}</p>
    </section>
  );
}
