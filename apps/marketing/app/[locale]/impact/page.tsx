import { setRequestLocale } from 'next-intl/server';

import { DraftHubPage } from '@/components/marketing/draft-hub-page';
import { impactHub } from '@/lib/marketing-draft-content';
import { draftPageMetadata } from '@/lib/marketing-page-metadata';
import { assertMarketingRoutePublished } from '@/lib/marketing-publication';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return draftPageMetadata(locale, 'impact', impactHub, '/impact');
}

export default async function ImpactHubPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  await assertMarketingRoutePublished('impact');
  return <DraftHubPage content={impactHub} locale={locale} />;
}
