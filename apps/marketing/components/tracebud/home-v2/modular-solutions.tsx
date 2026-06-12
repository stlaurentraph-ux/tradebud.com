/**
 * ModularSolutions — homepage section showcasing the modular solution catalog.
 *
 * Per V0_JUNE_2026_INSTRUCTIONS.md: EUDR compliance is the MVP ("Start here");
 * every other solution carries a Roadmap badge.
 */

import type React from 'react';

import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import { RoadmapBadge } from '@/components/marketing/roadmap-badge';

type SolutionKey =
  | 'eudrCompliance'
  | 'esgCarbon'
  | 'regenAg'
  | 'childLabor'
  | 'openChain'
  | 'directTrade';

type Solution = {
  key: SolutionKey;
  href: string;
  roadmap: boolean;
  icon: React.ReactNode;
};

const SOLUTIONS: Solution[] = [
  {
    key: 'eudrCompliance',
    href: '/draft/solutions/eudr-compliance',
    roadmap: false,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden>
        <path d="M9 12l2 2 4-4" />
        <path d="M12 3l7 4v5c0 4.5-3 8.5-7 9.5-4-1-7-5-7-9.5V7l7-4z" />
      </svg>
    ),
  },
  {
    key: 'esgCarbon',
    href: '/draft/solutions/esg-carbon',
    roadmap: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden>
        <path d="M3 3v18h18" />
        <path d="M7 14l3-3 3 3 4-5" />
      </svg>
    ),
  },
  {
    key: 'regenAg',
    href: '/draft/solutions/regenerative-agriculture',
    roadmap: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden>
        <path d="M12 22V12" />
        <path d="M12 12C12 7 8 4 3 4c0 5 3 8 9 8z" />
        <path d="M12 12c0-5 4-8 9-8 0 5-3 8-9 8z" />
      </svg>
    ),
  },
  {
    key: 'childLabor',
    href: '/draft/solutions/child-labor-monitoring',
    roadmap: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4 3.5-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
  {
    key: 'openChain',
    href: '/draft/solutions/open-chain',
    roadmap: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden>
        <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5" />
        <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5" />
      </svg>
    ),
  },
  {
    key: 'directTrade',
    href: '/draft/solutions/direct-trade',
    roadmap: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden>
        <path d="M3 6h18l-2 13H5L3 6z" />
        <path d="M3 6L2 3" />
        <circle cx="9" cy="21" r="1" />
        <circle cx="17" cy="21" r="1" />
      </svg>
    ),
  },
];

export async function ModularSolutions({ locale }: { locale: string }) {
  const t = await getTranslations('homeV2.modularSolutions');

  return (
    <section className="bg-[var(--warm-stone)] px-6 py-24">
      <div className="mx-auto max-w-7xl">
        {/* Section header */}
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="mb-3 text-sm font-bold uppercase tracking-widest text-[var(--data-emerald)]">
            {t('eyebrow')}
          </p>
          <h2 className="mb-4 text-balance text-4xl font-bold text-[var(--forest-canopy)] md:text-5xl">
            {t('title')}
          </h2>
          <p className="text-lg leading-relaxed text-[var(--forest-canopy)]/70">
            {t('description')}
          </p>
        </div>

        {/* Solution grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SOLUTIONS.map((solution) => {
            const isMvp = !solution.roadmap;
            return (
              <Link
                key={solution.key}
                href={`/${locale}${solution.href}`}
                className={`group relative flex flex-col rounded-2xl border p-7 transition-all hover:-translate-y-1 hover:shadow-lg ${
                  isMvp
                    ? 'border-[var(--data-emerald)] bg-white ring-1 ring-[var(--data-emerald)]'
                    : 'border-[var(--warm-stone-dark)] bg-white'
                }`}
              >
                {/* Top row: icon + badge */}
                <div className="mb-5 flex items-start justify-between">
                  <span
                    className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                      isMvp
                        ? 'bg-[var(--data-emerald)] text-[var(--forest-canopy)]'
                        : 'bg-[var(--forest-canopy)]/5 text-[var(--forest-canopy)]'
                    }`}
                  >
                    {solution.icon}
                  </span>
                  {isMvp ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--data-emerald)]/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--forest-canopy)] ring-1 ring-[var(--data-emerald)]/30">
                      {t('startHere')}
                    </span>
                  ) : (
                    <RoadmapBadge label={t('roadmap')} />
                  )}
                </div>

                <h3 className="mb-2 text-lg font-bold text-[var(--forest-canopy)] group-hover:text-[var(--data-emerald)]">
                  {t(`solutions.${solution.key}.title`)}
                </h3>
                <p className="text-sm leading-relaxed text-[var(--forest-canopy)]/65">
                  {t(`solutions.${solution.key}.description`)}
                </p>

                <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-[var(--data-emerald)]">
                  Learn more
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden>
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
