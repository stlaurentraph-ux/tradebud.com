#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const scriptPath = resolve('scripts/openapi-governance/evidence-doc-contract-parity-check.mjs');
const fixtureRoot = resolve('scripts/openapi-governance/fixtures/evidence-doc-contract-parity');
const dtoPath = resolve(fixtureRoot, 'dto.ts');
const openapiPassPath = resolve(fixtureRoot, 'openapi-pass.yaml');
const openapiEnumFailPath = resolve(fixtureRoot, 'openapi-fail-enum.yaml');
const openapiRequiredFailPath = resolve(fixtureRoot, 'openapi-fail-required.yaml');
const openapiNullableFailPath = resolve(fixtureRoot, 'openapi-fail-nullable.yaml');
const openapiExampleKeysFailPath = resolve(fixtureRoot, 'openapi-fail-example-keys.yaml');
const openapiFormatFailPath = resolve(fixtureRoot, 'openapi-fail-format.yaml');
const openapiExampleNullFailPath = resolve(fixtureRoot, 'openapi-fail-example-null-nonnullable.yaml');

function runPassCase() {
  const output = execFileSync(
    'node',
    [scriptPath, '--dto', dtoPath, '--openapi', openapiPassPath],
    { encoding: 'utf8' },
  );
  if (!output.includes('PASS evidence-doc contract parity')) {
    throw new Error('pass-case: expected PASS marker in output');
  }
}

function runJsonPassCase() {
  const output = execFileSync(
    'node',
    [scriptPath, '--dto', dtoPath, '--openapi', openapiPassPath, '--json'],
    { encoding: 'utf8' },
  );
  const payload = JSON.parse(output);
  if (payload.status !== 'PASS') {
    throw new Error(`json-pass-case: expected status PASS, got ${payload.status}`);
  }
  if (!Array.isArray(payload.checks?.requiredFields) || payload.checks.requiredFields.length === 0) {
    throw new Error('json-pass-case: requiredFields payload missing');
  }
}

function runFailCase({ name, openapiPath, expectedCode }) {
  try {
    execFileSync('node', [scriptPath, '--dto', dtoPath, '--openapi', openapiPath], {
      encoding: 'utf8',
      stdio: 'pipe',
    });
    throw new Error(`${name}: checker unexpectedly passed`);
  } catch (error) {
    const stderr = error?.stderr ? String(error.stderr) : '';
    if (!stderr.includes('FAIL evidence-doc contract parity:')) {
      throw new Error(`${name}: expected FAIL marker, received stderr: ${stderr}`);
    }
    if (!stderr.includes(`[${expectedCode}]`)) {
      throw new Error(`${name}: expected code [${expectedCode}], received stderr: ${stderr}`);
    }
  }
}

function runJsonFailCase() {
  try {
    execFileSync(
      'node',
      [scriptPath, '--dto', dtoPath, '--openapi', openapiFormatFailPath, '--json'],
      { encoding: 'utf8', stdio: 'pipe' },
    );
    throw new Error('json-fail-case: checker unexpectedly passed');
  } catch (error) {
    const stderr = error?.stderr ? String(error.stderr) : '';
    const payload = JSON.parse(stderr);
    if (payload.status !== 'FAIL') {
      throw new Error(`json-fail-case: expected status FAIL, got ${payload.status}`);
    }
    if (payload.code !== 'EVIDENCE_DOC_PARITY_FIELD_MISMATCH') {
      throw new Error(`json-fail-case: expected EVIDENCE_DOC_PARITY_FIELD_MISMATCH, got ${payload.code}`);
    }
  }
}

runPassCase();
runJsonPassCase();
runFailCase({
  name: 'enum-fail-case',
  openapiPath: openapiEnumFailPath,
  expectedCode: 'EVIDENCE_DOC_PARITY_SET_MISMATCH',
});
runFailCase({
  name: 'required-fail-case',
  openapiPath: openapiRequiredFailPath,
  expectedCode: 'EVIDENCE_DOC_PARITY_SET_MISMATCH',
});
runFailCase({
  name: 'nullable-fail-case',
  openapiPath: openapiNullableFailPath,
  expectedCode: 'EVIDENCE_DOC_PARITY_FIELD_MISMATCH',
});
runFailCase({
  name: 'example-keys-fail-case',
  openapiPath: openapiExampleKeysFailPath,
  expectedCode: 'EVIDENCE_DOC_PARITY_SET_MISMATCH',
});
runFailCase({
  name: 'format-fail-case',
  openapiPath: openapiFormatFailPath,
  expectedCode: 'EVIDENCE_DOC_PARITY_FIELD_MISMATCH',
});
runFailCase({
  name: 'example-null-nonnullable-fail-case',
  openapiPath: openapiExampleNullFailPath,
  expectedCode: 'EVIDENCE_DOC_PARITY_EXAMPLE_NON_NULLABLE_NULL',
});
runJsonFailCase();

console.log('Evidence-doc parity smoke checks passed (9 scenarios).');
