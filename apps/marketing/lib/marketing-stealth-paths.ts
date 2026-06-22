import { isLocale } from '@/i18n.config';
import {
  type MarketingRouteId,
  isRouteFlagPublished,
  MARKETING_PREVIEW_COOKIE,
} from '@/lib/marketing-publication';
import { marketingSiteMap } from '@/lib/marketing-site-map';

export type MarketingStealthPathEntry = {
  href: string;
  routeId: MarketingRouteId;
};

/**
 * Gated routes wired via createDraft* but absent from marketingSiteMap hrefs.
 * Kept in sync by marketing-routes-publication-guard.mjs.
 */
export const marketingStealthSupplementalPaths: MarketingStealthPathEntry[] = [
  { href: '/solutions/regenerative-agriculture', routeId: 'solutions-regenerative-agriculture' },
  { href: '/solutions/esg-carbon-reporting', routeId: 'solutions-esg-carbon-reporting' },
  { href: '/solutions/child-labor-monitoring', routeId: 'solutions-child-labor-monitoring' },
  { href: '/solutions/open-chain-model', routeId: 'solutions-open-chain-model' },
  { href: '/solutions/direct-trade-marketplace', routeId: 'solutions-direct-trade-marketplace' },
  { href: '/resources/data-sovereignty-security', routeId: 'resources-data-sovereignty-security' },
  { href: '/resources/verification-standards', routeId: 'resources-verification-standards' },
  { href: '/resources/api-docs', routeId: 'resources-api-docs' },
];

function normalizeMarketingPath(href: string): string {
  if (!href || href === '/') {
    return '/';
  }
  return href.startsWith('/') ? href.replace(/\/$/, '') : `/${href.replace(/\/$/, '')}`;
}

export function buildMarketingStealthPathRegistry(): Map<string, MarketingRouteId> {
  const registry = new Map<string, MarketingRouteId>();

  const add = (href: string, routeId: MarketingRouteId) => {
    registry.set(normalizeMarketingPath(href), routeId);
  };

  for (const entry of marketingSiteMap) {
    if (entry.routeId) {
      add(entry.href, entry.routeId);
    }
  }

  for (const entry of marketingStealthSupplementalPaths) {
    add(entry.href, entry.routeId);
  }

  return registry;
}

let cachedRegistry: Map<string, MarketingRouteId> | null = null;

function getMarketingStealthPathRegistry(): Map<string, MarketingRouteId> {
  if (!cachedRegistry) {
    cachedRegistry = buildMarketingStealthPathRegistry();
  }
  return cachedRegistry;
}

export function stripMarketingLocalePrefix(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length > 0 && isLocale(segments[0]!)) {
    const rest = segments.slice(1).join('/');
    return rest ? `/${rest}` : '/';
  }

  return normalizeMarketingPath(pathname);
}

export function resolveMarketingStealthRouteId(pathname: string): MarketingRouteId | null {
  const path = stripMarketingLocalePrefix(pathname);

  if (/^\/insights\/[^/]+$/.test(path)) {
    return 'insights-article';
  }

  return getMarketingStealthPathRegistry().get(path) ?? null;
}

export function hasMarketingPreviewCookie(
  cookieValue: string | undefined,
  previewSecret: string | undefined,
): boolean {
  if (!previewSecret) {
    return false;
  }

  return cookieValue === previewSecret;
}

export function shouldBlockUnpublishedMarketingPath(input: {
  pathname: string;
  previewCookieValue?: string;
  previewSecret?: string;
  nodeEnv?: string;
}): boolean {
  if (input.nodeEnv === 'development') {
    return false;
  }

  const routeId = resolveMarketingStealthRouteId(input.pathname);
  if (!routeId || isRouteFlagPublished(routeId)) {
    return false;
  }

  if (hasMarketingPreviewCookie(input.previewCookieValue, input.previewSecret)) {
    return false;
  }

  return true;
}

export function marketingPreviewCookieName(): typeof MARKETING_PREVIEW_COOKIE {
  return MARKETING_PREVIEW_COOKIE;
}
