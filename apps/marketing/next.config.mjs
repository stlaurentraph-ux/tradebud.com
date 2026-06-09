import path from 'node:path';
import { fileURLToPath } from 'node:url';
import createNextIntlPlugin from 'next-intl/plugin';

const appDir = path.dirname(fileURLToPath(import.meta.url));
const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep Turbopack rooted in apps/marketing (not the monorepo root).
  turbopack: {
    root: appDir,
  },
  // Turbopack NFT currently over-traces static marketing assets into API routes (~750MB).
  // API handlers only need lib/* + node_modules; public/ is served separately on Vercel.
  outputFileTracingExcludes: {
    '/api/**': [
      './public/**',
      './app/**',
      './components/**',
      './content/**',
      './messages/**',
      './email-templates/**',
      './*.md',
      './scripts/**',
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
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
};

export default withNextIntl(nextConfig);
