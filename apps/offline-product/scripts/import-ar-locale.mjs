#!/usr/bin/env node
/**
 * Merge Arabic payload into features/i18n/messages/ar.json
 * Usage: node scripts/import-ar-locale.mjs [scripts/ar-locale-payload.json]
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const payloadPath = process.argv[2] ?? resolve(root, 'scripts/ar-user-raw.json');
const en = JSON.parse(readFileSync(resolve(root, 'features/i18n/messages/en.json'), 'utf8'));
const user = existsSync(payloadPath)
  ? JSON.parse(readFileSync(payloadPath, 'utf8'))
  : {};

/** Minor typo / terminology touch-ups */
const overrides = {
  sync_plots_fetch_failed:
    'تعذر الاتصال بواجهة Tracebud API أثناء فحص قطع الأراضي.',
  plot_status_sync_hint:
    "سجّل الدخول واحفظ نسخة احتياطية من «قطع أراضيي» ليتم حفظ قطعة الأرض هذه عبر الإنترنت.",
};

const merged = {};
for (const key of Object.keys(en)) {
  merged[key] = overrides[key] ?? user[key] ?? en[key];
}

writeFileSync(
  resolve(root, 'features/i18n/messages/ar.json'),
  `${JSON.stringify(merged, null, 2)}\n`,
);

const missing = Object.keys(en).filter((k) => !user[k]);
console.log(`ar.json written — ${Object.keys(merged).length} keys, ${missing.length} en fallbacks`);
