import Link from 'next/link';

type Pillar = {
  number: string;
  title: string;
  description: string;
  href: string;
  linkLabel: string;
};

const pillars: Pillar[] = [
  {
    number: '01',
    title: 'Smallholder livelihoods',
    description:
      'A single Tracebud GeoID unlocks premium-market access for small-scale farmers — captured once, reused across every buyer and certification they pursue.',
    href: '/impact/smallholders',
    linkLabel: 'How it works',
  },
  {
    number: '02',
    title: 'Forest protection',
    description:
      'Identity-preserved batches trace every shipment to a verified plot polygon. AI deforestation checks and photo-vault evidence close the loophole that mass-balance chains leave open.',
    href: '/impact/forests',
    linkLabel: 'The evidence model',
  },
  {
    number: '03',
    title: 'Ethical supply chains',
    description:
      'Audit-ready due diligence records — GPS plots, signed consent, batch lineage — replace self-reported claims with independently verifiable proof at every tier.',
    href: '/impact/supply-chains',
    linkLabel: 'Chain-of-custody detail',
  },
];

type ThreeResilienceProps = {
  locale: string;
};

export function ThreeResilience({ locale }: ThreeResilienceProps) {
  return (
    <section className="bg-[var(--forest-canopy)] px-6 py-20">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-14 max-w-2xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[var(--data-emerald)]">
            Impact
          </p>
          <h2 className="mb-4 text-balance text-3xl font-bold leading-tight text-white md:text-4xl">
            Three pillars of resilience
          </h2>
          <p className="text-lg leading-relaxed text-white/70">
            Compliance infrastructure that creates tangible outcomes — not just documentation.
          </p>
        </div>

        {/* Pillar cards */}
        <ol className="grid gap-6 md:grid-cols-3">
          {pillars.map((pillar) => (
            <li key={pillar.number} className="flex flex-col rounded-2xl bg-white/5 p-8 ring-1 ring-white/10">
              {/* Number badge */}
              <span
                className="mb-6 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--data-emerald)]/15 text-sm font-bold text-[var(--data-emerald)] ring-1 ring-[var(--data-emerald)]/30"
                aria-hidden
              >
                {pillar.number}
              </span>

              <h3 className="mb-3 text-xl font-bold text-white">{pillar.title}</h3>
              <p className="mb-8 flex-1 leading-relaxed text-white/65">{pillar.description}</p>

              <Link
                href={`/${locale}${pillar.href}`}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--data-emerald)] transition-opacity hover:opacity-80"
              >
                {pillar.linkLabel}
                <span aria-hidden>→</span>
              </Link>
            </li>
          ))}
        </ol>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <Link
            href={`/${locale}/impact`}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            Explore all impact areas →
          </Link>
        </div>
      </div>
    </section>
  );
}
