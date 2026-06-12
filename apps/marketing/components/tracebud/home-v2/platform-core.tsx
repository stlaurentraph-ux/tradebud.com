/**
 * PlatformCore — homepage section explaining the two shared platform components.
 *
 * Per V0_JUNE_2026_INSTRUCTIONS.md: Platform = Field App + Dashboard only.
 * Every modular solution runs on top of these two components.
 */

import Image from 'next/image';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0 text-[var(--data-emerald)]" aria-hidden>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

export async function PlatformCore({ locale }: { locale: string }) {
  const t = await getTranslations('homeV2.platformCore');

  const fieldFeatures = t.raw('fieldApp.features') as string[];
  const dashboardFeatures = t.raw('dashboard.features') as string[];

  return (
    <section className="bg-[var(--forest-canopy)] px-6 py-24">
      <div className="mx-auto max-w-7xl">
        {/* Section header */}
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <p className="mb-3 text-sm font-bold uppercase tracking-widest text-[var(--data-emerald)]">
            {t('eyebrow')}
          </p>
          <h2 className="mb-4 text-balance text-4xl font-bold text-white md:text-5xl">
            {t('title')}
          </h2>
          <p className="text-lg leading-relaxed text-white/70">{t('description')}</p>
        </div>

        {/* Field App — image left, text right */}
        <div className="mb-12 grid items-center gap-10 lg:grid-cols-2">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl ring-1 ring-white/10">
            <Image
              src="/images/placeholders/platform-field-app.png"
              alt="Field App offline plot mapping interface"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[var(--data-emerald)]">
              {t('fieldApp.label')}
            </p>
            <h3 className="mb-4 text-2xl font-bold text-white md:text-3xl">
              {t('fieldApp.headline')}
            </h3>
            <p className="mb-6 leading-relaxed text-white/70">{t('fieldApp.description')}</p>
            <ul className="mb-7 space-y-3">
              {fieldFeatures.map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-sm text-white/85">
                  <CheckIcon />
                  {feature}
                </li>
              ))}
            </ul>
            <Link
              href={`/${locale}/draft/platform/field-app`}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-white/20 transition-colors hover:bg-white/20"
            >
              {t('exploreFieldApp')}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Dashboard — text left, image right */}
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="lg:order-2">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl ring-1 ring-white/10">
              <Image
                src="/images/placeholders/platform-dashboard.png"
                alt="Supply chain command center dashboard"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>
          <div className="lg:order-1">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[var(--data-emerald)]">
              {t('dashboard.label')}
            </p>
            <h3 className="mb-4 text-2xl font-bold text-white md:text-3xl">
              {t('dashboard.headline')}
            </h3>
            <p className="mb-6 leading-relaxed text-white/70">{t('dashboard.description')}</p>
            <ul className="mb-7 space-y-3">
              {dashboardFeatures.map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-sm text-white/85">
                  <CheckIcon />
                  {feature}
                </li>
              ))}
            </ul>
            <Link
              href={`/${locale}/draft/platform/dashboard`}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-white/20 transition-colors hover:bg-white/20"
            >
              {t('exploreDashboard')}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
