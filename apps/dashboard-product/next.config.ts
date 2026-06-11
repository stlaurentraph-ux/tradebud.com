import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Keep defaults for local/project-root resolution.
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG ?? 'tracebud',
  project: process.env.SENTRY_PROJECT ?? 'dashboard',
  silent: !process.env.CI,
  widenClientFileUpload: true,
  disableLogger: true,
  automaticVercelMonitors: true,
});
