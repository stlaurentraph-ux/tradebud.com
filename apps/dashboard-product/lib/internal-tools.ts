/**
 * Internal-only routes (Founder OS, legacy CRM/content trees).
 * Disabled in production unless explicitly enabled.
 */
export function isInternalToolsEnabled(): boolean {
  const flag = process.env.NEXT_PUBLIC_ENABLE_INTERNAL_TOOLS?.trim().toLowerCase();
  if (flag === 'true' || flag === '1') return true;
  if (flag === 'false' || flag === '0') return false;
  return process.env.NODE_ENV !== 'production';
}

const INTERNAL_TOOL_PREFIXES = ['/founder-os', '/crm', '/content'] as const;

const LEGACY_INTERNAL_REDIRECTS: ReadonlyArray<{ from: string; to: string }> = [
  { from: '/crm', to: '/founder-os/crm' },
  { from: '/content', to: '/founder-os/content' },
];

export function getInternalToolsRedirectPath(pathname: string): string | null {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/';

  if (isInternalToolsEnabled()) {
    for (const { from, to } of LEGACY_INTERNAL_REDIRECTS) {
      if (normalizedPath === from || normalizedPath.startsWith(`${from}/`)) {
        const suffix = normalizedPath.slice(from.length);
        return `${to}${suffix}`;
      }
    }
    return null;
  }

  if (INTERNAL_TOOL_PREFIXES.some((prefix) => normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`))) {
    return '/';
  }

  return null;
}

/** Canonical shipment list lives at /packages; header assembly keeps sub-routes. */
export function getCanonicalRouteRedirectPath(pathname: string): string | null {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/';
  if (normalizedPath === '/shipments') {
    return '/packages';
  }
  return null;
}
