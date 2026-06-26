#!/usr/bin/env node
/**
 * Resolve TRACEBUD_SMOKE_BEARER_TOKEN for deploy smoke workflows.
 *
 * Priority:
 * 1. Mint fresh token when SUPABASE_URL + SUPABASE_ANON_KEY + SUPABASE_SERVICE_ROLE_KEY are set
 * 2. Fall back to existing TRACEBUD_SMOKE_BEARER_TOKEN env (legacy GitHub secret)
 *
 * In GitHub Actions with --github-env, writes TRACEBUD_SMOKE_BEARER_TOKEN to GITHUB_ENV.
 */
import { appendFileSync } from 'node:fs';
import { mintSmokeBearerToken } from './mint-smoke-bearer-token.mjs';

function hasMintCredentials() {
  return Boolean(
    process.env.SUPABASE_URL?.trim() &&
      process.env.SUPABASE_ANON_KEY?.trim() &&
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
  );
}

function writeGithubEnv(accessToken) {
  const githubEnv = process.env.GITHUB_ENV;
  if (!githubEnv) {
    throw new Error('GITHUB_ENV is not set');
  }
  appendFileSync(githubEnv, `TRACEBUD_SMOKE_BEARER_TOKEN=${accessToken}\n`);
}

async function main() {
  const useGithubEnv = process.argv.includes('--github-env');

  if (hasMintCredentials()) {
    const { accessToken, email, tenantId, role } = await mintSmokeBearerToken({ skipEnvFile: true });
    if (useGithubEnv) {
      writeGithubEnv(accessToken);
      console.log(`Minted fresh smoke bearer for ${email} (${tenantId}, ${role})`);
      return;
    }
    process.stdout.write(accessToken);
    return;
  }

  const legacyToken = process.env.TRACEBUD_SMOKE_BEARER_TOKEN?.trim();
  if (legacyToken) {
    if (useGithubEnv) {
      writeGithubEnv(legacyToken);
    }
    console.log('Using legacy TRACEBUD_SMOKE_BEARER_TOKEN (add Supabase mint secrets to auto-refresh each run).');
    return;
  }

  if (process.env.DEPLOY_SMOKE_STRICT === '1') {
    console.error(
      'Smoke auth not configured — required for deploy smoke on main/production (SUPABASE_URL + SUPABASE_ANON_KEY + SUPABASE_SERVICE_ROLE_KEY or TRACEBUD_SMOKE_BEARER_TOKEN).',
    );
    process.exit(1);
  }

  console.log('Smoke auth not configured — downstream smoke step will skip.');
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
