import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { MarketingPageLayout } from '@/components/marketing/marketing-page-layout';
import { ChooseYourPath } from '@/components/tracebud/home-v2/choose-your-path';
import { LatestInsights } from '@/components/tracebud/home-v2/latest-insights';
import { SocialProofStrip } from '@/components/tracebud/home-v2/social-proof-strip';
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

  const t = await getTranslations('homePreview');

  return (
    <MarketingPageLayout routeId="home-preview">
      <div className="border-b px-6 py-4 text-sm">
        <p className="mx-auto max-w-5xl">
          {t('description')}{' '}
          <Link href={`/${locale}/draft`} className="underline">
            Draft site index →
          </Link>
        </p>
      </div>

      <section className="px-6 py-12">
        <div className="mx-auto max-w-3xl">
          <p className="mb-2 text-sm uppercase">{t('eyebrow')}</p>
          <h1 className="mb-4 text-3xl font-bold">{t('title')}</h1>
          <p className="text-lg">[ Hero — style in v0 ]</p>
        </div>
      </section>

      <SocialProofStrip />
      <ChooseYourPath locale={locale} />
      <WhatsPossible />
      <WhyTracebudBlock locale={locale} />
      <LatestInsights locale={locale} />
    </MarketingPageLayout>
  );
}
