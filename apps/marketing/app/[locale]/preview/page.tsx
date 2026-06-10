import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { MarketingPageLayout } from '@/components/marketing/marketing-page-layout';
import { ChooseYourPath } from '@/components/tracebud/home-v2/choose-your-path';
import { LatestInsights } from '@/components/tracebud/home-v2/latest-insights';
import { SocialProofStrip } from '@/components/tracebud/home-v2/social-proof-strip';
import { WhatsPossible } from '@/components/tracebud/home-v2/whats-possible';
import { ThreeResilience } from '@/components/tracebud/home-v2/three-resilience';
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

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden bg-[var(--forest-canopy)] px-6 pb-28 pt-40 md:pt-52">
        {/* Background image */}
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

        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--data-emerald)]/30 bg-[var(--data-emerald)]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[var(--data-emerald)]">
            {t('eyebrow')}
          </p>
          <h1 className="mb-6 text-balance text-5xl font-bold leading-tight text-white md:text-6xl lg:text-7xl">
            One Map.{' '}One Passport.{' '}Every Market.
          </h1>
          <p className="mb-10 text-xl leading-relaxed text-white/75">
            The fastest, safest, and most affordable pathway for smallholder production to enter
            EUDR and ESG-compliant markets.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <span className="inline-flex items-center rounded-full bg-[var(--data-emerald)] px-8 py-3.5 text-base font-bold text-[var(--forest-canopy)] shadow-lg shadow-[var(--data-emerald)]/20">
              Get started
            </span>
            <span className="inline-flex items-center rounded-full border-2 border-white/30 bg-white/5 px-8 py-3.5 text-base font-bold text-white backdrop-blur-sm">
              Book a demo
            </span>
          </div>
        </div>
      </section>

      <SocialProofStrip />
      <ChooseYourPath locale={locale} />
      <WhatsPossible />
      <ThreeResilience locale={locale} />
      <WhyTracebudBlock locale={locale} />
      <ThreeResilience locale={locale} />
      <LatestInsights locale={locale} />
    </MarketingPageLayout>
  );
}
