#!/usr/bin/env node
/**
 * Merge Luganda payload into features/i18n/messages/lg.json
 * Usage: node scripts/import-lg-locale.mjs [scripts/lg-locale-payload.json]
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const payloadPath = process.argv[2] ?? resolve(root, 'scripts/lg-locale-payload.json');
const overridesPath = resolve(root, 'scripts/lg-locale-overrides.json');
const en = JSON.parse(readFileSync(resolve(root, 'features/i18n/messages/en.json'), 'utf8'));
const user = existsSync(payloadPath)
  ? JSON.parse(readFileSync(payloadPath, 'utf8'))
  : {};
const overrides = existsSync(overridesPath)
  ? JSON.parse(readFileSync(overridesPath, 'utf8'))
  : {};

function clean(s) {
  if (typeof s !== 'string') return s;
  return s
    .replace(/\u1356/g, ':')
    .replace(/Tafadhali/g, 'Nsaba')
    .replace(/Hujaingia/g, 'Toyingidde')
    .replace(/Inahifadhiwa/g, 'Biterekeddwa')
    .replace(/Imeupakia/g, 'Zitikiddwa')
    .replace(/Umeingia/g, 'Yayingidde')
    .replace(/unafanya kazi/g, 'kukola')
    .replace(/Maliza kuchora/g, 'Maliriza okubala')
    .replace(/Hivi Karibuni/g, 'okwakakolebwa')
    .replace(/Effacer/g, 'Ggyawo')
    .replace(/Kwenye terefoni/g, 'Ku ssimu')
    .replace(/Inafanya kazi/g, 'Kikola')
    .replace(/Badilisha/g, 'Kyusa')
    .replace(/Angalia/g, 'Laba')
    .replace(/Imetuma/g, 'Bitumiddwa')
    .replace(/Mapendeleo/g, "Eby'okwagala")
    .replace(/Imeondoa/g, 'Byaggyibwawo')
    .replace(/Msimbo/g, 'Koodi')
    .replace(/\bBackup\b/g, 'Okutereka')
    .replace(/\bSajili\b/g, 'Wandiika')
    .replace(/\bIsambu\b/g, 'Ennimiro')
    .replace(/\bisambu\b/g, 'ennimiro')
    .replace(/\bamasambu\b/g, 'ennimiro')
    .replace(/\bYinjira\b/g, 'Yingira')
    .replace(/\bbika\b/gi, 'tereka')
    .replace(/\bseva\b/gi, 'sseva')
    .replace(/Igenamiterere/g, 'Enteekateeka')
    .replace(/Ahabanza/g, "Aw'oku Mwanjo");
}

for (const [k, v] of Object.entries(user)) {
  user[k] = clean(v);
}
Object.assign(user, overrides);

const merged = {};
for (const key of Object.keys(en)) {
  merged[key] = user[key] ?? en[key];
}

writeFileSync(
  resolve(root, 'features/i18n/messages/lg.json'),
  `${JSON.stringify(merged, null, 2)}\n`,
);

const missing = Object.keys(en).filter((k) => !user[k]);
console.log(`lg.json written — ${Object.keys(merged).length} keys, ${missing.length} en fallbacks`);
