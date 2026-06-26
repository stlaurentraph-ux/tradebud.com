import { setRequestLocale } from 'next-intl/server';

import { DraftHubPage } from '@/components/marketing/draft-hub-page';
import { whoWeServeHub } from '@/lib/marketing-draft-content';
import { draftPageMetadata } from '@/lib/marketing-page-metadata';
import { assertMarketingRoutePublished } from '@/lib/marketing-publication';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return draftPageMetadata(locale, 'who-we-serve', whoWeServeHub, '/who-we-serve');
}

export default async function WhoWeServeHubPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  await assertMarketingRoutePublished('who-we-serve');
  return <DraftHubPage content={whoWeServeHub} locale={locale} />;
}
