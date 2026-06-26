#!/usr/bin/env node
/**
 * Guardrail 2.4 — marketing post-deploy smoke workflow fail-closed (audit H23).
 *
 * Run: npm run smoke:post-deploy:assert -w tracebud-marketing
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const marketingRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.join(marketingRoot, '..', '..');

function readRepo(relativePath) {
  const fullPath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing required file: ${relativePath}`);
  }
  return fs.readFileSync(fullPath, 'utf8');
}

function main() {
  const workflow = readRepo('.github/workflows/marketing-deploy-smoke.yml');
  const runner = readRepo('apps/marketing/scripts/marketing-post-deploy-smoke.mjs');
  const assertScript = readRepo('scripts/assert-deploy-smoke-secrets.mjs');

  if (!workflow.includes('marketing-post-deploy-smoke.mjs')) {
    throw new Error('marketing-deploy-smoke.yml must run marketing post-deploy smoke script');
  }
  if (!workflow.includes('assert-deploy-smoke-secrets.mjs')) {
    throw new Error('marketing-deploy-smoke.yml must assert deploy smoke secrets (H23)');
  }
  if (!workflow.includes('DEPLOY_SMOKE_STRICT')) {
    throw new Error('marketing-deploy-smoke.yml must set DEPLOY_SMOKE_STRICT');
  }
  if (/not configured — skipping[\s\S]*exit 0/m.test(workflow)) {
    throw new Error('marketing-deploy-smoke.yml must not exit 0 when secrets missing on strict runs');
  }
  if (!runner.includes('Missing MARKETING_SMOKE_BASE_URL')) {
    throw new Error('marketing-post-deploy-smoke.mjs must fail when base URL is missing');
  }
  if (!assertScript.includes('DEPLOY_SMOKE_STRICT')) {
    throw new Error('assert-deploy-smoke-secrets.mjs must support strict mode');
  }

  console.log('Marketing post-deploy smoke guard passed (slice 2.4 / H23).');
}

main();
