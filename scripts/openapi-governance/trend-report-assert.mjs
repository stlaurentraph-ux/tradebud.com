import { readFileSync, existsSync } from 'node:fs';

const reportPath = 'openapi-governance-presentation-trend.json';
const schemaPath = 'docs/openapi/governance-presentation-trend.schema.json';
const errors = [];

const fail = (message) => {
  console.error(`Presentation trend report assertion failed: ${message}`);
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

const isString = (value) => typeof value === 'string' && value.length > 0;
const isNonNegativeInt = (value) => Number.isInteger(value) && value >= 0;
const isNullableIsoString = (value) =>
  value === null || (typeof value === 'string' && !Number.isNaN(Date.parse(value)));

if (!Array.isArray(report.scannedPaths) || !report.scannedPaths.every(isString)) {
  errors.push('scannedPaths must be an array of non-empty strings');
}
if (!isNonNegativeInt(report.fileCount)) {
  errors.push('fileCount must be a non-negative integer');
}
if (
  !report.statusCounts ||
  !isNonNegativeInt(report.statusCounts.PASS) ||
  !isNonNegativeInt(report.statusCounts.FAIL) ||
  !isNonNegativeInt(report.statusCounts.UNKNOWN)
) {
  errors.push('statusCounts must include non-negative PASS/FAIL/UNKNOWN integers');
}
if (!isNonNegativeInt(report.totalPresentationDriftWarnings)) {
  errors.push('totalPresentationDriftWarnings must be a non-negative integer');
}
if (
  !report.snapshotRegistryStatusCounts ||
  !isNonNegativeInt(report.snapshotRegistryStatusCounts.PASS) ||
  !isNonNegativeInt(report.snapshotRegistryStatusCounts.FAIL)
) {
  errors.push('snapshotRegistryStatusCounts must include non-negative PASS/FAIL integers');
}
if (!isNonNegativeInt(report.totalSnapshotRegistryRows)) {
  errors.push('totalSnapshotRegistryRows must be a non-negative integer');
}
if (!isNullableIsoString(report.earliestPresentationValidationRecordedAt)) {
  errors.push('earliestPresentationValidationRecordedAt must be null or ISO date string');
}
if (!isNullableIsoString(report.latestPresentationValidationRecordedAt)) {
  errors.push('latestPresentationValidationRecordedAt must be null or ISO date string');
}
if (!Array.isArray(report.files)) {
  errors.push('files must be an array');
} else {
  for (const file of report.files) {
    if (!isString(file?.path)) {
      errors.push('files[].path must be a non-empty string');
    }
    if (file?.status !== 'PASS' && file?.status !== 'FAIL' && file?.status !== 'UNKNOWN') {
      errors.push('files[].status must be PASS, FAIL, or UNKNOWN');
    }
    if (!isNonNegativeInt(file?.warningCount)) {
      errors.push('files[].warningCount must be a non-negative integer');
    }
    if (!isNullableIsoString(file?.recordedAt)) {
      errors.push('files[].recordedAt must be null or ISO date string');
    }
    if (!isNullableIsoString(file?.generatedAt)) {
      errors.push('files[].generatedAt must be null or ISO date string');
    }
    if (file?.snapshotRegistryStatus !== 'PASS' && file?.snapshotRegistryStatus !== 'FAIL') {
      errors.push('files[].snapshotRegistryStatus must be PASS or FAIL');
    }
    if (!isNonNegativeInt(file?.snapshotRegistryRowCount)) {
      errors.push('files[].snapshotRegistryRowCount must be a non-negative integer');
    }
  }
}

if (Array.isArray(report.files) && report.fileCount !== report.files.length) {
  errors.push('fileCount must equal files array length');
}
if (report.fileCount === 0) {
  if (report.earliestPresentationValidationRecordedAt !== null) {
    errors.push('earliestPresentationValidationRecordedAt must be null when fileCount is 0');
  }
  if (report.latestPresentationValidationRecordedAt !== null) {
    errors.push('latestPresentationValidationRecordedAt must be null when fileCount is 0');
  }
}

if (errors.length > 0) {
  console.error('Presentation trend report assertion failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`Presentation trend report assertion passed (${reportPath}).`);
