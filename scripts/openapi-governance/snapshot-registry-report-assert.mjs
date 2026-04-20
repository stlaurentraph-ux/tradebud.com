import { existsSync, readFileSync } from 'node:fs';

const reportPath = 'openapi-snapshot-registry-report.json';
const schemaPath = 'docs/openapi/snapshot-registry-report.schema.json';
const errors = [];

const fail = (message) => {
  console.error(`Snapshot registry report assertion failed: ${message}`);
  process.exit(1);
};

if (!existsSync(reportPath)) fail(`Missing file ${reportPath}`);
if (!existsSync(schemaPath)) fail(`Missing file ${schemaPath}`);

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
  if (!(key in report)) errors.push(`missing required field: ${key}`);
}
for (const key of Object.keys(report)) {
  if (!allowedKeys.has(key)) errors.push(`unsupported field in report: ${key}`);
}

const isString = (value) => typeof value === 'string' && value.length > 0;
const isNumber = (value) => typeof value === 'number' && Number.isFinite(value);
const isStringArray = (value) =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

if (report.schemaVersion !== 1) errors.push('schemaVersion must be 1');
if (!isString(report.markdownPath)) errors.push('markdownPath must be a non-empty string');
if (!isNumber(report.rowCount) || report.rowCount < 0) {
  errors.push('rowCount must be a non-negative number');
}
if (report.status !== 'PASS' && report.status !== 'FAIL') {
  errors.push('status must be PASS or FAIL');
}
if (!isStringArray(report.errors)) {
  errors.push('errors must be an array of strings');
}
if (isStringArray(report.errors)) {
  if (report.status === 'PASS' && report.errors.length > 0) {
    errors.push('errors must be empty when status is PASS');
  }
  if (report.status === 'FAIL' && report.errors.length === 0) {
    errors.push('errors must be non-empty when status is FAIL');
  }
}
if (isNumber(report.rowCount) && report.rowCount === 0 && report.status === 'PASS') {
  errors.push('rowCount must be at least 1 when status is PASS');
}

if (errors.length > 0) {
  console.error('Snapshot registry report assertion failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`Snapshot registry report assertion passed (${reportPath}).`);
