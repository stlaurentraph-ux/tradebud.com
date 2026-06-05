#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const repoRoot = path.join(root, '..', '..');
const logoPng = path.join(
  repoRoot,
  'apps/marketing/public/images/tracebud-logo-email.png',
);
const templatePath = path.join(root, 'html/supabase-confirm-email.html');

const dataUri = `data:image/png;base64,${fs.readFileSync(logoPng).toString('base64')}`;
let html = fs.readFileSync(templatePath, 'utf8');
const replaced = html.replace(
  /src="data:image\/png;base64,[^"]+"/,
  `src="${dataUri}"`,
);
if (replaced === html) {
  console.error('Could not find existing logo data URI in supabase-confirm-email.html');
  process.exit(1);
}
fs.writeFileSync(templatePath, replaced);
console.log('Updated logo data URI in', templatePath);
