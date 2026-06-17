#!/usr/bin/env node
/**
 * Native Google sign-in redirects to com.googleusercontent.apps.<id>:/oauth2redirect.
 * That scheme must be registered in ios/TracebudOffline/Info.plist (expo prebuild does not
 * always refresh an existing ios/ folder when .env.local changes).
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

const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim();
const plistPath = path.join(root, 'ios/TracebudOffline/Info.plist');

if (!iosClientId) {
  process.exit(0);
}
if (!fs.existsSync(plistPath)) {
  console.warn('[warn] ios/TracebudOffline/Info.plist not found — run expo prebuild first');
  process.exit(0);
}

const match = /^([\w-]+)\.apps\.googleusercontent\.com$/.exec(iosClientId);
if (!match) {
  console.warn('[warn] EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID is not a valid Google client id');
  process.exit(0);
}

const scheme = `com.googleusercontent.apps.${match[1]}`;
let plist = fs.readFileSync(plistPath, 'utf8');

if (plist.includes(`<string>${scheme}</string>`)) {
  process.exit(0);
}

const urlTypesIdx = plist.indexOf('<key>CFBundleURLTypes</key>');
if (urlTypesIdx === -1) {
  console.error('[fail] CFBundleURLTypes missing from Info.plist');
  process.exit(1);
}
const arrayCloseIdx = plist.indexOf('    </array>', urlTypesIdx);
if (arrayCloseIdx === -1) {
  console.error('[fail] Could not locate CFBundleURLTypes array end in Info.plist');
  process.exit(1);
}

const insertBlock = `      <dict>
        <key>CFBundleURLSchemes</key>
        <array>
          <string>${scheme}</string>
        </array>
      </dict>
`;

plist = `${plist.slice(0, arrayCloseIdx)}${insertBlock}${plist.slice(arrayCloseIdx)}`;
fs.writeFileSync(plistPath, plist);
console.log(`[ok] Registered Google OAuth URL scheme in Info.plist: ${scheme}`);
