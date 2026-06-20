/**
 * Internal-only routes (Founder OS legacy paths on product dashboard).
 * Redirects to standalone Founder OS app (`apps/founder-os` / ops.tracebud.com).
 */

export function isInternalToolsEnabled(): boolean {
  const flag = process.env.NEXT_PUBLIC_ENABLE_INTERNAL_TOOLS?.trim().toLowerCase();
  if (flag === 'true' || flag === '1') return true;
  if (flag === 'false' || flag === '0') return false;
  return process.env.NODE_ENV !== 'production';
}

const INTERNAL_TOOL_PREFIXES = ['/founder-os', '/crm', '/content'] as const;

const DEV_FOUNDER_OS_URL = 'http://localhost:3004';

function founderOsBaseUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_FOUNDER_OS_URL?.trim();
  if (!raw) return null;
  return raw.replace(/\/$/, '');
}

function resolveFounderOsBaseUrl(): string | null {
  return founderOsBaseUrl() ?? (isInternalToolsEnabled() ? DEV_FOUNDER_OS_URL : null);
}

export function mapToFounderOsUrl(pathname: string): string | null {
  const base = resolveFounderOsBaseUrl();
  if (!base) return null;

  const normalized = pathname.replace(/\/+$/, '') || '/';
  if (normalized === '/founder-os') return `${base}/`;
  if (normalized.startsWith('/founder-os/')) {
    return `${base}${normalized.slice('/founder-os'.length)}`;
  }
  if (normalized === '/crm' || normalized.startsWith('/crm/')) {
    return `${base}${normalized}`;
  }
  if (normalized === '/content' || normalized.startsWith('/content/')) {
    return `${base}${normalized}`;
  }
  return null;
}

export function getInternalToolsRedirectPath(pathname: string): string | null {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/';

  const isInternalPath = INTERNAL_TOOL_PREFIXES.some(
    (prefix) => normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`),
  );
  if (!isInternalPath) return null;

  const external = mapToFounderOsUrl(normalizedPath);
  if (external) return external;

  if (!isInternalToolsEnabled()) {
    return '/';
  }

  return null;
}

export function getCanonicalRouteRedirectPath(pathname: string): string | null {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/';
  if (normalizedPath === '/shipments') {
    return '/packages';
  }
  return null;
}
