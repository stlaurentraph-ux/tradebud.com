#!/usr/bin/env node
/**
 * Guardrail 2.M.1 — marketing email template render smoke vs manifest baseline.
 *
 * Run: npm run email:templates:smoke:assert -w tracebud-marketing
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const marketingRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function readMarketing(relativePath) {
  const fullPath = path.join(marketingRoot, relativePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing required file: ${relativePath}`);
  }
  return fs.readFileSync(fullPath, 'utf8');
}

function loadManifest() {
  try {
    return JSON.parse(readMarketing('qa/automation-baselines/marketing-email-templates-smoke.json'));
  } catch (error) {
    throw new Error(`Invalid marketing-email-templates-smoke.json: ${error.message}`);
  }
}

function assertManifestShape(manifest) {
  if (manifest.schemaVersion !== 1) {
    throw new Error('manifest schemaVersion must be 1');
  }
  if (manifest.slice !== '2.M.1') {
    throw new Error('manifest slice must be 2.M.1');
  }
  if (manifest.templateId !== 'waitlist-confirmation') {
    throw new Error('manifest templateId must be waitlist-confirmation');
  }
  if (!manifest.runnerModule || !manifest.templatesModule) {
    throw new Error('manifest must define runnerModule and templatesModule');
  }
  if (!manifest.htmlTemplate || !manifest.textTemplate) {
    throw new Error('manifest must define htmlTemplate and textTemplate');
  }
  if (!Array.isArray(manifest.placeholders) || manifest.placeholders.length !== 6) {
    throw new Error('manifest must define six waitlist placeholders');
  }
  if (!manifest.sampleVars || !manifest.escapeProbe) {
    throw new Error('manifest must define sampleVars and escapeProbe');
  }
  if (!Array.isArray(manifest.htmlRequiredSnippets) || manifest.htmlRequiredSnippets.length < 3) {
    throw new Error('manifest must define htmlRequiredSnippets');
  }
  if (!Array.isArray(manifest.textRequiredSnippets) || manifest.textRequiredSnippets.length < 3) {
    throw new Error('manifest must define textRequiredSnippets');
  }
}

function assertTemplateFiles(manifest) {
  readMarketing(manifest.htmlTemplate);
  readMarketing(manifest.textTemplate);
}

function assertTemplatesModule(manifest) {
  const source = readMarketing(manifest.templatesModule);
  if (!source.includes('renderWaitlistConfirmationHtml')) {
    throw new Error(`${manifest.templatesModule} must export renderWaitlistConfirmationHtml`);
  }
  if (!source.includes('renderWaitlistConfirmationText')) {
    throw new Error(`${manifest.templatesModule} must export renderWaitlistConfirmationText`);
  }
  if (!source.includes(manifest.htmlTemplate.replace('email-templates/', ''))) {
    throw new Error(`${manifest.templatesModule} must load ${manifest.htmlTemplate}`);
  }
  for (const key of manifest.placeholders) {
    if (!source.includes(`${key}:`)) {
      throw new Error(`${manifest.templatesModule} must map placeholder ${key}`);
    }
  }
}

function assertRunnerAlignment(manifest) {
  readMarketing(manifest.runnerModule);
  const runner = readMarketing(manifest.runnerModule);
  if (!runner.includes('marketing-email-templates-smoke.json')) {
    throw new Error(`${manifest.runnerModule} must load marketing-email-templates-smoke.json`);
  }
  if (!runner.includes('assertNoUnreplacedPlaceholders')) {
    throw new Error(`${manifest.runnerModule} must reject unreplaced merge tags`);
  }
  if (!runner.includes('htmlRequiredSnippets')) {
    throw new Error(`${manifest.runnerModule} must assert htmlRequiredSnippets`);
  }
  if (!runner.includes('textRequiredSnippets')) {
    throw new Error(`${manifest.runnerModule} must assert textRequiredSnippets`);
  }
  if (!runner.includes('escapeHtml')) {
    throw new Error(`${manifest.runnerModule} must escape HTML merge tags`);
  }
  if (!runner.includes('escapeProbe')) {
    throw new Error(`${manifest.runnerModule} must verify escapeProbe fixtures`);
  }
}

function assertPackageScripts() {
  const pkg = JSON.parse(readMarketing('package.json'));
  if (!pkg.scripts?.['email:templates:smoke']) {
    throw new Error('package.json must define email:templates:smoke script');
  }
  if (!pkg.scripts?.['email:templates:smoke:assert']) {
    throw new Error('package.json must define email:templates:smoke:assert script');
  }
}

function main() {
  const manifest = loadManifest();
  assertManifestShape(manifest);
  assertTemplateFiles(manifest);
  assertTemplatesModule(manifest);
  assertRunnerAlignment(manifest);
  assertPackageScripts();
  console.log(
    `Marketing email template smoke guard passed (template=${manifest.templateId}).`,
  );
}

main();
