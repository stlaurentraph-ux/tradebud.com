import { setRequestLocale } from 'next-intl/server';

import { DraftContentPage } from '@/components/marketing/draft-content-page';
import { draftPages, platformHub } from '@/lib/marketing-draft-content';
import { draftPageMetadata } from '@/lib/marketing-page-metadata';
import { assertMarketingRoutePublished } from '@/lib/marketing-publication';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return draftPageMetadata(locale, 'platform-dashboard', draftPages['platform-dashboard'], '/platform/dashboard');
}

export default async function PlatformDashboardPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  await assertMarketingRoutePublished('platform-dashboard');
  return (
    <DraftContentPage
      content={draftPages['platform-dashboard']}
      locale={locale}
      hubHref={`/${locale}/platform`}
      hubLabel={platformHub.title}
      heroImage="/images/placeholders/platform-dashboard.png"
    />
  );
}
