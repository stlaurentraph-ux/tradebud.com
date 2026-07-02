#!/usr/bin/env node
/**
 * Create idempotent issue alert rules for tracebud/react-native (EU region).
 *
 * Requires SENTRY_AUTH_TOKEN with alerts:write (and project:read).
 * Create: https://tracebud.sentry.io/settings/account/api/auth-tokens/
 *
 * Usage:
 *   node scripts/setup-sentry-mobile-alerts.mjs
 *   node scripts/setup-sentry-mobile-alerts.mjs --dry-run
 *
 * Token sources (first match wins):
 *   1. SENTRY_AUTH_TOKEN env
 *   2. local/sentry-auth.env (see set-sentry-auth-token-local.mjs)
 */
import {
  loadManifest,
  loadToken,
  listProjectAlertRules,
  sentryFetch,
} from './sentryMobileAlertsLib.mjs';

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const token = loadToken();
  if (!token) {
    console.error(
      'Missing SENTRY_AUTH_TOKEN. Create a token with alerts:write, then:\n' +
        '  node scripts/set-sentry-auth-token-local.mjs <token>\n' +
        '  node scripts/setup-sentry-mobile-alerts.mjs',
    );
    process.exit(1);
  }

  const manifest = loadManifest();
  const { organizationSlug, projectSlug, apiBase, rules } = manifest;
  const listPath = `/api/0/projects/${organizationSlug}/${projectSlug}/rules/`;

  let existing;
  try {
    existing = await listProjectAlertRules(token, manifest);
  } catch (error) {
    console.error(error.message);
    if (error.status === 403) {
      console.error(
        '\nToken needs alerts:write scope. Create at:\n' +
          'https://tracebud.sentry.io/settings/account/api/auth-tokens/',
      );
    }
    process.exit(1);
  }

  const existingNames = new Set(existing.map((rule) => rule.name));

  for (const rule of rules) {
    if (existingNames.has(rule.name)) {
      console.log(`skip (exists): ${rule.name}`);
      continue;
    }

    if (dryRun) {
      console.log(`dry-run create: ${rule.name}`);
      continue;
    }

    const created = await sentryFetch(token, apiBase, listPath, {
      method: 'POST',
      body: JSON.stringify(rule),
    });

    if (!created.res.ok) {
      console.error(`Create failed for "${rule.name}" HTTP ${created.res.status}:`, created.body);
      process.exit(1);
    }

    console.log(`created: ${rule.name} (id ${created.body?.id ?? 'unknown'})`);
  }

  console.log(
    dryRun
      ? 'Dry run complete.'
      : `Done. Review rules: https://tracebud.sentry.io/alerts/rules/?project=${projectSlug}`,
  );
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
