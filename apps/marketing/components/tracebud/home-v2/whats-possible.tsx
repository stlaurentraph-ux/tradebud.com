import type React from 'react';

import Image from 'next/image';
import { getTranslations } from 'next-intl/server';

export async function WhatsPossible() {
  const t = await getTranslations('homeV2.whatsPossible');
  const scenarios = ['brand', 'farmer', 'exporter', 'country'] as const;

  const SCENARIO_ICONS: Record<typeof scenarios[number], React.ReactNode> = {
    brand: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden>
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
        <line x1="7" y1="7" x2="7.01" y2="7" />
      </svg>
    ),
    farmer: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden>
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    exporter: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden>
        <rect x="1" y="3" width="15" height="13" rx="2" />
        <path d="M16 8h4l3 5v3h-7V8z" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
    country: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden>
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
  };

  return (
    <section className="relative isolate overflow-hidden bg-[var(--forest-canopy)] px-6 py-20">
      {/* Subtle background image */}
      <Image
        src="/images/placeholders/hero-forest.png"
        alt=""
        fill
        className="absolute inset-0 -z-10 object-cover opacity-10"
        sizes="100vw"
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-[var(--forest-canopy)]/90" />

      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-14 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[var(--data-emerald)]">
              Network
            </p>
            <h2 className="mb-4 text-balance text-3xl font-bold text-white md:text-4xl">
              {t('title')}
            </h2>
            <p className="text-lg leading-relaxed text-white/70">{t('description')}</p>
          </div>
        </div>

        {/* Scenario cards — 2-col on desktop */}
        <ol className="grid gap-5 md:grid-cols-2">
          {scenarios.map((key, index) => (
            <li
              key={key}
              className="flex gap-5 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
            >
              {/* Number badge */}
              <span
                aria-hidden
                className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--data-emerald)] text-sm font-bold text-[var(--forest-canopy)]"
              >
                {index + 1}
              </span>

              <div>
                <div className="mb-2 flex items-center gap-2 text-[var(--data-emerald)]">
                  {SCENARIO_ICONS[key]}
                  <h3 className="font-semibold text-white">
                    {t(`scenarios.${key}.title`)}
                  </h3>
                </div>
                <p className="text-sm leading-relaxed text-white/65">
                  {t(`scenarios.${key}.description`)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
