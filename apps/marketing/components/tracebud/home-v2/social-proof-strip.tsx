import type React from 'react';

import { getTranslations } from 'next-intl/server';

const STAT_ICONS: Record<string, React.ReactNode> = {
  // Leaf / plant — represents commodities
  commodities: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden>
      <path d="M12 22V12" />
      <path d="M12 12C12 7 8 4 3 4c0 5 3 8 9 8z" />
      <path d="M12 12c0-5 4-8 9-8 0 5-3 8-9 8z" />
    </svg>
  ),
  // Signal tower — represents offline-first / connectivity
  offline: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden>
      <path d="M5 12.55a11 11 0 0 1 14.08 0" />
      <path d="M1.42 9a16 16 0 0 1 21.16 0" />
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
      <circle cx="12" cy="20" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),
  // Circular arrows — represents retention / reuse
  retention: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden>
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10" />
      <path d="M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  ),
};

export async function SocialProofStrip() {
  const t = await getTranslations('homeV2.socialProof');
  const stats = ['commodities', 'offline', 'retention'] as const;

  return (
    <section className="border-y border-[var(--warm-stone-dark)] bg-white px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <dl className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {stats.map((key) => (
            <div
              key={key}
              className="flex flex-col items-center gap-2 rounded-2xl border border-[var(--warm-stone-dark)] bg-[var(--warm-stone)] px-6 py-8 text-center"
            >
              <span className="mb-1 text-[var(--data-emerald)]">{STAT_ICONS[key]}</span>
              <dt className="text-4xl font-bold tabular-nums text-[var(--forest-canopy)] md:text-5xl">
                {t(`stats.${key}.value`)}
              </dt>
              <dd className="text-sm leading-snug text-gray-500">{t(`stats.${key}.label`)}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-6 text-center text-xs text-gray-400">{t('disclaimer')}</p>
      </div>
    </section>
  );
}
