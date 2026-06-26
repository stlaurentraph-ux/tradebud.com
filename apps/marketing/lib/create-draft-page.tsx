import { setRequestLocale } from 'next-intl/server';

import { DraftContentPage } from '@/components/marketing/draft-content-page';
import { draftPages, whoWeServeDraftPages } from '@/lib/marketing-draft-content';
import { draftPageMetadata } from '@/lib/marketing-page-metadata';
import { assertMarketingRoutePublished } from '@/lib/marketing-publication';

type DraftPageKey = keyof typeof draftPages;

type DraftPageOptions = {
  /** Hub path (without locale prefix) for the breadcrumb back-link. */
  hubHref?: string;
  /** Hub label shown in the breadcrumb. */
  hubLabel?: string;
  /** Optional hero image override. */
  heroImage?: string;
};

export function createDraftContentPage(
  pageKey: DraftPageKey,
  path: string,
  options: DraftPageOptions = {},
) {
  const content = draftPages[pageKey];

  async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    return draftPageMetadata(locale, content.routeId, content, path);
  }

  async function Page({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    await assertMarketingRoutePublished(content.routeId);
    return (
      <DraftContentPage
        content={content}
        locale={locale}
        heroImage={options.heroImage}
        hubHref={options.hubHref ? `/${locale}${options.hubHref}` : undefined}
        hubLabel={options.hubLabel}
      />
    );
  }

  return { generateMetadata, Page };
}

type AudiencePageKey = keyof typeof whoWeServeDraftPages;

/**
 * Factory for /who-we-serve/* audience segment pages.
 * Mirrors createDraftContentPage but reads from whoWeServeDraftPages.
 */
export function createAudiencePage(
  pageKey: AudiencePageKey,
  path: string,
  options: DraftPageOptions = {},
) {
  const content = whoWeServeDraftPages[pageKey];

  async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    return draftPageMetadata(locale, content.routeId, content, path);
  }

  async function Page({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    await assertMarketingRoutePublished(content.routeId);
    return (
      <DraftContentPage
        content={content}
        locale={locale}
        heroImage={options.heroImage}
        hubHref={options.hubHref ? `/${locale}${options.hubHref}` : undefined}
        hubLabel={options.hubLabel}
      />
    );
  }

  return { generateMetadata, Page };
}
