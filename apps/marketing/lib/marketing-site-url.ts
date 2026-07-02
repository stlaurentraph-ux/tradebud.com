/** Canonical marketing origin (matches app/layout.tsx metadataBase). */
export const MARKETING_SITE_ORIGIN = 'https://tracebud.com';

export function marketingLocalePath(locale: string, pathname: string): string {
  const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return locale === 'en' ? normalized : `/${locale}${normalized}`;
}

export function marketingAbsoluteUrl(locale: string, pathname: string): string {
  return `${MARKETING_SITE_ORIGIN}${marketingLocalePath(locale, pathname)}`;
}
