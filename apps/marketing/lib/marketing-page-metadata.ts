import type { Metadata } from 'next';

import type { DraftHubContent, DraftPageContent } from '@/lib/marketing-draft-content';
import { shouldNoIndexMarketingRoute, type MarketingRouteId } from '@/lib/marketing-publication';

export async function draftPageMetadata(
  locale: string,
  routeId: MarketingRouteId,
  content: Pick<DraftPageContent | DraftHubContent, 'title' | 'description'>,
  path: string,
): Promise<Metadata> {
  const noIndex = await shouldNoIndexMarketingRoute(routeId);

  return {
    title: `${content.title} | Tracebud`,
    description: content.description,
    alternates: { canonical: `/${locale}${path}` },
    robots: noIndex ? { index: false, follow: false } : { index: true, follow: true },
  };
}
