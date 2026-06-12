import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { MarketingPageLayout } from '@/components/marketing/marketing-page-layout';
import { SiteNavPreview } from '@/components/marketing/site-nav-preview';
import { ChooseYourPath } from '@/components/tracebud/home-v2/choose-your-path';
import { LatestInsights } from '@/components/tracebud/home-v2/latest-insights';
import { ModularSolutions } from '@/components/tracebud/home-v2/modular-solutions';
import { PlatformCore } from '@/components/tracebud/home-v2/platform-core';
import { SocialProofStrip } from '@/components/tracebud/home-v2/social-proof-strip';
import { ThreeResilience } from '@/components/tracebud/home-v2/three-resilience';
import { WhatsPossible } from '@/components/tracebud/home-v2/whats-possible';
import { WhyTracebudBlock } from '@/components/tracebud/home-v2/why-tracebud-block';
import { assertMarketingRoutePublished } from '@/lib/marketing-publication';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Homepage preview | Tracebud',
    robots: { index: false, follow: false },
  };
}

export default async function HomePreviewPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  await assertMarketingRoutePublished('home-preview');

  const t = await getTranslations('homeV2.hero');

  return (
    <MarketingPageLayout routeId="home-preview" nav={<SiteNavPreview locale={locale} />}>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden bg-[var(--forest-canopy)] px-6 pb-28 pt-36 md:pt-48">
        <Image
          src="/images/placeholders/hero-home.png"
          alt=""
          fill
          className="absolute inset-0 -z-10 object-cover opacity-20"
          sizes="100vw"
          priority
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-b from-[var(--forest-canopy)]/60 via-[var(--forest-canopy)]/80 to-[var(--forest-canopy)]"
        />

        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--data-emerald)]/30 bg-[var(--data-emerald)]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[var(--data-emerald)]">
            {t('eyebrow')}
          </p>
          <h1 className="mb-6 text-balance text-5xl font-bold leading-tight text-white md:text-6xl lg:text-7xl">
            {t('headline')}
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-white/75 md:text-xl">
            {t('description')}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href={`/${locale}/get-started`}
              className="inline-flex items-center rounded-full bg-[var(--data-emerald)] px-8 py-3.5 text-base font-bold text-[var(--forest-canopy)] shadow-lg shadow-[var(--data-emerald)]/20 transition-opacity hover:opacity-90"
            >
              {t('primaryCta')}
            </Link>
            <Link
              href={`/${locale}/demo`}
              className="inline-flex items-center rounded-full border-2 border-white/30 bg-white/5 px-8 py-3.5 text-base font-bold text-white backdrop-blur-sm transition-colors hover:bg-white/10"
            >
              {t('secondaryCta')}
            </Link>
          </div>
        </div>
      </section>

      <SocialProofStrip />
      <ModularSolutions locale={locale} />
      <PlatformCore locale={locale} />
      <ChooseYourPath locale={locale} />
      <WhatsPossible />
      <ThreeResilience locale={locale} />
      <WhyTracebudBlock locale={locale} />
      <LatestInsights locale={locale} />
    </MarketingPageLayout>
  );
}
