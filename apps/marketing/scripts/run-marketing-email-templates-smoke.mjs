#!/usr/bin/env node
/**
 * Email template render smoke for marketing (slice 2.M.1).
 *
 * Run: npm run email:templates:smoke -w tracebud-marketing
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const marketingRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = path.join(
  marketingRoot,
  'qa/automation-baselines/marketing-email-templates-smoke.json',
);

function loadManifest() {
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

function readMarketing(relativePath) {
  const fullPath = path.join(marketingRoot, relativePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing required file: ${relativePath}`);
  }
  return fs.readFileSync(fullPath, 'utf8');
}

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function applyPlaceholders(template, vars, options = {}) {
  const escape = options.escapeHtml ?? false;
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key) => {
    const raw = vars[key] ?? '';
    return escape ? escapeHtml(String(raw)) : String(raw);
  });
}

function stripTextTemplateHeader(raw) {
  const lines = raw.split('\n');
  let start = 0;
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (
      line.startsWith('Subject:') ||
      line.startsWith('Preheader:') ||
      /^─+$/.test(line) ||
      (line === '' && start === i)
    ) {
      start = i + 1;
      continue;
    }
    break;
  }
  return lines.slice(start).join('\n');
}

function assertNoUnreplacedPlaceholders(label, rendered) {
  const leftover = rendered.match(/\{\{\w+\}\}/g);
  if (leftover?.length) {
    throw new Error(`${label} has unreplaced placeholders: ${leftover.join(', ')}`);
  }
}

function assertRequiredSnippets(label, rendered, snippets) {
  for (const snippet of snippets) {
    if (!rendered.includes(snippet)) {
      throw new Error(`${label} missing required snippet: ${snippet}`);
    }
  }
}

function renderWaitlistHtml(manifest, vars) {
  const raw = readMarketing(manifest.htmlTemplate);
  return applyPlaceholders(raw, vars, { escapeHtml: true });
}

function renderWaitlistText(manifest, vars) {
  const raw = readMarketing(manifest.textTemplate);
  const body = stripTextTemplateHeader(raw);
  return applyPlaceholders(body, vars, { escapeHtml: false }).trim();
}

function main() {
  const manifest = loadManifest();
  const html = renderWaitlistHtml(manifest, manifest.sampleVars);
  const text = renderWaitlistText(manifest, manifest.sampleVars);

  assertNoUnreplacedPlaceholders('waitlist HTML', html);
  assertNoUnreplacedPlaceholders('waitlist text', text);
  assertRequiredSnippets('waitlist HTML', html, manifest.htmlRequiredSnippets);
  assertRequiredSnippets('waitlist text', text, manifest.textRequiredSnippets);

  if (!html.includes('<!DOCTYPE html>')) {
    throw new Error('waitlist HTML missing DOCTYPE');
  }
  if (!html.includes('<title>')) {
    throw new Error('waitlist HTML missing title element');
  }

  const escapedHtml = renderWaitlistHtml(manifest, {
    ...manifest.sampleVars,
    ...manifest.escapeProbe,
  });
  if (escapedHtml.includes('<img src=x onerror=alert(1)>')) {
    throw new Error('waitlist HTML must escape unsafe firstName input');
  }
  if (!escapedHtml.includes('Test &amp; Co')) {
    throw new Error('waitlist HTML must escape organisationName ampersands');
  }

  const subjectSource = readMarketing(manifest.templatesModule);
  if (!subjectSource.includes(`${manifest.subjectConstant} = "${manifest.expectedSubject}"`)) {
    throw new Error(
      `${manifest.templatesModule} must export ${manifest.subjectConstant} = "${manifest.expectedSubject}"`,
    );
  }

  console.log(`waitlist HTML ok (${html.length} chars)`);
  console.log(`waitlist text ok (${text.length} chars)`);
  console.log(`subject constant ok (${manifest.expectedSubject})`);
}

main();
