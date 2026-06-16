#!/usr/bin/env node
/**
 * Static store-submission gate: required assets, bundle IDs, privacy strings, eas submit wiring.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const strict = process.argv.includes('--strict');

const issues = [];
const warnings = [];

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
}

function requireFile(rel, label) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) {
    issues.push(`Missing ${label}: ${rel}`);
    return null;
  }
  return full;
}

function expectDimensions(fullPath, expectedW, expectedH, label) {
  if (process.platform !== 'darwin') {
    warnings.push(`Skipping dimension check for ${label} (sips available on macOS only).`);
    return;
  }
  const result = spawnSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', fullPath], {
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    warnings.push(`Could not read dimensions for ${label}.`);
    return;
  }
  const w = Number(result.stdout.match(/pixelWidth:\s*(\d+)/)?.[1]);
  const h = Number(result.stdout.match(/pixelHeight:\s*(\d+)/)?.[1]);
  if (w !== expectedW || h !== expectedH) {
    issues.push(`${label} must be ${expectedW}×${expectedH}px (got ${w}×${h}).`);
  }
}

function checkIosScreenshots() {
  const base = 'store-assets/app-store/ios/6.7-inch';
  const required = [
    '01-home.png',
    '02-map-plot.png',
    '03-my-plots.png',
    '04-offline.png',
    '05-backup-settings.png',
  ];
  for (const name of required) {
    const full = requireFile(`${base}/${name}`, `iPhone 6.7" screenshot ${name}`);
    if (full) {
      expectDimensions(full, 1290, 2796, `${base}/${name}`);
    }
  }
}

function checkAppIdentifiers(appJson) {
  const iosId = appJson?.expo?.ios?.bundleIdentifier;
  const androidPkg = appJson?.expo?.android?.package;
  if (iosId !== 'com.tracebud.app') {
    warnings.push(`Unexpected iOS bundleIdentifier: ${iosId ?? 'undefined'}`);
  }
  if (androidPkg !== 'com.tracebud.app') {
    warnings.push(`Unexpected Android package: ${androidPkg ?? 'undefined'}`);
  }
}

function checkPrivacyStrings(appJson) {
  const plist = appJson?.expo?.ios?.infoPlist ?? {};
  const required = {
    NSLocationWhenInUseUsageDescription: 'location (walk plot)',
    NSCameraUsageDescription: 'camera',
    NSPhotoLibraryUsageDescription: 'photo library',
    NSUserNotificationsUsageDescription: 'push notifications',
  };
  for (const [key, label] of Object.entries(required)) {
    const value = plist[key];
    if (!value || String(value).trim().length < 10) {
      issues.push(`app.json missing or too short ios.infoPlist.${key} (${label}).`);
    }
  }
  if (appJson?.expo?.ios?.infoPlist?.ITSAppUsesNonExemptEncryption !== false) {
    warnings.push('Set ios.infoPlist.ITSAppUsesNonExemptEncryption=false for standard export compliance.');
  }
}

function checkEasSubmit(easJson) {
  const ascAppId = easJson?.submit?.production?.ios?.ascAppId;
  if (!ascAppId) {
    issues.push('eas.json missing submit.production.ios.ascAppId.');
  }
  const androidTrack = easJson?.submit?.production?.android?.track;
  if (!androidTrack) {
    warnings.push('eas.json missing submit.production.android.track.');
  }
}

function checkGoogleAssets() {
  const icon = path.join(root, 'store-assets/google-play/app-icon-512.png');
  const feature = path.join(root, 'store-assets/google-play/feature-graphic-1024x500.png');
  const phoneDir = path.join(root, 'store-assets/google-play/phone');
  const missing = [];
  if (!fs.existsSync(icon)) missing.push('app-icon-512.png');
  if (!fs.existsSync(feature)) missing.push('feature-graphic-1024x500.png');
  let phoneCount = 0;
  if (fs.existsSync(phoneDir)) {
    phoneCount = fs.readdirSync(phoneDir).filter((f) => f.endsWith('.png')).length;
  }
  if (missing.length > 0 || phoneCount < 4) {
    const msg = `Google Play assets incomplete (missing: ${missing.join(', ') || 'none'}; phone screenshots: ${phoneCount}). See store-assets/google-play/README.md`;
    if (strict) issues.push(msg);
    else warnings.push(msg);
  } else {
    const iconFull = requireFile('store-assets/google-play/app-icon-512.png', 'Play Store icon');
    if (iconFull) expectDimensions(iconFull, 512, 512, 'Play Store icon');
    const featureFull = requireFile('store-assets/google-play/feature-graphic-1024x500.png', 'Play feature graphic');
    if (featureFull) expectDimensions(featureFull, 1024, 500, 'Play feature graphic');
  }
}

function checkAppIcon() {
  const icon = requireFile('assets/images/icon.png', 'app icon');
  if (icon) {
    expectDimensions(icon, 1024, 1024, 'assets/images/icon.png');
  }
}

function main() {
  requireFile('STORE_OPS_CHECKLIST.md', 'store ops checklist');
  const appJson = readJson('app.json');
  const easJson = readJson('eas.json');

  checkAppIdentifiers(appJson);
  checkPrivacyStrings(appJson);
  checkEasSubmit(easJson);
  checkAppIcon();
  checkIosScreenshots();
  checkGoogleAssets();

  if (warnings.length > 0) {
    for (const warning of warnings) {
      console.warn(`[warn] ${warning}`);
    }
  }

  if (issues.length > 0) {
    for (const issue of issues) {
      console.error(`[error] ${issue}`);
    }
    console.error('\nStore preflight failed. See STORE_OPS_CHECKLIST.md');
    process.exit(1);
  }

  console.log('Store preflight passed.');
  if (warnings.length > 0) {
    console.log(`(${warnings.length} warning(s) — use --strict to fail on Google Play gaps.)`);
  }
}

main();
