import { setRequestLocale } from 'next-intl/server';

import { DraftHubPage } from '@/components/marketing/draft-hub-page';
import { platformHub } from '@/lib/marketing-draft-content';
import { draftPageMetadata } from '@/lib/marketing-page-metadata';
import { assertMarketingRoutePublished } from '@/lib/marketing-publication';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return draftPageMetadata(locale, 'platform', platformHub, '/platform');
}

export default async function PlatformHubPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  await assertMarketingRoutePublished('platform');
  return <DraftHubPage content={platformHub} locale={locale} />;
}
