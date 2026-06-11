#!/usr/bin/env node
/**
 * Merge Kinyarwanda payload into features/i18n/messages/rw.json
 * Usage: node scripts/import-rw-locale.mjs scripts/rw-locale-payload.json
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const payloadPath = process.argv[2] ?? resolve(root, 'scripts/rw-locale-payload.json');
const en = JSON.parse(readFileSync(resolve(root, 'features/i18n/messages/en.json'), 'utf8'));
const user = JSON.parse(readFileSync(payloadPath, 'utf8'));

const overrides = {
  plots_local_mode: 'Ntabwo winjiye — amasambu yawe abitswe kuri aka gikoresho.',
  sign_in_sub:
    "Koresha imeli n'ijambo ry'ibanga nk'irya ikonti yawe ya Tracebud. Byabikwa kuri aka gikoresho gusa.",
  simplified_declaration_clear_gps: 'Siba GPS',
  settings_api_url_hint:
    "Ku terefoni cyangwa mudasobwa igendanwa, koresha aderesi ya LAN ya mudasobwa yawe (urugero http://192.168.1.10:4000/api), si localhost. Shyiraho EXPO_PUBLIC_API_URL hanyuma ongera utangire Expo.",
  sync_status: 'Kubika nakala',
  sync_status_section: 'Kubika nakala',
  plot_sync_note: "Kubika nakala y'isambu bikoresha iyi konti. Sohoka ngo ukoreshe ikonti yandukanye.",
  signed_in_as: 'Winjiye nka',
  select_plot_harvest: "Hitamo isambu ku bw'uyu musaruro:",
  sync_plots_uploaded_all: 'Byoherejwe {uploaded} kuri {total} y\'amasambu yabuze kuri seva.',
  recent_deliveries: 'Itangwa rya vuba aha',
  walk_complete_geolocation: 'Soza gushushanya ikarita',
  walk_invalid_boundary_body: 'Poligoni inyuramo ubwayo. Nyamuneka genda kandi umupaka.',
  walk_invalid_declared_body: "Nyamuneka andika umubare w'ukuri ku bw'hegitari zatangajwe.",
  walk_gps_averaging_active: 'Wastani wa GPS urakora',
  walk_gps_averaging_body:
    "Buri kintu cy'umupaka gifata wastani wa segonda 60+ z'isomwa kugira ngo buhanganire isano y'amababi y'ibiti. Genda buhoro kandi mu buryo buhamye.",
  walk_photo_vault_title: "Ububiko bw'amafoto y'ukuri kw'ubutaka",
};

function clean(s) {
  if (typeof s !== 'string') return s;
  return s
    .replace(/\u1356/g, ':')
    .replace(/Tafadhali/g, 'Nyamuneka')
    .replace(/Hujaingia/g, 'Ntabwo winjiye')
    .replace(/Inahifadhiwa/g, 'Byabikwa')
    .replace(/Imeupakia/g, 'Byoherejwe')
    .replace(/Umeingia/g, 'Winjiye')
    .replace(/unafanya kazi/g, 'urakora')
    .replace(/Maliza kuchora/g, 'Soza gushushanya')
    .replace(/Hivi Karibuni/g, 'vuba aha')
    .replace(/Effacer/g, 'Siba')
    .replace(/Kwenye terefoni/g, 'Ku terefoni');
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
  resolve(root, 'features/i18n/messages/rw.json'),
  `${JSON.stringify(merged, null, 2)}\n`,
);

const missing = Object.keys(en).filter((k) => !user[k]);
console.log(`rw.json written — ${Object.keys(merged).length} keys, ${missing.length} en fallbacks`);
