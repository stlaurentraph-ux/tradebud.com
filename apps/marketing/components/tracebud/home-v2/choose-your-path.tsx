import Image from 'next/image';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

// Simple SVG icon paths per audience card
const PATH_ICONS: Record<string, React.ReactNode> = {
  farmers: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
      <path d="M12 8v4l3 3" />
    </svg>
  ),
  cooperatives: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  exporters: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden>
      <rect x="1" y="3" width="15" height="13" rx="2" />
      <path d="M16 8h4l3 5v3h-7V8z" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  ),
  importers: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden>
      <path d="M21 10H3M3 6h18M3 14h18M3 18h18" />
    </svg>
  ),
  sponsors: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01z" />
    </svg>
  ),
  countries: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
};

type ChooseYourPathProps = {
  locale: string;
};

export async function ChooseYourPath({ locale }: ChooseYourPathProps) {
  const t = await getTranslations('homeV2.chooseYourPath');

  const paths = [
    { key: 'farmers',      href: `/${locale}/farmers` },
    { key: 'cooperatives', href: `/${locale}/cooperatives` },
    { key: 'exporters',    href: `/${locale}/exporters` },
    { key: 'importers',    href: `/${locale}/importers` },
    { key: 'sponsors',     href: `/${locale}/sponsors` },
    { key: 'countries',    href: `/${locale}/countries` },
  ] as const;

  return (
    <section className="bg-[var(--warm-stone)] px-6 py-20">
      <div className="mx-auto max-w-5xl">

        {/* Header + image side-by-side on large screens */}
        <div className="mb-14 flex flex-col gap-10 lg:flex-row lg:items-center lg:gap-16">
          <div className="flex-1">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[var(--data-emerald)]">
              Solutions
            </p>
            <h2 className="mb-4 text-balance text-3xl font-bold text-[var(--forest-canopy)] md:text-4xl">
              {t('title')}
            </h2>
            <p className="text-lg leading-relaxed text-gray-600">{t('description')}</p>
          </div>

          <div className="relative h-52 w-full flex-shrink-0 overflow-hidden rounded-2xl lg:w-80 lg:h-60">
            <Image
              src="/images/placeholders/section-paths.png"
              alt="People across the supply chain"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 320px"
            />
            <div aria-hidden className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-black/10" />
          </div>
        </div>

        {/* Cards grid */}
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {paths.map(({ key, href }) => (
            <li key={key}>
              <Link
                href={href}
                className="group flex h-full flex-col rounded-2xl border border-[var(--warm-stone-dark)] bg-white p-7 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                {/* Icon */}
                <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--data-emerald)]/10 text-[var(--data-emerald)]">
                  {PATH_ICONS[key]}
                </span>

                <h3 className="mb-2 font-bold text-[var(--forest-canopy)] transition-colors group-hover:text-[var(--forest-light)]">
                  {t(`${key}.label`)}
                </h3>
                <p className="mb-5 flex-1 text-sm leading-relaxed text-gray-500">
                  {t(`${key}.description`)}
                </p>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--data-emerald)]">
                  Learn more
                  <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
