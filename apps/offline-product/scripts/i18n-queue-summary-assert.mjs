import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const summaryPath = resolve(process.cwd(), 'queue-i18n-smoke-summary.json');
const baselinePath = resolve(process.cwd(), 'queue-i18n-baseline-metadata.json');

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertSummary(payload) {
  assert(payload && typeof payload === 'object', 'Summary payload must be an object.');
  assert(payload.status === 'PASS', 'Summary status must be PASS.');
  assert(
    typeof payload.smokeVersion === 'string' && payload.smokeVersion.length > 0,
    'Summary smokeVersion must be a non-empty string.',
  );
  assert(
    Number.isInteger(payload.requiredKeyCount) && payload.requiredKeyCount > 0,
    'Summary requiredKeyCount must be a positive integer.',
  );
  assert(
    Array.isArray(payload.locales) &&
      payload.locales.length >= 2 &&
      payload.locales.includes('en') &&
      payload.locales.includes('es'),
    'Summary locales must include en and es.',
  );
}

function assertBaseline(payload) {
  assert(payload && typeof payload === 'object', 'Baseline payload must be an object.');
  assert(
    typeof payload.schemaVersion === 'string' && payload.schemaVersion.length > 0,
    'Baseline schemaVersion must be a non-empty string.',
  );
  assert(
    typeof payload.artifactId === 'string' && payload.artifactId.length > 0,
    'Baseline artifactId must be a non-empty string.',
  );
  assert(typeof payload.runId === 'string' && payload.runId.length > 0, 'Baseline runId must be a non-empty string.');
  assert(
    payload.workflowPath === null || (typeof payload.workflowPath === 'string' && payload.workflowPath.length > 0),
    'Baseline workflowPath must be null or non-empty string.',
  );
  assert(
    payload.workflowName === null || (typeof payload.workflowName === 'string' && payload.workflowName.length > 0),
    'Baseline workflowName must be null or non-empty string.',
  );
}

function main() {
  assert(existsSync(summaryPath), `Missing summary payload: ${summaryPath}`);
  assertSummary(readJson(summaryPath));

  if (existsSync(baselinePath)) {
    assertBaseline(readJson(baselinePath));
  }

  process.stdout.write('PASS queue i18n summary/baseline JSON assertion\n');
}

try {
  main();
} catch (error) {
  process.stderr.write(`FAIL queue i18n summary/baseline JSON assertion: ${error.message}\n`);
  process.exitCode = 1;
}
