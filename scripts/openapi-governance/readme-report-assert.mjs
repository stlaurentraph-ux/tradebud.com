import { readFileSync, existsSync } from 'node:fs';

const reportPath = 'openapi-governance-readme-report.json';
const schemaPath = 'docs/openapi/governance-readme-report.schema.json';
const errors = [];

const fail = (message) => {
  console.error(`README governance report assertion failed: ${message}`);
  process.exit(1);
};

if (!existsSync(reportPath)) {
  fail(`Missing file ${reportPath}`);
}
if (!existsSync(schemaPath)) {
  fail(`Missing file ${schemaPath}`);
}

let report;
let schema;
try {
  report = JSON.parse(readFileSync(reportPath, 'utf8'));
  schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
} catch (error) {
  fail(error.message);
}

const schemaRequired = Array.isArray(schema.required) ? schema.required : [];
const schemaProperties =
  schema.properties && typeof schema.properties === 'object' ? schema.properties : {};
const allowedKeys = new Set(Object.keys(schemaProperties));

for (const key of schemaRequired) {
  if (!(key in report)) {
    errors.push(`missing required field: ${key}`);
  }
}
for (const key of Object.keys(report)) {
  if (!allowedKeys.has(key)) {
    errors.push(`unsupported field in report: ${key}`);
  }
}

const isNumber = (value) => typeof value === 'number' && Number.isFinite(value);
const isString = (value) => typeof value === 'string' && value.length > 0;
const isStringArray = (value) =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

if (report.status !== 'PASS' && report.status !== 'FAIL') {
  errors.push('status must be PASS or FAIL');
}
if (!isNumber(report.commandCount)) {
  errors.push('commandCount must be a finite number');
}
if (!isNumber(report.pathCount)) {
  errors.push('pathCount must be a finite number');
}
if (!isNumber(report.requiredAnchorCount)) {
  errors.push('requiredAnchorCount must be a finite number');
}
if (!isStringArray(report.missingAnchors)) {
  errors.push('missingAnchors must be an array of strings');
}
if (!isStringArray(report.markdownErrors)) {
  errors.push('markdownErrors must be an array of strings');
}
if (!isString(report.readmePath)) {
  errors.push('readmePath must be a non-empty string');
}
if (!isString(report.packageJsonPath)) {
  errors.push('packageJsonPath must be a non-empty string');
}
if (!isString(report.readmePolicyPath)) {
  errors.push('readmePolicyPath must be a non-empty string');
}
if (!isString(report.readmePolicySchemaPath)) {
  errors.push('readmePolicySchemaPath must be a non-empty string');
}
if (!isString(report.generatedAt)) {
  errors.push('generatedAt must be a non-empty string');
}

if (isStringArray(report.missingAnchors) && isNumber(report.requiredAnchorCount)) {
  if (report.requiredAnchorCount < report.missingAnchors.length) {
    errors.push('requiredAnchorCount cannot be smaller than missingAnchors length');
  }
}

if (isStringArray(report.markdownErrors)) {
  const hasFailures =
    (isStringArray(report.missingAnchors) && report.missingAnchors.length > 0) ||
    report.markdownErrors.length > 0;
  if (report.status === 'PASS' && hasFailures) {
    errors.push('status PASS requires zero missingAnchors and markdownErrors');
  }
  if (report.status === 'FAIL' && !hasFailures) {
    errors.push('status FAIL requires missingAnchors or markdownErrors');
  }
}

if (errors.length > 0) {
  console.error('README governance report assertion failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`README governance report assertion passed (${reportPath}).`);
