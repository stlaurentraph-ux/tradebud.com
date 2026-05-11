import { MetadataRoute } from 'next'

const BASE_URL = 'https://tracebud.com'
const locales = ['en', 'es', 'pt', 'fr', 'de', 'nl', 'it', 'id', 'vi', 'am', 'no']
const routes = ['', '/thank-you', '/privacy', '/terms']

export default function sitemap(): MetadataRoute.Sitemap {
  const urls: MetadataRoute.Sitemap = []

  // Generate URLs for each locale and route
  locales.forEach((locale) => {
    routes.forEach((route) => {
      urls.push({
        url: locale === 'en' ? `${BASE_URL}${route}` : `${BASE_URL}/${locale}${route}`,
        lastModified: new Date(),
        changeFrequency: route === '' ? 'daily' : 'weekly',
        priority: route === '' ? 1 : 0.8,
      })
    })
  })

  return urls
}
