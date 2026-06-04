import fs from 'node:fs';
import path from 'node:path';

const VALID_PROFILES = new Set(['preview', 'production']);

function parseProfile(argv) {
  const profileArg = argv.find((arg) => arg.startsWith('--profile='));
  const profile = profileArg ? profileArg.split('=')[1] : 'production';
  if (!VALID_PROFILES.has(profile)) {
    throw new Error(`Invalid --profile. Use one of: ${[...VALID_PROFILES].join(', ')}`);
  }
  return profile;
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

function readEasJson(projectRoot) {
  const easPath = path.join(projectRoot, 'eas.json');
  const raw = fs.readFileSync(easPath, 'utf8');
  return JSON.parse(raw);
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

function main() {
  const profile = parseProfile(process.argv.slice(2));
  const projectRoot = process.cwd();
  loadEnvFileIfPresent(path.join(projectRoot, '.env.local'));
  loadEnvFileIfPresent(path.join(projectRoot, '.env'));
  const issues = [];
  const warnings = [];

  const apiUrl = requireEnv('EXPO_PUBLIC_API_URL', issues);
  requireEnv('EXPO_PUBLIC_SUPABASE_URL', issues);
  requireEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY', issues);

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

  const allowTestAuth = process.env.EXPO_PUBLIC_ALLOW_TEST_AUTH === '1';
  const allowLocalhostApi = process.env.EXPO_PUBLIC_ALLOW_LOCALHOST_API === '1';
  const allowInsecureApi = process.env.EXPO_PUBLIC_ALLOW_INSECURE_API === '1';

  if (profile === 'production') {
    if (allowTestAuth) issues.push('Production preflight forbids EXPO_PUBLIC_ALLOW_TEST_AUTH=1.');
    if (allowLocalhostApi) issues.push('Production preflight forbids EXPO_PUBLIC_ALLOW_LOCALHOST_API=1.');
    if (allowInsecureApi) issues.push('Production preflight forbids EXPO_PUBLIC_ALLOW_INSECURE_API=1.');
  } else {
    if (allowTestAuth) warnings.push('Preview is using EXPO_PUBLIC_ALLOW_TEST_AUTH=1 (testing-only).');
    if (allowLocalhostApi) warnings.push('Preview allows localhost API; ensure testers can still reach backend.');
    if (allowInsecureApi) warnings.push('Preview allows insecure HTTP API transport.');
  }

  const eas = readEasJson(projectRoot);
  checkEasConfig(eas, profile, issues);

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
}

main();
