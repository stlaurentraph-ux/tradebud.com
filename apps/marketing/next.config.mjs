import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { withSentryConfig } from '@sentry/nextjs';
import createNextIntlPlugin from 'next-intl/plugin';

const appDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(appDir, '../..');
const marketingPublicFromRepo = path
  .relative(repoRoot, path.join(appDir, 'public'))
  .split(path.sep)
  .join('/');

// Turbopack NFT over-includes static marketing assets in API routes (~750MB on Vercel).
// Match every route-key format Next/Turbopack may use (pathname and app/ prefixed).
// Include monorepo-relative paths because Vercel reports traces as apps/marketing/public.
const apiTraceExcludes = [
  './public/**',
  'public/**',
  '**/public/**',
  `${marketingPublicFromRepo}/**`,
  './app/**',
  './components/**',
  './content/**',
  './messages/**',
  './email-templates/**',
  './*.md',
  './scripts/**',
];

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

function loadInsightSlugRedirects() {
  const raw = fs.readFileSync(path.join(appDir, 'lib/insight-slug-redirects.json'), 'utf8');
  const entries = JSON.parse(raw);
  if (!Array.isArray(entries)) {
    throw new Error('insight-slug-redirects.json must be an array');
  }
  return entries.map((entry) => {
    if (!entry?.from || !entry?.to) {
      throw new Error('Each insight slug redirect requires "from" and "to"');
    }
    return {
      source: `/:locale/insights/${entry.from}`,
      destination: `/:locale/insights/${entry.to}`,
      permanent: true,
    };
  });
}

const apiRouteKeys = [
  '/api/**',
  '/api/leads',
  '/api/waitlist',
  '/api/checklist/**',
  'app/api/**',
  'app/api/leads/route',
  'app/api/waitlist/route',
  'app/api/checklist/download/route',
  'app/api/checklist/signup/route',
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep Turbopack rooted in apps/marketing (not the monorepo root).
  turbopack: {
    root: appDir,
  },
  outputFileTracingExcludes: Object.fromEntries(
    apiRouteKeys.map((routeKey) => [routeKey, apiTraceExcludes]),
  ),
  serverExternalPackages: ['@supabase/supabase-js', 'resend'],
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
  },
  async redirects() {
    return loadInsightSlugRedirects();
  },
};

export default withSentryConfig(withNextIntl(nextConfig), {
  org: process.env.SENTRY_ORG ?? 'tracebud',
  project: process.env.SENTRY_PROJECT ?? 'marketing',
  silent: !process.env.CI,
  widenClientFileUpload: true,
  disableLogger: true,
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
});
