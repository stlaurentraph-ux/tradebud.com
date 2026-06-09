import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

/** Routes gated until Stage B launch assembly. */
export type MarketingRouteId =
  | 'insights'
  | 'insights-article'
  | 'platform'
  | 'platform-offline-mapping'
  | 'platform-ai-verification'
  | 'platform-network'
  | 'platform-integrations'
  | 'compliance'
  | 'compliance-eudr'
  | 'compliance-due-diligence'
  | 'compliance-guides'
  | 'compliance-security'
  | 'cooperatives'
  | 'sponsors'
  | 'why-tracebud'
  | 'home-preview'
  | 'draft-index'
  | 'impact'
  | 'impact-smallholders'
  | 'impact-forests'
  | 'impact-supply-chains';

export const MARKETING_PREVIEW_COOKIE = 'marketing_preview';
export const MARKETING_PREVIEW_PARAM = 'marketing_preview';

/**
 * Flip entries to `true` in Stage B (launch assembly PR).
 * Until then, production returns 404 unless preview cookie is set.
 */
export const marketingRoutePublication: Record<MarketingRouteId, boolean> = {
  insights: false,
  'insights-article': false,
  platform: false,
  'platform-offline-mapping': false,
  'platform-ai-verification': false,
  'platform-network': false,
  'platform-integrations': false,
  compliance: false,
  'compliance-eudr': false,
  'compliance-due-diligence': false,
  'compliance-guides': false,
  'compliance-security': false,
  cooperatives: false,
  sponsors: false,
  'why-tracebud': false,
  'home-preview': false,
  'draft-index': false,
  impact: false,
  'impact-smallholders': false,
  'impact-forests': false,
  'impact-supply-chains': false,
};

export function isDevelopmentPreview(): boolean {
  return process.env.NODE_ENV === 'development';
}

export function isRouteFlagPublished(routeId: MarketingRouteId): boolean {
  return marketingRoutePublication[routeId] === true;
}

export async function hasMarketingPreviewAccess(): Promise<boolean> {
  if (isDevelopmentPreview()) {
    return true;
  }

  const secret = process.env.MARKETING_PREVIEW_SECRET;
  if (!secret) {
    return false;
  }

  const cookieStore = await cookies();
  return cookieStore.get(MARKETING_PREVIEW_COOKIE)?.value === secret;
}

export async function isMarketingRoutePublished(routeId: MarketingRouteId): Promise<boolean> {
  if (isRouteFlagPublished(routeId)) {
    return true;
  }

  return hasMarketingPreviewAccess();
}

export async function assertMarketingRoutePublished(routeId: MarketingRouteId): Promise<void> {
  if (!(await isMarketingRoutePublished(routeId))) {
    notFound();
  }
}

export async function shouldNoIndexMarketingRoute(routeId: MarketingRouteId): Promise<boolean> {
  return !(await isMarketingRoutePublished(routeId)) || !isRouteFlagPublished(routeId);
}
