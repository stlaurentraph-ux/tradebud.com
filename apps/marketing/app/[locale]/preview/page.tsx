import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { MarketingPageLayout } from '@/components/marketing/marketing-page-layout';
import { ChooseYourPath } from '@/components/tracebud/home-v2/choose-your-path';
import { LatestInsights } from '@/components/tracebud/home-v2/latest-insights';
import { SocialProofStrip } from '@/components/tracebud/home-v2/social-proof-strip';
import { WhatsPossible } from '@/components/tracebud/home-v2/whats-possible';
import { WhyTracebudBlock } from '@/components/tracebud/home-v2/why-tracebud-block';
import { ThreeResilience } from '@/components/tracebud/home-v2/three-resilience';
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

  const t = await getTranslations('homePreview');

  return (
    <MarketingPageLayout routeId="home-preview">
      {/* Preview banner */}
      <div className="bg-sky-50 border-b border-sky-200 px-6 py-3">
        <p className="mx-auto max-w-5xl text-sm text-sky-800">
          {t('description')}{' '}
          <Link
            href={`/${locale}/draft`}
            className="font-semibold text-sky-900 hover:underline"
          >
            Draft site index →
          </Link>
        </p>
      </div>

      {/* Hero placeholder — styled scaffold for Stage B */}
      <section className="relative bg-[var(--forest-canopy)] px-6 pb-28 pt-40 md:pt-48">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-5 text-sm font-semibold uppercase tracking-widest text-[var(--data-emerald)]">
            {t('eyebrow')}
          </p>
          <h1 className="mb-6 text-5xl font-bold leading-tight text-white text-balance md:text-6xl">
            One Map. One Passport.<br />Every Market.
          </h1>
          <p className="mb-10 text-xl leading-relaxed text-white/80">
            The fastest, safest, and most affordable pathway for smallholder production to enter
            EUDR and ESG-compliant markets.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <span className="inline-flex items-center rounded-full bg-[var(--data-emerald)] px-8 py-3.5 text-base font-bold text-[var(--forest-canopy)]">
              Get started
            </span>
            <span className="inline-flex items-center rounded-full border-2 border-white/40 bg-transparent px-8 py-3.5 text-base font-bold text-white">
              Book a demo
            </span>
          </div>
          <p className="mt-6 text-xs text-white/40">
            [ Hero — wire CTAs and imagery in Stage B ]
          </p>
        </div>
      </section>

      <SocialProofStrip />
      <ChooseYourPath locale={locale} />
      <WhatsPossible />
      <WhyTracebudBlock locale={locale} />
      <ThreeResilience locale={locale} />
      <LatestInsights locale={locale} />
    </MarketingPageLayout>
  );
}
