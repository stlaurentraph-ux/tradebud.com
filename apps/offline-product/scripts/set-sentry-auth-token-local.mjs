#!/usr/bin/env node
/**
 * Store SENTRY_AUTH_TOKEN in .env.sentry.local (gitignored) for local release preflight.
 * EAS production already has this secret; it cannot be read back via `eas env:get`.
 *
 * Usage:
 *   node scripts/set-sentry-auth-token-local.mjs
 *   node scripts/set-sentry-auth-token-local.mjs sntrys_...
 *
 * Create a token: https://tracebud.sentry.io/settings/account/api/auth-tokens/
 * Scopes: org:read, project:releases (project: react-native)
 */
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const targetPath = path.join(root, '.env.sentry.local');
const SENTRY_ORG = 'tracebud';
const SENTRY_PROJECT = 'react-native';

async function readTokenFromStdin() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stderr });
  return new Promise((resolve) => {
    rl.question('Paste SENTRY_AUTH_TOKEN (input hidden): ', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function verifyToken(token) {
  const res = await fetch(
    `https://sentry.io/api/0/projects/${SENTRY_ORG}/${SENTRY_PROJECT}/`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (res.ok) return;
  const euRes = await fetch(
    `https://de.sentry.io/api/0/projects/${SENTRY_ORG}/${SENTRY_PROJECT}/`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (euRes.ok) return;
  throw new Error(`Token could not access ${SENTRY_ORG}/${SENTRY_PROJECT} (HTTP ${res.status})`);
}

async function main() {
  let token = process.argv[2]?.trim() || process.env.SENTRY_AUTH_TOKEN?.trim();
  if (!token) {
    token = await readTokenFromStdin();
  }
  if (!token) {
    console.error('No token provided.');
    process.exit(1);
  }

  await verifyToken(token);

  const body = [
    '# Local only — gitignored. Mirrors EAS production SENTRY_AUTH_TOKEN for release preflight.',
    `SENTRY_AUTH_TOKEN=${token}`,
    '',
  ].join('\n');
  fs.writeFileSync(targetPath, body, { mode: 0o600 });
  console.log(`Wrote ${path.relative(root, targetPath)}`);
  console.log('Verify: npm run release:preflight:production');
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
