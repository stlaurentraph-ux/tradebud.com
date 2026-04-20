import { readFileSync, existsSync } from 'node:fs';

const reportPath = 'openapi-governance-presentation-trend-delta.json';
const schemaPath = 'docs/openapi/governance-presentation-trend-delta.schema.json';
const errors = [];

const fail = (message) => {
  console.error(`Presentation trend delta report assertion failed: ${message}`);
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

const isNullableString = (value) => value === null || typeof value === 'string';
const isString = (value) => typeof value === 'string' && value.length > 0;
const isNonNegativeInt = (value) => Number.isInteger(value) && value >= 0;
const isInt = (value) => Number.isInteger(value);

if (!isString(report.currentPath)) {
  errors.push('currentPath must be a non-empty string');
}
if (!isNullableString(report.previousPath)) {
  errors.push('previousPath must be string or null');
}
if (typeof report.previousAvailable !== 'boolean') {
  errors.push('previousAvailable must be boolean');
}

if (!report.baseline || typeof report.baseline !== 'object' || Array.isArray(report.baseline)) {
  errors.push('baseline must be an object');
} else {
  if (!isNullableString(report.baseline.runId)) {
    errors.push('baseline.runId must be string or null');
  }
  if (!isNullableString(report.baseline.workflowPath)) {
    errors.push('baseline.workflowPath must be string or null');
  }
  if (!isNullableString(report.baseline.workflowName)) {
    errors.push('baseline.workflowName must be string or null');
  }
}

if (!report.current || typeof report.current !== 'object' || Array.isArray(report.current)) {
  errors.push('current must be an object');
} else {
  if (!isNonNegativeInt(report.current.fileCount)) {
    errors.push('current.fileCount must be a non-negative integer');
  }
  if (!isNonNegativeInt(report.current.passCount)) {
    errors.push('current.passCount must be a non-negative integer');
  }
  if (!isNonNegativeInt(report.current.failCount)) {
    errors.push('current.failCount must be a non-negative integer');
  }
  if (!isNonNegativeInt(report.current.unknownCount)) {
    errors.push('current.unknownCount must be a non-negative integer');
  }
  if (!isNonNegativeInt(report.current.totalPresentationDriftWarnings)) {
    errors.push('current.totalPresentationDriftWarnings must be a non-negative integer');
  }
  if (!isNonNegativeInt(report.current.snapshotRegistryFailCount)) {
    errors.push('current.snapshotRegistryFailCount must be a non-negative integer');
  }
  if (!isNonNegativeInt(report.current.totalSnapshotRegistryRows)) {
    errors.push('current.totalSnapshotRegistryRows must be a non-negative integer');
  }
}

if (report.delta !== null) {
  if (typeof report.delta !== 'object' || Array.isArray(report.delta)) {
    errors.push('delta must be object or null');
  } else {
    if (!isInt(report.delta.failCount)) {
      errors.push('delta.failCount must be an integer');
    }
    if (!isInt(report.delta.totalPresentationDriftWarnings)) {
      errors.push('delta.totalPresentationDriftWarnings must be an integer');
    }
    if (!isInt(report.delta.snapshotRegistryFailCount)) {
      errors.push('delta.snapshotRegistryFailCount must be an integer');
    }
    if (!isInt(report.delta.totalSnapshotRegistryRows)) {
      errors.push('delta.totalSnapshotRegistryRows must be an integer');
    }
  }
}

if (report.previousAvailable && report.delta === null) {
  errors.push('delta must be present when previousAvailable is true');
}
if (!report.previousAvailable && report.delta !== null) {
  errors.push('delta must be null when previousAvailable is false');
}
if (!report.previousAvailable && report.baseline?.runId !== null) {
  errors.push('baseline.runId must be null when previousAvailable is false');
}

if (errors.length > 0) {
  console.error('Presentation trend delta report assertion failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`Presentation trend delta report assertion passed (${reportPath}).`);
