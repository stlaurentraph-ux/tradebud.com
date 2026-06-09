import { setRequestLocale } from 'next-intl/server';

import { DraftContentPage } from '@/components/marketing/draft-content-page';
import { draftPages } from '@/lib/marketing-draft-content';
import { draftPageMetadata } from '@/lib/marketing-page-metadata';
import { assertMarketingRoutePublished } from '@/lib/marketing-publication';

type DraftPageKey = keyof typeof draftPages;

export function createDraftContentPage(pageKey: DraftPageKey, path: string) {
  const content = draftPages[pageKey];

  async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    return draftPageMetadata(locale, content.routeId, content, path);
  }

  async function Page({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    await assertMarketingRoutePublished(content.routeId);
    return <DraftContentPage content={content} locale={locale} />;
  }

  return { generateMetadata, Page };
}
