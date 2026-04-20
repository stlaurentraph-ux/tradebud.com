import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const scriptPath = resolve('scripts/openapi-governance/evidence-doc-contract-parity-check.mjs');
const schemaPath = 'docs/openapi/evidence-doc-parity-report.schema.json';
const fixtureRoot = resolve('scripts/openapi-governance/fixtures/evidence-doc-contract-parity');
const dtoPath = resolve(fixtureRoot, 'dto.ts');
const failOpenapiPath = resolve(fixtureRoot, 'openapi-fail-format.yaml');
const errors = [];

if (!existsSync(schemaPath)) {
  console.error(`Evidence-doc parity report assertion failed: Missing file ${schemaPath}`);
  process.exit(1);
}

let schema;
try {
  schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
} catch (error) {
  console.error(`Evidence-doc parity report assertion failed: ${error.message}`);
  process.exit(1);
}

const fail = (message) => {
  errors.push(message);
};

const isStringArray = (value) =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

function validateAgainstSchemaEnvelope(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    fail('payload must be an object');
    return;
  }

  const schemaVersionExpected = schema?.oneOf?.[0]?.properties?.schemaVersion?.const;
  if (payload.schemaVersion !== schemaVersionExpected) {
    fail(`schemaVersion must be ${schemaVersionExpected}`);
  }

  if (payload.status === 'PASS') {
    if (!payload.checks || typeof payload.checks !== 'object' || Array.isArray(payload.checks)) {
      fail('PASS payload must include checks object');
      return;
    }
    if (!isStringArray(payload.checks.typeEnumValues) || payload.checks.typeEnumValues.length === 0) {
      fail('PASS checks.typeEnumValues must be non-empty string array');
    }
    if (
      !isStringArray(payload.checks.reviewStatusEnumValues) ||
      payload.checks.reviewStatusEnumValues.length === 0
    ) {
      fail('PASS checks.reviewStatusEnumValues must be non-empty string array');
    }
    if (!isStringArray(payload.checks.requiredFields) || payload.checks.requiredFields.length === 0) {
      fail('PASS checks.requiredFields must be non-empty string array');
    }
    if (!isStringArray(payload.checks.fieldChecks) || payload.checks.fieldChecks.length === 0) {
      fail('PASS checks.fieldChecks must be non-empty string array');
    }
    if (!isStringArray(payload.checks.exampleParity) || payload.checks.exampleParity.length === 0) {
      fail('PASS checks.exampleParity must be non-empty string array');
    }
    return;
  }

  if (payload.status === 'FAIL') {
    if (typeof payload.code !== 'string' || payload.code.length === 0) {
      fail('FAIL payload code must be non-empty string');
    }
    if (typeof payload.message !== 'string' || payload.message.length === 0) {
      fail('FAIL payload message must be non-empty string');
    }
    if (!Object.prototype.hasOwnProperty.call(payload, 'details')) {
      fail('FAIL payload must include details key');
    }
    return;
  }

  fail('status must be PASS or FAIL');
}

let passPayload;
try {
  const output = execFileSync('node', [scriptPath, '--json'], { encoding: 'utf8' });
  passPayload = JSON.parse(output);
} catch (error) {
  console.error(
    `Evidence-doc parity report assertion failed: unable to parse PASS payload (${error.message})`,
  );
  process.exit(1);
}

validateAgainstSchemaEnvelope(passPayload);
if (passPayload.status !== 'PASS') {
  fail(`expected PASS payload from live contract check, got ${passPayload.status}`);
}

try {
  execFileSync(
    'node',
    [scriptPath, '--json', '--dto', dtoPath, '--openapi', failOpenapiPath],
    { encoding: 'utf8', stdio: 'pipe' },
  );
  fail('expected FAIL payload scenario to exit non-zero');
} catch (error) {
  try {
    const failPayload = JSON.parse(String(error.stderr ?? '').trim());
    validateAgainstSchemaEnvelope(failPayload);
    if (failPayload.status !== 'FAIL') {
      fail(`expected FAIL payload from fixture scenario, got ${failPayload.status}`);
    }
  } catch (parseError) {
    fail(`unable to parse FAIL payload JSON (${parseError.message})`);
  }
}

if (errors.length > 0) {
  console.error('Evidence-doc parity report assertion failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log('Evidence-doc parity report assertion passed (schema v1, PASS+FAIL payloads).');
