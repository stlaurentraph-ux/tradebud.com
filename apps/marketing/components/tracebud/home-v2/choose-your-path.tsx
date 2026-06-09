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
    <section className="bg-[var(--warm-stone)] px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 max-w-2xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[var(--data-emerald)]">
            Solutions
          </p>
          <h2 className="mb-3 text-3xl font-bold text-[var(--forest-canopy)] text-balance md:text-4xl">
            {t('title')}
          </h2>
          <p className="text-lg leading-relaxed text-gray-600">{t('description')}</p>
        </div>

        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {paths.map((path) => (
            <li key={path.href}>
              <Link
                href={path.href}
                className="group flex h-full flex-col rounded-2xl border border-[var(--warm-stone-dark)] bg-white p-7 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
              >
                <h3 className="mb-2 font-bold text-[var(--forest-canopy)] group-hover:text-[var(--forest-light)]">
                  {path.label}
                </h3>
                <p className="mb-5 flex-1 text-sm leading-relaxed text-gray-500">
                  {path.description}
                </p>
                <span className="text-sm font-semibold text-[var(--data-emerald)]">
                  Learn more →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
