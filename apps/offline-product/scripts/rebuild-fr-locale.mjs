#!/usr/bin/env node
/**
 * Re-apply authoritative French farmer copy onto fr.json (never replaces with English).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const messagesDir = resolve(root, 'features/i18n/messages');
const en = JSON.parse(readFileSync(resolve(messagesDir, 'en.json'), 'utf8'));
const fr = JSON.parse(readFileSync(resolve(messagesDir, 'fr.json'), 'utf8'));
const overrides = JSON.parse(
  readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), 'canonical-fr-overrides.json'), 'utf8'),
);

const extraFr = {
  sign_in_invalid_credentials:
    'Connexion impossible. Vérifiez votre e-mail et mot de passe — il vous faut un compte Tracebud existant (demandez à votre coopérative ou écrivez à support@tracebud.com).',
  declaration_geo_saved: 'Position GPS enregistrée pour votre déclaration.',
  declaration_geo_not_set: 'Aucune position GPS enregistrée pour l\'instant.',
};
const merged = { ...fr, ...overrides, ...extraFr };
const sorted = Object.fromEntries(
  Object.keys(en)
    .sort()
    .map((k) => [k, merged[k] ?? fr[k] ?? en[k]]),
);

writeFileSync(resolve(messagesDir, 'fr.json'), `${JSON.stringify(sorted, null, 2)}\n`);
console.log(`fr.json — ${Object.keys(sorted).length} keys, ${Object.keys(overrides).length} overrides applied`);
