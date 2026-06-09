import { setRequestLocale } from 'next-intl/server';

import { DraftHubPage } from '@/components/marketing/draft-hub-page';
import { complianceHub } from '@/lib/marketing-draft-content';
import { draftPageMetadata } from '@/lib/marketing-page-metadata';
import { assertMarketingRoutePublished } from '@/lib/marketing-publication';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return draftPageMetadata(locale, 'compliance', complianceHub, '/compliance');
}

export default async function ComplianceHubPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  await assertMarketingRoutePublished('compliance');
  return <DraftHubPage content={complianceHub} locale={locale} />;
}
