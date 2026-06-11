#!/usr/bin/env node
/**
 * Generate Sign in with Apple OAuth client secret (JWT) for Supabase.
 *
 * Required env:
 *   APPLE_TEAM_ID
 *   APPLE_KEY_ID
 *   APPLE_SERVICES_ID   (Services ID, e.g. com.tracebud.auth)
 *   APPLE_PRIVATE_KEY_PATH  (path to AuthKey_XXXX.p8)
 *
 * Usage:
 *   node scripts/generate-apple-oauth-secret.mjs
 *   APPLE_OAUTH_SECRET=$(node scripts/generate-apple-oauth-secret.mjs)
 */
import { createPrivateKey, sign } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    console.error(`Missing ${name}`);
    process.exit(1);
  }
  return value;
}

function base64urlJson(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

const teamId = required('APPLE_TEAM_ID');
const keyId = required('APPLE_KEY_ID');
const clientId = required('APPLE_SERVICES_ID');
const keyPath = resolve(required('APPLE_PRIVATE_KEY_PATH'));
const privateKeyPem = readFileSync(keyPath, 'utf8');

const header = base64urlJson({ alg: 'ES256', kid: keyId });
const now = Math.floor(Date.now() / 1000);
const payload = base64urlJson({
  iss: teamId,
  iat: now,
  exp: now + 15_777_000,
  aud: 'https://appleid.apple.com',
  sub: clientId,
});

const unsigned = `${header}.${payload}`;
const key = createPrivateKey(privateKeyPem);
const signature = sign('sha256', Buffer.from(unsigned), {
  key,
  dsaEncoding: 'ieee-p1363',
});

process.stdout.write(`${unsigned}.${signature.toString('base64url')}`);
