import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

type WhyTracebudBlockProps = {
  locale: string;
};

export async function WhyTracebudBlock({ locale }: WhyTracebudBlockProps) {
  const t = await getTranslations('homeV2.whyTracebud');
  const items = ['captureOnce', 'offline', 'sovereignty', 'identity', 'network'] as const;

  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-2 text-2xl font-bold">{t('title')}</h2>
        <p className="mb-8">{t('description')}</p>
        <ol className="space-y-4">
          {items.map((key, index) => (
            <li key={key}>
              <span className="font-mono text-sm">{index + 1}.</span>{' '}
              <strong>{t(`items.${key}.title`)}</strong> — {t(`items.${key}.description`)}
            </li>
          ))}
        </ol>
        <p className="mt-6">
          <Link href={`/${locale}/why-tracebud`} className="underline">
            {t('readMore')} →
          </Link>
        </p>
      </div>
    </section>
  );
}
