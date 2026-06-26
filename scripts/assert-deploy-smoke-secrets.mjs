#!/usr/bin/env node
/**
 * Assert post-deploy smoke prerequisites (production-readiness audit H23).
 *
 * When DEPLOY_SMOKE_STRICT=1 (main push / production deploy hooks), missing
 * required env exits 1. Otherwise logs guidance and exits 0 so manual
 * workflow_dispatch can still no-op when secrets are absent.
 *
 * Usage:
 *   DEPLOY_SMOKE_STRICT=1 node scripts/assert-deploy-smoke-secrets.mjs backend
 */
const PROFILES = {
  backend: {
    label: 'Backend post-deploy smoke',
    baseUrlEnv: 'UPTIME_BACKEND_BASE_URL',
    requiresAuth: true,
  },
  dashboard: {
    label: 'Dashboard post-deploy smoke',
    baseUrlEnv: 'DASHBOARD_BASE_URL',
    requiresAuth: true,
  },
  marketing: {
    label: 'Marketing post-deploy smoke',
    baseUrlEnv: 'MARKETING_SMOKE_BASE_URL',
    requiresAuth: false,
  },
};

function isStrict() {
  return process.env.DEPLOY_SMOKE_STRICT === '1';
}

function hasSmokeAuth() {
  const mintConfigured = Boolean(
    process.env.SUPABASE_URL?.trim() &&
      process.env.SUPABASE_ANON_KEY?.trim() &&
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
  );
  const legacyToken = Boolean(process.env.TRACEBUD_SMOKE_BEARER_TOKEN?.trim());
  return mintConfigured || legacyToken;
}

function resolveProfile() {
  const name = process.argv[2]?.trim();
  const profile = PROFILES[name];
  if (!profile) {
    console.error(`Usage: node scripts/assert-deploy-smoke-secrets.mjs <${Object.keys(PROFILES).join('|')}>`);
    process.exit(1);
  }
  return profile;
}

function failOrSkip(profile, detail) {
  const prefix = `${profile.label}: ${detail}`;
  if (isStrict()) {
    console.error(prefix);
    console.error('Configure GitHub Actions secrets before merging deploy changes to main.');
    process.exit(1);
  }
  console.log(`${prefix} — skipping (non-strict manual dispatch).`);
  process.exit(0);
}

function main() {
  const profile = resolveProfile();
  const baseUrl = process.env[profile.baseUrlEnv]?.trim();

  if (!baseUrl) {
    failOrSkip(profile, `${profile.baseUrlEnv} is not configured`);
  }

  if (profile.requiresAuth && !hasSmokeAuth()) {
    failOrSkip(
      profile,
      'smoke auth is not configured (set SUPABASE_URL + SUPABASE_ANON_KEY + SUPABASE_SERVICE_ROLE_KEY or TRACEBUD_SMOKE_BEARER_TOKEN)',
    );
  }

  console.log(`${profile.label}: prerequisites OK (${profile.baseUrlEnv}).`);
}

main();
