import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { sentryAuthEnvPath } from './sentryAuthEnvPath.mjs';

const VALID_PROFILES = new Set(['preview', 'production']);

const TEST_CREDENTIAL_KEYS = [
  'EXPO_PUBLIC_TRACEBUD_TEST_EMAIL',
  'EXPO_PUBLIC_TRACEBUD_TEST_PASSWORD',
];

const DEV_ONLY_FLAGS = [
  'EXPO_PUBLIC_ALLOW_TEST_AUTH',
  'EXPO_PUBLIC_ALLOW_LOCALHOST_API',
  'EXPO_PUBLIC_ALLOW_INSECURE_API',
];

function parseArgs(argv) {
  const profileArg = argv.find((arg) => arg.startsWith('--profile='));
  const profile = profileArg ? profileArg.split('=')[1] : 'production';
  if (!VALID_PROFILES.has(profile)) {
    throw new Error(`Invalid --profile. Use one of: ${[...VALID_PROFILES].join(', ')}`);
  }
  const verifyOAuth = argv.includes('--verify-oauth');
  return { profile, verifyOAuth };
}

function loadEnvFileIfPresent(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx <= 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

function loadEasProfileEnv(eas, profile, { override = false } = {}) {
  const env = eas?.build?.[profile]?.env;
  if (!env || typeof env !== 'object') return;
  for (const [key, value] of Object.entries(env)) {
    if (value == null || String(value).trim() === '') continue;
    if (override || !process.env[key]) {
      process.env[key] = String(value).trim();
    }
  }
}

function requireEnv(name, issues) {
  const value = process.env[name];
  if (!value || String(value).trim().length === 0) {
    issues.push(`Missing required env var: ${name}`);
    return null;
  }
  return String(value).trim();
}

function isLocalhost(url) {
  return /:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?(?:\/|$)/i.test(url);
}

function isTruthyFlag(value) {
  return value === '1' || value === 'true';
}

function readEasJson(projectRoot) {
  const easPath = path.join(projectRoot, 'eas.json');
  const raw = fs.readFileSync(easPath, 'utf8');
  return JSON.parse(raw);
}

function readAppJson(projectRoot) {
  const appPath = path.join(projectRoot, 'app.json');
  return JSON.parse(fs.readFileSync(appPath, 'utf8'));
}

function checkEasConfig(eas, profile, issues) {
  if (!eas?.build?.[profile]) {
    issues.push(`eas.json missing build profile: ${profile}`);
    return;
  }
  const expectedChannel = profile;
  const configuredChannel = eas.build[profile]?.channel;
  if (configuredChannel !== expectedChannel) {
    issues.push(
      `eas.json profile "${profile}" channel mismatch: expected "${expectedChannel}", got "${configuredChannel ?? 'undefined'}"`,
    );
  }
}

function checkEasProjectId(appJson, profile, issues) {
  const projectId = appJson?.expo?.extra?.eas?.projectId;
  if (!projectId || String(projectId).trim().length === 0) {
    issues.push('app.json missing expo.extra.eas.projectId (required for Expo push tokens).');
    return;
  }
  if (profile === 'production' && !/^[0-9a-f-]{36}$/i.test(String(projectId))) {
    issues.push(`app.json expo.extra.eas.projectId does not look like a UUID: ${projectId}`);
  }
}

function checkAppConfigPush(projectRoot, profile, warnings) {
  if (profile !== 'production') return;
  const configPath = path.join(projectRoot, 'app.config.js');
  if (!fs.existsSync(configPath)) {
    warnings.push('app.config.js not found; cannot verify expo-notifications plugin wiring.');
    return;
  }
  const text = fs.readFileSync(configPath, 'utf8');
  if (!text.includes('expo-notifications')) {
    warnings.push('app.config.js does not reference expo-notifications for production builds.');
  }
  if (!text.includes('aps-environment')) {
    warnings.push('app.config.js does not set iOS aps-environment for production push.');
  }
}

function checkEnvMapForProduction(envMap, label, issues) {
  if (!envMap || typeof envMap !== 'object') return;
  for (const key of DEV_ONLY_FLAGS) {
    if (isTruthyFlag(envMap[key])) {
      issues.push(`${label} sets ${key}=1 (forbidden for production).`);
    }
  }
  for (const key of TEST_CREDENTIAL_KEYS) {
    const value = envMap[key];
    if (value != null && String(value).trim().length > 0) {
      issues.push(`${label} sets ${key} (forbidden for production).`);
    }
  }
}

function checkProcessEnvProduction(issues) {
  for (const key of TEST_CREDENTIAL_KEYS) {
    const value = process.env[key];
    if (value != null && String(value).trim().length > 0) {
      issues.push(`Production preflight forbids ${key} in the environment.`);
    }
  }
}

function validateSentryDsn(dsn, issues) {
  if (!dsn) return;
  try {
    const parsed = new URL(dsn);
    if (parsed.protocol !== 'https:') {
      issues.push('EXPO_PUBLIC_SENTRY_DSN must use HTTPS.');
    }
    if (!parsed.hostname.includes('sentry')) {
      issues.push('EXPO_PUBLIC_SENTRY_DSN hostname does not look like a Sentry ingest URL.');
    }
  } catch {
    issues.push('EXPO_PUBLIC_SENTRY_DSN is not a valid URL.');
  }
}

function validateSupabaseUrl(supabaseUrl, profile, issues) {
  if (!supabaseUrl) return;
  let parsed;
  try {
    parsed = new URL(supabaseUrl);
  } catch {
    issues.push(`EXPO_PUBLIC_SUPABASE_URL is not a valid URL: ${supabaseUrl}`);
    return;
  }
  if (profile === 'production' && parsed.protocol !== 'https:') {
    issues.push('Production preflight requires EXPO_PUBLIC_SUPABASE_URL to use HTTPS.');
  }
  if (profile === 'production' && isLocalhost(supabaseUrl)) {
    issues.push('Production preflight forbids localhost Supabase URLs.');
  }
  if (!parsed.hostname.includes('supabase') && !parsed.hostname.endsWith('tracebud.com')) {
    issues.push(
      'EXPO_PUBLIC_SUPABASE_URL should use auth.tracebud.com (or *.supabase.co for local dev only).',
    );
  }
  if (profile === 'production' && parsed.hostname.endsWith('.supabase.co')) {
    issues.push(
      'Production builds should use https://auth.tracebud.com so Google sign-in shows Tracebud, not *.supabase.co.',
    );
  }
}

function validateAnonKey(anonKey, issues) {
  if (!anonKey) return;
  if (anonKey.length < 100) {
    issues.push('EXPO_PUBLIC_SUPABASE_ANON_KEY looks too short.');
  }
  if (!anonKey.startsWith('eyJ')) {
    issues.push('EXPO_PUBLIC_SUPABASE_ANON_KEY does not look like a JWT.');
  }
}

function runOAuthVerify(projectRoot) {
  const script = path.join(projectRoot, 'scripts', 'verify-oauth-providers.mjs');
  const result = spawnSync(process.execPath, [script], {
    cwd: projectRoot,
    stdio: 'inherit',
    env: process.env,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function main() {
  const { profile, verifyOAuth } = parseArgs(process.argv.slice(2));
  const projectRoot = process.cwd();
  loadEnvFileIfPresent(path.join(projectRoot, '.env.local'));
  loadEnvFileIfPresent(path.join(projectRoot, '.env.production.local'));
  loadEnvFileIfPresent(sentryAuthEnvPath(projectRoot));
  loadEnvFileIfPresent(path.join(projectRoot, '.env'));

  const eas = readEasJson(projectRoot);
  // eas.json profile env wins over .env.local for release checks (local may use LAN API for dev).
  loadEasProfileEnv(eas, profile, { override: true });

  const issues = [];
  const warnings = [];

  const apiUrl = requireEnv('EXPO_PUBLIC_API_URL', issues);
  const supabaseUrl = requireEnv('EXPO_PUBLIC_SUPABASE_URL', issues);
  const anonKey = requireEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY', issues);

  if (apiUrl) {
    let parsed;
    try {
      parsed = new URL(apiUrl);
    } catch {
      issues.push(`EXPO_PUBLIC_API_URL is not a valid URL: ${apiUrl}`);
    }
    if (parsed) {
      if (profile === 'production' && parsed.protocol !== 'https:') {
        issues.push('Production preflight requires EXPO_PUBLIC_API_URL to use HTTPS.');
      }
      if (profile === 'production' && isLocalhost(apiUrl)) {
        issues.push('Production preflight forbids localhost/127.0.0.1 API URLs.');
      }
    }
  }

  validateSupabaseUrl(supabaseUrl, profile, issues);
  validateAnonKey(anonKey, issues);

  if (!process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim()) {
    issues.push(
      'Missing EXPO_PUBLIC_GOOGLE_MAPS_API_KEY (required for Android field maps — enable Maps SDK for Android in Google Cloud).',
    );
  }

  const allowTestAuth = isTruthyFlag(process.env.EXPO_PUBLIC_ALLOW_TEST_AUTH);
  const allowLocalhostApi = isTruthyFlag(process.env.EXPO_PUBLIC_ALLOW_LOCALHOST_API);
  const allowInsecureApi = isTruthyFlag(process.env.EXPO_PUBLIC_ALLOW_INSECURE_API);

  if (profile === 'production') {
    checkProcessEnvProduction(issues);
    checkEnvMapForProduction(eas?.build?.production?.env, 'eas.json production profile', issues);

    if (allowTestAuth) issues.push('Production preflight forbids EXPO_PUBLIC_ALLOW_TEST_AUTH=1.');
    if (allowLocalhostApi) issues.push('Production preflight forbids EXPO_PUBLIC_ALLOW_LOCALHOST_API=1.');
    if (allowInsecureApi) issues.push('Production preflight forbids EXPO_PUBLIC_ALLOW_INSECURE_API=1.');

    const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN?.trim();
    if (!sentryDsn) {
      issues.push(
        'Production preflight requires EXPO_PUBLIC_SENTRY_DSN (set in .env.local or EAS production secrets).',
      );
    } else {
      validateSentryDsn(sentryDsn, issues);
    }

    if (!process.env.SENTRY_AUTH_TOKEN?.trim()) {
      warnings.push(
        'SENTRY_AUTH_TOKEN is unset; production builds will not upload source maps to Sentry. Run: eas secret:create --name SENTRY_AUTH_TOKEN',
      );
    }

    const sentryEnv = process.env.EXPO_PUBLIC_SENTRY_ENVIRONMENT?.trim();
    if (sentryEnv && sentryEnv !== 'production') {
      warnings.push(
        `EXPO_PUBLIC_SENTRY_ENVIRONMENT is "${sentryEnv}" (expected "production" for store builds).`,
      );
    }
  } else {
    if (allowTestAuth) warnings.push('Preview is using EXPO_PUBLIC_ALLOW_TEST_AUTH=1 (testing-only).');
    if (allowLocalhostApi) warnings.push('Preview allows localhost API; ensure testers can still reach backend.');
    if (allowInsecureApi) warnings.push('Preview allows insecure HTTP API transport.');
  }

  checkEasConfig(eas, profile, issues);
  const appJson = readAppJson(projectRoot);
  checkEasProjectId(appJson, profile, issues);
  checkAppConfigPush(projectRoot, profile, warnings);

  if (warnings.length > 0) {
    for (const warning of warnings) {
      console.warn(`[warn] ${warning}`);
    }
  }

  if (issues.length > 0) {
    for (const issue of issues) {
      console.error(`[error] ${issue}`);
    }
    console.error(`Preflight failed for profile "${profile}".`);
    process.exit(1);
  }

  console.log(`Preflight passed for profile "${profile}".`);

  if (verifyOAuth) {
    console.log('\nRunning OAuth provider verification…');
    runOAuthVerify(projectRoot);
  }
}

main();
