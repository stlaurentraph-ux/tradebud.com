#!/usr/bin/env node
/**
 * Merge Hindi payload into features/i18n/messages/hi.json
 * Usage: node scripts/import-hi-locale.mjs [scripts/hi-user-raw.json]
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const payloadPath = process.argv[2] ?? resolve(root, 'scripts/hi-user-raw.json');
const en = JSON.parse(readFileSync(resolve(root, 'features/i18n/messages/en.json'), 'utf8'));
const user = existsSync(payloadPath)
  ? JSON.parse(readFileSync(payloadPath, 'utf8'))
  : {};

/** Fix mixed-script / typo glitches from translation paste */
const overrides = {
  compliant_stat: 'तैयार',
  farmer_name_label: 'किसान का नाम (वैकल्पिक)',
  sign_out_device: 'इस डिवाइस से साइन आउट करें',
  sync_queue_smart_pass_retrying: 'स्मार्ट स्वीप पास 1/2: आइटमों का पुन: प्रयास',
  walk_low_data_desc:
    'डेटा उपयोग को कम करने के लिए रिक्त मानचित्र का उपयोग करें; पूर्ण ऑफ़लाइन मानचित्रों के लिए ऑफ़लाइन सैटेलाइट टाइल्स सक्षम करें।',
};

const merged = {};
for (const key of Object.keys(en)) {
  merged[key] = overrides[key] ?? user[key] ?? en[key];
}

writeFileSync(
  resolve(root, 'features/i18n/messages/hi.json'),
  `${JSON.stringify(merged, null, 2)}\n`,
);

const missing = Object.keys(en).filter((k) => !user[k]);
console.log(`hi.json written — ${Object.keys(merged).length} keys, ${missing.length} en fallbacks`);
