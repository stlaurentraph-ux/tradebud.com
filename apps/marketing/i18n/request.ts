import { getRequestConfig } from 'next-intl/server';
import { defaultLocale, isLocale } from '../i18n.config';

export default getRequestConfig(async ({ requestLocale }) => {
  // Get the locale from the request
  let locale = await requestLocale;
  
  // Validate the locale, fallback to default if invalid
  if (!locale || !isLocale(locale)) {
    locale = defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
