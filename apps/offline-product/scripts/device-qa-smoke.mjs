#!/usr/bin/env node
/**
 * Prints the manual device smoke checklist with a short summary footer.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const checklistPath = path.join(root, 'DEVICE_SMOKE_CHECKLIST.md');

if (!fs.existsSync(checklistPath)) {
  console.error('Missing DEVICE_SMOKE_CHECKLIST.md');
  process.exit(1);
}

const content = fs.readFileSync(checklistPath, 'utf8');
const sectionCount = (content.match(/^## /gm) ?? []).length;
const itemCount = (content.match(/^- \[ \]/gm) ?? []).length;

console.log(content);

console.log('\n---');
console.log(`Checklist: ${itemCount} items across ${sectionCount} sections`);
console.log('Automated gate:  npm run qa:full');
console.log('Static wiring:   npm run qa:preflight');
console.log('Regression:      npm run qa:regression');
console.log('Maestro flows:   npm run test:maestro  (requires Maestro CLI + preview build)');
console.log('After device QA: npm run qa:device:signoff -- --tester "You" --device "Phone" --os "iOS 18" --build preview');
console.log('Preview OTA:     npm run update:preview:safe  (requires sign-off JSON at HEAD)');
console.log('Simulator:       npm run run:simulator');
console.log('Expo dev client: npm start');
console.log('Field prep:       FIELD_TEST_PREP.md');
console.log('Store preflight: npm run release:preflight:production:online');
console.log('Incident steps:  INCIDENT_RUNBOOK.md');
