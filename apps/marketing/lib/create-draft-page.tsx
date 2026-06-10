import { setRequestLocale } from 'next-intl/server';

import { DraftContentPage } from '@/components/marketing/draft-content-page';
import { DraftHubPage } from '@/components/marketing/draft-hub-page';
import { draftPages, type DraftHubContent } from '@/lib/marketing-draft-content';
import { draftPageMetadata } from '@/lib/marketing-page-metadata';
import { assertMarketingRoutePublished } from '@/lib/marketing-publication';

type DraftPageKey = keyof typeof draftPages;

export function createDraftHubPage(hub: DraftHubContent, path: string) {
  async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    return draftPageMetadata(locale, hub.routeId, hub, path);
  }

  async function Page({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    await assertMarketingRoutePublished(hub.routeId);
    return <DraftHubPage content={hub} locale={locale} />;
  }

  return { generateMetadata, Page };
}

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
