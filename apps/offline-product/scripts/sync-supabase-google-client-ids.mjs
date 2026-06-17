#!/usr/bin/env node
/**
 * Register iOS/Android Google OAuth client IDs in Supabase (required for native signInWithIdToken).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(path.join(root, '.env'));
loadEnvFile(path.join(root, '.env.local'));

const accessToken = process.env.SUPABASE_ACCESS_TOKEN?.trim();
const projectRef =
  process.env.SUPABASE_PROJECT_REF?.trim() ||
  (() => {
    try {
      return new URL(process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').hostname.split('.')[0];
    } catch {
      return '';
    }
  })();

const webId =
  process.env.GOOGLE_OAUTH_CLIENT_ID?.trim() ||
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim();
const iosId =
  process.env.GOOGLE_OAUTH_IOS_CLIENT_ID?.trim() ||
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim();
const androidId =
  process.env.GOOGLE_OAUTH_ANDROID_CLIENT_ID?.trim() ||
  process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim();

if (!accessToken || !projectRef) {
  console.error('Set SUPABASE_ACCESS_TOKEN and EXPO_PUBLIC_SUPABASE_URL in .env.local');
  process.exit(1);
}
if (!webId) {
  console.error('Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in .env.local');
  process.exit(1);
}

const getRes = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
  headers: { Authorization: `Bearer ${accessToken}` },
});
if (!getRes.ok) {
  console.error(`GET auth config failed (${getRes.status}):`, await getRes.text());
  process.exit(1);
}

const current = await getRes.json();
const merged = [...new Set([webId, iosId, androidId].filter(Boolean))];
const patch = {
  external_google_client_id: merged.join(','),
};

const patchRes = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
  method: 'PATCH',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(patch),
});

if (!patchRes.ok) {
  console.error(`PATCH auth config failed (${patchRes.status}):`, await patchRes.text());
  process.exit(1);
}

console.log('[ok] Supabase Google client IDs:');
for (const id of merged) {
  console.log(`  - ${id}`);
}
