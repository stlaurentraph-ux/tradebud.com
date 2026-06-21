#!/usr/bin/env node
/**
 * Mint TRACEBUD_SMOKE_BEARER_TOKEN via Supabase Admin (golden demo user).
 *
 * Requires tracebud-backend/.env.local:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 * - SUPABASE_ANON_KEY (for verify step)
 *
 * Run:
 *   npm run smoke:token:mint -w tracebud-backend
 *   npm run smoke:token:mint -w tracebud-backend -- --set-github-secret
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const backendRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const goldenManifestPath = path.join(
  backendRoot,
  '..',
  'product-os/04-quality/golden-staging-tenant.json',
);

function loadEnvFile(relativePath) {
  const fullPath = path.join(backendRoot, relativePath);
  for (const line of readFileSync(fullPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx);
    const value = trimmed.slice(idx + 1);
    if (!process.env[key]) process.env[key] = value;
  }
}

function loadGoldenManifest() {
  return JSON.parse(readFileSync(goldenManifestPath, 'utf8'));
}

function parseArgs(argv) {
  return {
    setGithubSecret: argv.includes('--set-github-secret'),
    outputPath: argv.find((arg) => arg.startsWith('--out='))?.split('=')[1],
  };
}

async function adminFetch(url, serviceRole, pathName, init = {}) {
  const response = await fetch(`${url}${pathName}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${serviceRole}`,
      apikey: serviceRole,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!response.ok) {
    throw new Error(
      `${init.method ?? 'GET'} ${pathName} -> ${response.status}: ${
        typeof body === 'string' ? body : JSON.stringify(body)
      }`,
    );
  }
  return body;
}

async function mintToken() {
  loadEnvFile('.env.local');
  const golden = loadGoldenManifest();
  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, '');
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const anonKey = process.env.SUPABASE_ANON_KEY?.trim();
  const email = golden.smoke.demoExporterEmail;
  const appMetadata = {
    tenant_id: golden.recipientTenantId,
    role: golden.smoke.role,
  };

  if (!supabaseUrl || !serviceRole || !anonKey) {
    throw new Error('Missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or SUPABASE_ANON_KEY in .env.local');
  }

  const users = await adminFetch(supabaseUrl, serviceRole, `/auth/v1/admin/users?email=${encodeURIComponent(email)}`);
  const user = users?.users?.[0];
  if (!user?.id) {
    throw new Error(`Demo user not found: ${email}`);
  }

  await adminFetch(supabaseUrl, serviceRole, `/auth/v1/admin/users/${user.id}`, {
    method: 'PUT',
    body: JSON.stringify({
      email,
      app_metadata: { ...(user.app_metadata ?? {}), ...appMetadata },
      user_metadata: user.user_metadata ?? {},
    }),
  });

  const link = await adminFetch(supabaseUrl, serviceRole, '/auth/v1/admin/generate_link', {
    method: 'POST',
    body: JSON.stringify({ type: 'magiclink', email }),
  });

  const tokenHash = link?.properties?.hashed_token ?? link?.hashed_token;
  if (!tokenHash) {
    throw new Error('generate_link did not return hashed_token');
  }

  const verifyResponse = await fetch(`${supabaseUrl}/auth/v1/verify`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ type: 'magiclink', token_hash: tokenHash }),
  });
  const session = await verifyResponse.json().catch(() => ({}));
  if (!verifyResponse.ok || !session?.access_token) {
    throw new Error(`verify failed: ${JSON.stringify(session)}`);
  }

  return {
    accessToken: session.access_token,
    email,
    tenantId: appMetadata.tenant_id,
    role: appMetadata.role,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const { accessToken, email, tenantId, role } = await mintToken();

  if (args.outputPath) {
    writeFileSync(args.outputPath, accessToken, { mode: 0o600 });
    console.log(`Wrote token to ${args.outputPath}`);
  }

  if (args.setGithubSecret) {
    const inputPath = args.outputPath ?? '/tmp/tracebud-smoke-token.txt';
    if (!args.outputPath) {
      writeFileSync(inputPath, accessToken, { mode: 0o600 });
    }
    const result = spawnSync('gh', ['secret', 'set', 'TRACEBUD_SMOKE_BEARER_TOKEN'], {
      input: accessToken,
      stdio: ['pipe', 'inherit', 'inherit'],
    });
    if (result.status !== 0) {
      process.exit(result.status ?? 1);
    }
    if (!args.outputPath) {
      writeFileSync(inputPath, '', { mode: 0o600 });
    }
    console.log('Updated GitHub secret TRACEBUD_SMOKE_BEARER_TOKEN');
  }

  if (!args.setGithubSecret && !args.outputPath) {
    console.log(`Minted smoke token for ${email} (${tenantId}, ${role})`);
    console.log('Pass to gh secret set TRACEBUD_SMOKE_BEARER_TOKEN or rerun with --set-github-secret');
    console.log(`expires_at=${new Date(JSON.parse(Buffer.from(accessToken.split('.')[1], 'base64url').toString()).exp * 1000).toISOString()}`);
  }
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
