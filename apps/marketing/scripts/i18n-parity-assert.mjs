#!/usr/bin/env node
/**
 * Fail CI when locale files are missing marketing.* or header.* keys from en.json.
 * Prevents next-intl MISSING_MESSAGE failures at static generation time.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const messagesDir = path.join(__dirname, '../messages');

const locales = ['en', 'fr', 'es', 'pt', 'id', 'vi', 'de', 'nl', 'it', 'am', 'no'];
const namespaces = ['marketing', 'header'];

function collectLeafPaths(value, prefix) {
  const paths = [];
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return paths;
  }
  for (const key of Object.keys(value)) {
    const pathKey = prefix ? `${prefix}.${key}` : key;
    const child = value[key];
    if (child !== null && typeof child === 'object' && !Array.isArray(child)) {
      paths.push(...collectLeafPaths(child, pathKey));
    } else {
      paths.push(pathKey);
    }
  }
  return paths;
}

function getNested(messages, dottedPath) {
  return dottedPath.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), messages);
}

const enMessages = JSON.parse(fs.readFileSync(path.join(messagesDir, 'en.json'), 'utf8'));
const requiredPaths = namespaces.flatMap((ns) => {
  if (!enMessages[ns]) {
    console.error(`en.json missing namespace: ${ns}`);
    process.exit(1);
  }
  return collectLeafPaths(enMessages[ns], ns);
});

const missing = [];

for (const locale of locales) {
  if (locale === 'en') continue;

  const filePath = path.join(messagesDir, `${locale}.json`);
  const messages = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  for (const pathKey of requiredPaths) {
    const value = getNested(messages, pathKey);
    if (value === undefined) {
      missing.push({ locale, pathKey });
    }
  }
}

if (missing.length > 0) {
  console.error(`Marketing i18n parity failed (${missing.length} missing keys):`);
  for (const entry of missing.slice(0, 40)) {
    console.error(`  ${entry.locale}: ${entry.pathKey}`);
  }
  if (missing.length > 40) {
    console.error(`  ... and ${missing.length - 40} more`);
  }
  console.error('\nRun: node apps/marketing/scripts/merge-marketing-i18n.mjs');
  process.exit(1);
}

console.log(
  `Marketing i18n parity OK (${requiredPaths.length} keys × ${locales.length - 1} locales)`,
);
