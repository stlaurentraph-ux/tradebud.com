#!/usr/bin/env node
/**
 * Key list + patch slices for documents UX i18n.
 * es, fr, de, pt carry full farmer translations; other locales use EN strings.
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const messagesDir = resolve(root, 'features/i18n/messages');
const en = JSON.parse(readFileSync(resolve(messagesDir, 'en.json'), 'utf8'));

const KEY_PREFIXES = [
  'documents_',
  'plot_land_papers',
  'plot_documents_more',
  'plot_nav_documents',
  'plot_saved_add',
  'walk_completion_add_land',
  'walk_completion_land',
];
const EXTRA_KEYS = [
  'evidence_sync_need_documents_hint',
  'plots_pick_documents_hint',
  'walk_decl_documents_hint',
];

export const documentsUxKeys = Object.keys(en).filter(
  (k) => EXTRA_KEYS.includes(k) || KEY_PREFIXES.some((p) => k.startsWith(p) || k.includes(p)),
);

function fromEn(overrides = {}) {
  const patch = {};
  for (const key of documentsUxKeys) {
    patch[key] = en[key];
  }
  return { ...patch, ...overrides };
}

function sliceLocale(locale) {
  const data = JSON.parse(readFileSync(resolve(messagesDir, `${locale}.json`), 'utf8'));
  const patch = {};
  for (const key of documentsUxKeys) {
    patch[key] = data[key] ?? en[key];
  }
  return patch;
}

const fullyTranslated = ['es', 'fr', 'de', 'pt'];

export const documentsUxPatches = Object.fromEntries(
  fullyTranslated.map((locale) => [locale, sliceLocale(locale)]),
);

for (const locale of [
  'sw',
  'id',
  'vi',
  'nl',
  'it',
  'hi',
  'ar',
  'am',
  'lg',
  'rw',
  'no',
]) {
  documentsUxPatches[locale] = fromEn();
}
