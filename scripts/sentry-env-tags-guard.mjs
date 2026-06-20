#!/usr/bin/env node
/**
 * Guardrail 2.1 — Sentry environment tags for marketing, dashboard, and backend.
 *
 * Run: npm run sentry:env:assert
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  assertDeployedSentryEnvironment,
  resolveSentryEnvironment,
} from './lib/sentry-environment.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, '..');

const APPS = [
  {
    id: 'dashboard',
    sentryOptions: 'apps/dashboard-product/lib/observability/sentry-options.ts',
    envExample: 'apps/dashboard-product/.env.production.example',
    explicitEnvKey: 'NEXT_PUBLIC_SENTRY_ENVIRONMENT',
    initFiles: [
      'apps/dashboard-product/sentry.client.config.ts',
      'apps/dashboard-product/sentry.server.config.ts',
      'apps/dashboard-product/sentry.edge.config.ts',
    ],
  },
  {
    id: 'marketing',
    sentryOptions: 'apps/marketing/lib/observability/sentry-options.ts',
    envExample: 'apps/marketing/.env.production.example',
    explicitEnvKey: 'NEXT_PUBLIC_SENTRY_ENVIRONMENT',
    initFiles: [
      'apps/marketing/sentry.client.config.ts',
      'apps/marketing/sentry.server.config.ts',
      'apps/marketing/sentry.edge.config.ts',
    ],
  },
  {
    id: 'backend',
    sentryOptions: 'tracebud-backend/src/observability/sentry-options.ts',
    envExample: 'tracebud-backend/.env.production.example',
    explicitEnvKey: 'SENTRY_ENVIRONMENT',
    initFiles: ['tracebud-backend/src/instrument.ts'],
  },
];

function readRepo(relativePath) {
  const fullPath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing required file: ${relativePath}`);
  }
  return fs.readFileSync(fullPath, 'utf8');
}

function assertIncludes(relativePath, needle, message) {
  const source = readRepo(relativePath);
  if (!source.includes(needle)) {
    throw new Error(`${relativePath}: ${message}`);
  }
}

function assertResolverCases() {
  assertDeployedSentryEnvironment(
    resolveSentryEnvironment({ VERCEL_ENV: 'preview' }),
    'Vercel preview',
  );
  assertDeployedSentryEnvironment(
    resolveSentryEnvironment({ VERCEL_ENV: 'production' }),
    'Vercel production',
  );
  assertDeployedSentryEnvironment(
    resolveSentryEnvironment({ RAILWAY_ENVIRONMENT_NAME: 'staging' }),
    'Railway staging',
  );
  assertDeployedSentryEnvironment(
    resolveSentryEnvironment({
      NEXT_PUBLIC_SENTRY_ENVIRONMENT: 'staging',
    }),
    'Explicit NEXT_PUBLIC_SENTRY_ENVIRONMENT',
  );
  assertDeployedSentryEnvironment(
    resolveSentryEnvironment({ SENTRY_ENVIRONMENT: 'production' }),
    'Explicit SENTRY_ENVIRONMENT',
  );

  const local = resolveSentryEnvironment({ NODE_ENV: 'development' });
  if (local !== 'development') {
    throw new Error(`Expected local development tag, got "${local}"`);
  }
}

function assertApp(app) {
  const optionsSource = readRepo(app.sentryOptions);
  if (!optionsSource.includes('getSentryEnvironment')) {
    throw new Error(`${app.sentryOptions}: missing getSentryEnvironment()`);
  }
  if (!optionsSource.includes('getBaseSentryOptions')) {
    throw new Error(`${app.sentryOptions}: missing getBaseSentryOptions()`);
  }
  if (!optionsSource.includes('environment: getSentryEnvironment()')) {
    throw new Error(`${app.sentryOptions}: Sentry init must set environment tag`);
  }

  assertIncludes(
    app.envExample,
    `${app.explicitEnvKey}=`,
    `document ${app.explicitEnvKey} for deploy parity`,
  );

  for (const initFile of app.initFiles) {
    assertIncludes(initFile, 'getBaseSentryOptions', 'Sentry init must use shared options');
  }
}

function main() {
  for (const app of APPS) {
    assertApp(app);
  }
  assertResolverCases();
  console.log(
    `Sentry env tag guard passed (${APPS.length} apps, staging/production resolver verified).`,
  );
}

main();
