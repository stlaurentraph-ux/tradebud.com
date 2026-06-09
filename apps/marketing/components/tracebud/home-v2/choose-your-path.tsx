import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

type ChooseYourPathProps = {
  locale: string;
};

export async function ChooseYourPath({ locale }: ChooseYourPathProps) {
  const t = await getTranslations('homeV2.chooseYourPath');

  const paths = [
    { href: `/${locale}/farmers`, label: t('farmers.label'), description: t('farmers.description') },
    {
      href: `/${locale}/cooperatives`,
      label: t('cooperatives.label'),
      description: t('cooperatives.description'),
    },
    {
      href: `/${locale}/exporters`,
      label: t('exporters.label'),
      description: t('exporters.description'),
    },
    {
      href: `/${locale}/importers`,
      label: t('importers.label'),
      description: t('importers.description'),
    },
    {
      href: `/${locale}/sponsors`,
      label: t('sponsors.label'),
      description: t('sponsors.description'),
    },
    {
      href: `/${locale}/countries`,
      label: t('countries.label'),
      description: t('countries.description'),
    },
  ];

  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-2 text-2xl font-bold">{t('title')}</h2>
        <p className="mb-8">{t('description')}</p>
        <ul className="grid gap-4 sm:grid-cols-2">
          {paths.map((path) => (
            <li key={path.href} className="border p-4">
              <h3 className="font-semibold">
                <Link href={path.href}>{path.label}</Link>
              </h3>
              <p className="mt-1 text-sm">{path.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
