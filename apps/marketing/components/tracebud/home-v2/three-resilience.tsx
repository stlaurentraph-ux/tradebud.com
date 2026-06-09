import Image from 'next/image';
import Link from 'next/link';

type Pillar = {
  number: string;
  title: string;
  description: string;
  href: string;
  linkLabel: string;
  imageSrc: string;
  imageAlt: string;
};

const PILLARS: Pillar[] = [
  {
    number: '01',
    title: 'Smallholder livelihoods',
    description:
      'A single Tracebud GeoID unlocks premium-market access for small-scale farmers — captured once, reused across every buyer and certification they pursue.',
    href: '/impact/smallholders',
    linkLabel: 'How it works',
    imageSrc: '/images/placeholders/hero-farmer.png',
    imageAlt: 'Smallholder farmer holding ripe coffee cherries',
  },
  {
    number: '02',
    title: 'Forest protection',
    description:
      'Identity-preserved batches trace every shipment to a verified plot polygon. AI deforestation checks and photo-vault evidence close the loophole mass-balance chains leave open.',
    href: '/impact/forests',
    linkLabel: 'The evidence model',
    imageSrc: '/images/placeholders/hero-forest.png',
    imageAlt: 'Aerial view of tropical forest canopy',
  },
  {
    number: '03',
    title: 'Ethical supply chains',
    description:
      'Audit-ready due diligence records — GPS plots, signed consent, batch lineage — replace self-reported claims with independently verifiable proof at every tier.',
    href: '/impact/supply-chains',
    linkLabel: 'Chain-of-custody detail',
    imageSrc: '/images/placeholders/hero-supply-chain.png',
    imageAlt: 'Cacao beans being sorted at a cooperative',
  },
];

type ThreeResilienceProps = {
  locale: string;
};

export function ThreeResilience({ locale }: ThreeResilienceProps) {
  return (
    <section className="bg-[var(--warm-stone)] px-6 py-20">
      <div className="mx-auto max-w-5xl">

        {/* Section header */}
        <div className="mb-14 max-w-2xl">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[var(--data-emerald)]">
            Impact
          </p>
          <h2 className="mb-4 text-balance text-3xl font-bold text-[var(--forest-canopy)] md:text-4xl">
            Three pillars of resilience
          </h2>
          <p className="text-lg leading-relaxed text-gray-600">
            Compliance infrastructure that creates tangible outcomes — not just documentation.
          </p>
        </div>

        {/* Pillar cards with image thumbnails */}
        <ol className="grid gap-8 md:grid-cols-3">
          {PILLARS.map((pillar) => (
            <li
              key={pillar.number}
              className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--warm-stone-dark)] bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              {/* Image thumbnail */}
              <div className="relative h-44 w-full overflow-hidden">
                <Image
                  src={pillar.imageSrc}
                  alt={pillar.imageAlt}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                {/* Number badge over image */}
                <span
                  aria-hidden
                  className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--forest-canopy)] text-sm font-bold tabular-nums text-[var(--data-emerald)] shadow"
                >
                  {pillar.number}
                </span>
                <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              </div>

              {/* Content */}
              <div className="flex flex-1 flex-col p-7">
                <h3 className="mb-3 text-lg font-bold text-[var(--forest-canopy)]">
                  {pillar.title}
                </h3>
                <p className="mb-7 flex-1 text-sm leading-relaxed text-gray-500">
                  {pillar.description}
                </p>
                <Link
                  href={`/${locale}${pillar.href}`}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--data-emerald)] transition-opacity hover:opacity-75"
                >
                  {pillar.linkLabel}
                  <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
                </Link>
              </div>
            </li>
          ))}
        </ol>

        {/* Bottom CTA */}
        <div className="mt-12 flex justify-center">
          <Link
            href={`/${locale}/impact`}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--forest-canopy)] px-8 py-3.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[var(--forest-light)]"
          >
            Explore all impact areas →
          </Link>
        </div>

      </div>
    </section>
  );
}
