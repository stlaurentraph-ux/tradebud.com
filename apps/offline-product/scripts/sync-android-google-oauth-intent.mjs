#!/usr/bin/env node
/**
 * Native Google sign-in redirects to com.googleusercontent.apps.<id>:/oauth2redirect.
 * That scheme must be registered in android/app/src/main/AndroidManifest.xml (expo prebuild
 * does not refresh an existing android/ folder when .env.local changes).
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

const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim();
const manifestPath = path.join(root, 'android/app/src/main/AndroidManifest.xml');

if (!androidClientId) {
  process.exit(0);
}
if (!fs.existsSync(manifestPath)) {
  console.warn('[warn] android/app/src/main/AndroidManifest.xml not found — run expo prebuild first');
  process.exit(0);
}

const match = /^([\w-]+)\.apps\.googleusercontent\.com$/.exec(androidClientId);
if (!match) {
  console.warn('[warn] EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID is not a valid Google client id');
  process.exit(0);
}

const scheme = `com.googleusercontent.apps.${match[1]}`;
let manifest = fs.readFileSync(manifestPath, 'utf8');

if (manifest.includes(`android:scheme="${scheme}"`)) {
  console.log(`[ok] AndroidManifest already includes Google OAuth scheme (${scheme})`);
  process.exit(0);
}

const activityCloseIdx = manifest.indexOf('    </activity>');
if (activityCloseIdx === -1) {
  console.error('[fail] Could not locate MainActivity closing tag in AndroidManifest.xml');
  process.exit(1);
}

const insertBlock = `      <intent-filter>
        <action android:name="android.intent.action.VIEW"/>
        <category android:name="android.intent.category.DEFAULT"/>
        <category android:name="android.intent.category.BROWSABLE"/>
        <data android:scheme="${scheme}" android:path="/oauth2redirect"/>
      </intent-filter>
`;

manifest = `${manifest.slice(0, activityCloseIdx)}${insertBlock}${manifest.slice(activityCloseIdx)}`;
fs.writeFileSync(manifestPath, manifest);
console.log(`[ok] Registered Google OAuth intent filter in AndroidManifest.xml: ${scheme}:/oauth2redirect`);
