import { setRequestLocale } from 'next-intl/server';

import { DraftContentPage } from '@/components/marketing/draft-content-page';
import { draftPages, platformHub } from '@/lib/marketing-draft-content';
import { draftPageMetadata } from '@/lib/marketing-page-metadata';
import { assertMarketingRoutePublished } from '@/lib/marketing-publication';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return draftPageMetadata(locale, 'platform-field-app', draftPages['platform-field-app'], '/platform/field-app');
}

export default async function PlatformFieldAppPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  await assertMarketingRoutePublished('platform-field-app');
  return (
    <DraftContentPage
      content={draftPages['platform-field-app']}
      locale={locale}
      hubHref={`/${locale}/platform`}
      hubLabel={platformHub.title}
      heroImage="/images/placeholders/platform-field-app.png"
    />
  );
}
