#!/usr/bin/env node
/**
 * Guardrail 3.6 — validate PR labeler config shape.
 *
 * Run: npm run pr:labeler:assert
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const labelerPath = path.join(repoRoot, '.github/labeler.yml');
const workflowPath = path.join(repoRoot, '.github/workflows/pr-labeler.yml');

const REQUIRED_LABELS = [
  'lane:guardrails',
  'app:marketing',
  'app:dashboard',
  'app:offline',
  'app:backend',
  'app:field-auth',
  'app:founder-os',
  'app:contracts',
  'risk:spatial',
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const labeler = fs.readFileSync(labelerPath, 'utf8');
const workflow = fs.readFileSync(workflowPath, 'utf8');

for (const label of REQUIRED_LABELS) {
  assert(labeler.includes(`'${label}':`), `Missing label mapping for ${label} in .github/labeler.yml`);
}

assert(workflow.includes('actions/labeler@v5'), 'pr-labeler.yml must use actions/labeler@v5');
assert(workflow.includes('lane:guardrails'), 'pr-labeler.yml must apply lane:guardrails from branch prefix');
assert(workflow.includes('lane:fix'), 'pr-labeler.yml must apply lane:fix from branch prefix');
assert(workflow.includes('lane:feature'), 'pr-labeler.yml must apply lane:feature from branch prefix');

console.log('PR labeler guard passed (labeler.yml + pr-labeler workflow).');
