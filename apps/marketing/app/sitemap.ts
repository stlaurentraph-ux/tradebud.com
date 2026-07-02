import { MetadataRoute } from 'next';

import { getIndexableInsightSitemapEntries, insightsHubIsIndexable } from '@/lib/insight-seo';
import { marketingAbsoluteUrl } from '@/lib/marketing-site-url';

const BASE_URL = 'https://tracebud.com';
const locales = ['en', 'es', 'pt', 'fr', 'de', 'nl', 'it', 'id', 'vi', 'am', 'no'];
const routes = ['', '/thank-you', '/privacy', '/terms'];

export default function sitemap(): MetadataRoute.Sitemap {
  const urls: MetadataRoute.Sitemap = [];

  locales.forEach((locale) => {
    routes.forEach((route) => {
      urls.push({
        url: locale === 'en' ? `${BASE_URL}${route}` : `${BASE_URL}/${locale}${route}`,
        lastModified: new Date(),
        changeFrequency: route === '' ? 'daily' : 'weekly',
        priority: route === '' ? 1 : 0.8,
      });
    });
  });

  if (insightsHubIsIndexable()) {
    urls.push({
      url: marketingAbsoluteUrl('en', '/insights'),
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.85,
    });
  }

  for (const entry of getIndexableInsightSitemapEntries()) {
    urls.push({
      url: marketingAbsoluteUrl(entry.locale, `/insights/${entry.slug}`),
      lastModified: entry.lastModified,
      changeFrequency: 'monthly',
      priority: 0.75,
    });
  }

  return urls;
}
