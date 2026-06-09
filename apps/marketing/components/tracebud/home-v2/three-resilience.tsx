import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

type ThreeResilienceProps = {
  locale: string;
};

export async function ThreeResilience({ locale }: ThreeResilienceProps) {
  const t = await getTranslations('homeV2.threeResilience');
  const pillars = ['livelihood', 'farm', 'planet'] as const;

  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-2 text-2xl font-bold">{t('title')}</h2>
        <p className="mb-8 max-w-2xl">{t('description')}</p>
        <ul className="grid gap-4 md:grid-cols-3">
          {pillars.map((key) => (
            <li key={key} className="border p-4">
              <p className="mb-1 text-xs font-semibold uppercase">{t(`pillars.${key}.eyebrow`)}</p>
              <h3 className="mb-2 font-semibold">{t(`pillars.${key}.title`)}</h3>
              <p className="mb-4 text-sm">{t(`pillars.${key}.description`)}</p>
              <Link href={`/${locale}${t(`pillars.${key}.href`)}`} className="text-sm underline">
                {t('learnMore')} →
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm">
          <Link href={`/${locale}/impact`} className="underline">
            {t('exploreImpact')} →
          </Link>
        </p>
      </div>
    </section>
  );
}
