import Image from 'next/image';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

const PILLAR_IMAGES: Record<string, { src: string; alt: string }> = {
  livelihood: {
    src: '/images/placeholders/hero-farmer.png',
    alt: 'Smallholder farmer holding ripe coffee cherries',
  },
  farm: {
    src: '/images/placeholders/hero-impact.png',
    alt: 'Terraced farmland on a tropical hillside',
  },
  planet: {
    src: '/images/placeholders/hero-forest.png',
    alt: 'Aerial view of tropical forest canopy',
  },
};

const PILLAR_NUMBERS: Record<string, string> = {
  livelihood: '01',
  farm: '02',
  planet: '03',
};

type ThreeResilienceProps = {
  locale: string;
};

export async function ThreeResilience({ locale }: ThreeResilienceProps) {
  const t = await getTranslations('homeV2.threeResilience');
  const pillars = ['livelihood', 'farm', 'planet'] as const;

  return (
    <section className="bg-[var(--warm-stone)] px-6 py-20">
      <div className="mx-auto max-w-5xl">

        {/* Section header */}
        <div className="mb-14 max-w-2xl">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[var(--data-emerald)]">
            Impact
          </p>
          <h2 className="mb-4 text-balance text-3xl font-bold text-[var(--forest-canopy)] md:text-4xl">
            {t('title')}
          </h2>
          <p className="text-lg leading-relaxed text-gray-600">
            {t('description')}
          </p>
        </div>

        {/* Pillar cards */}
        <ol className="grid gap-8 md:grid-cols-3">
          {pillars.map((key) => {
            const img = PILLAR_IMAGES[key];
            const num = PILLAR_NUMBERS[key];
            const href = t(`pillars.${key}.href`);

            return (
              <li
                key={key}
                className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--warm-stone-dark,#e5e0d8)] bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                {/* Image thumbnail */}
                <div className="relative h-44 w-full overflow-hidden">
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  {/* Number badge */}
                  <span
                    aria-hidden
                    className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--forest-canopy)] text-sm font-bold tabular-nums text-[var(--data-emerald)] shadow"
                  >
                    {num}
                  </span>
                  <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col p-7">
                  <p className="mb-1 text-xs font-bold uppercase tracking-widest text-[var(--data-emerald)]">
                    {t(`pillars.${key}.eyebrow`)}
                  </p>
                  <h3 className="mb-3 text-lg font-bold text-[var(--forest-canopy)]">
                    {t(`pillars.${key}.title`)}
                  </h3>
                  <p className="mb-7 flex-1 text-sm leading-relaxed text-gray-500">
                    {t(`pillars.${key}.description`)}
                  </p>
                  <Link
                    href={`/${locale}${href}`}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--data-emerald)] transition-opacity hover:opacity-75"
                  >
                    {t('learnMore')}
                    <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
                      →
                    </span>
                  </Link>
                </div>
              </li>
            );
          })}
        </ol>

        {/* Bottom CTA */}
        <div className="mt-12 flex justify-center">
          <Link
            href={`/${locale}/impact`}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--forest-canopy)] px-8 py-3.5 text-sm font-bold text-white shadow-sm transition-colors hover:opacity-90"
          >
            {t('exploreImpact')} →
          </Link>
        </div>

      </div>
    </section>
  );
}
