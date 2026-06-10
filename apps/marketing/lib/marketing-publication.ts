import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

/** Routes gated until Stage B launch assembly. */
export type MarketingRouteId =
  | 'insights'
  | 'insights-article'
  | 'platform'
  | 'platform-field-app'
  | 'platform-dashboard'
  | 'platform-offline-mapping'
  | 'platform-ai-verification'
  | 'platform-network'
  | 'platform-integrations'
  | 'solutions'
  | 'solutions-eudr-compliance'
  | 'solutions-esg-carbon-reporting'
  | 'solutions-regenerative-agriculture'
  | 'solutions-child-labor-monitoring'
  | 'solutions-open-chain-model'
  | 'solutions-direct-trade-marketplace'
  | 'who-we-serve'
  | 'resources'
  | 'resources-data-sovereignty-security'
  | 'resources-verification-standards'
  | 'resources-api-docs'
  | 'compliance'
  | 'compliance-eudr'
  | 'compliance-due-diligence'
  | 'compliance-guides'
  | 'compliance-security'
  | 'cooperatives'
  | 'sponsors'
  | 'why-tracebud'
  | 'impact'
  | 'impact-farmer-livelihood'
  | 'impact-regenerative-farming'
  | 'impact-climate-biodiversity'
  | 'home-preview'
  | 'draft-index';

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
  'platform-field-app': false,
  'platform-dashboard': false,
  'platform-offline-mapping': false,
  'platform-ai-verification': false,
  'platform-network': false,
  'platform-integrations': false,
  solutions: false,
  'solutions-eudr-compliance': false,
  'solutions-esg-carbon-reporting': false,
  'solutions-regenerative-agriculture': false,
  'solutions-child-labor-monitoring': false,
  'solutions-open-chain-model': false,
  'solutions-direct-trade-marketplace': false,
  'who-we-serve': false,
  resources: false,
  'resources-data-sovereignty-security': false,
  'resources-verification-standards': false,
  'resources-api-docs': false,
  compliance: false,
  'compliance-eudr': false,
  'compliance-due-diligence': false,
  'compliance-guides': false,
  'compliance-security': false,
  cooperatives: false,
  sponsors: false,
  'why-tracebud': false,
  impact: false,
  'impact-farmer-livelihood': false,
  'impact-regenerative-farming': false,
  'impact-climate-biodiversity': false,
  'home-preview': false,
  'draft-index': false,
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
