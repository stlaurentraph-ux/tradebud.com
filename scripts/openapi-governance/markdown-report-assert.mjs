import { readFileSync, existsSync } from 'node:fs';

const reportPath = 'openapi-markdown-reference-report.json';
const schemaPath = 'docs/openapi/markdown-reference-report.schema.json';
const errors = [];

if (!existsSync(reportPath)) {
  console.error(`Markdown report assertion failed: Missing file ${reportPath}`);
  process.exit(1);
}
if (!existsSync(schemaPath)) {
  console.error(`Markdown report assertion failed: Missing file ${schemaPath}`);
  process.exit(1);
}

let report;
let schema;
try {
  report = JSON.parse(readFileSync(reportPath, 'utf8'));
  schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
} catch (error) {
  console.error(`Markdown report assertion failed: ${error.message}`);
  process.exit(1);
}

const isBoolean = (value) => typeof value === 'boolean';
const isNumber = (value) => typeof value === 'number' && Number.isFinite(value);
const isString = (value) => typeof value === 'string';
const isStringArray = (value) =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');
const schemaRequired = Array.isArray(schema.required) ? schema.required : [];
const schemaProperties =
  schema.properties && typeof schema.properties === 'object' ? schema.properties : {};
const allowedKeys = new Set(Object.keys(schemaProperties));

if (schemaProperties.schemaVersion?.const !== 1) {
  errors.push('schema must define schemaVersion const value of 1');
}

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

if (!isString(report.markdownPath) || report.markdownPath.length === 0) {
  errors.push('markdownPath must be a non-empty string');
}
if (report.schemaVersion !== 1) {
  errors.push('schemaVersion must be 1');
}
if (!isString(report.packageJsonPath) || report.packageJsonPath.length === 0) {
  errors.push('packageJsonPath must be a non-empty string');
}
if (!isBoolean(report.enforceCommands)) {
  errors.push('enforceCommands must be a boolean');
}
if (!isBoolean(report.enforcePaths)) {
  errors.push('enforcePaths must be a boolean');
}
if (!isNumber(report.commandCount)) {
  errors.push('commandCount must be a number');
}
if (!isNumber(report.pathCount)) {
  errors.push('pathCount must be a number');
}
if (!isStringArray(report.missingCommands)) {
  errors.push('missingCommands must be an array of strings');
}
if (!isStringArray(report.missingPaths)) {
  errors.push('missingPaths must be an array of strings');
}
if (!isStringArray(report.errors)) {
  errors.push('errors must be an array of strings');
}
if (report.status !== 'PASS' && report.status !== 'FAIL') {
  errors.push('status must be PASS or FAIL');
}

if (isStringArray(report.missingCommands) && report.missingCommands.length > 0) {
  if (report.status !== 'FAIL') {
    errors.push('status must be FAIL when missingCommands is non-empty');
  }
}
if (isStringArray(report.missingPaths) && report.missingPaths.length > 0) {
  if (report.status !== 'FAIL') {
    errors.push('status must be FAIL when missingPaths is non-empty');
  }
}
if (isStringArray(report.errors)) {
  if (report.status === 'PASS' && report.errors.length > 0) {
    errors.push('errors must be empty when status is PASS');
  }
  if (report.status === 'FAIL' && report.errors.length === 0) {
    errors.push('errors must be non-empty when status is FAIL');
  }
}

if (errors.length > 0) {
  console.error('Markdown report assertion failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`Markdown report assertion passed (${reportPath}, schema v1).`);
