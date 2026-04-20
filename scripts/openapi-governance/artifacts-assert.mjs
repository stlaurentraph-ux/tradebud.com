import { readFileSync, existsSync } from 'node:fs';

const metricsPath = 'openapi-governance-metrics.json';
const readmeReportPath = 'openapi-governance-readme-report.json';
const policyReportPath = 'openapi-governance-policy-report.json';
const codeownersReportPath = 'openapi-governance-codeowners-report.json';

const readJson = (path) => {
  if (!existsSync(path)) {
    throw new Error(`Missing file: ${path}`);
  }
  return JSON.parse(readFileSync(path, 'utf8'));
};

const errors = [];
const isStatus = (value) => value === 'PASS' || value === 'FAIL';

let metrics;
let readmeReport;
let policyReport;
let codeownersReport;

try {
  metrics = readJson(metricsPath);
  readmeReport = readJson(readmeReportPath);
  policyReport = readJson(policyReportPath);
  codeownersReport = readJson(codeownersReportPath);
} catch (error) {
  console.error(`OpenAPI governance artifact assertion failed: ${error.message}`);
  process.exit(1);
}

const expectedArtifacts = metrics.expectedArtifacts;
if (!Array.isArray(expectedArtifacts) || expectedArtifacts.length === 0) {
  errors.push('metrics.expectedArtifacts must be a non-empty array');
}

const missingFiles = [];
if (Array.isArray(expectedArtifacts)) {
  for (const artifact of expectedArtifacts) {
    const files = Array.isArray(artifact.files) ? artifact.files : [];
    for (const filePath of files) {
      if (!existsSync(filePath)) {
        missingFiles.push(filePath);
      }
    }
  }
}

if (missingFiles.length > 0) {
  errors.push(`Missing expected artifact files: ${missingFiles.join(', ')}`);
}

if (!isStatus(metrics.overallStatus)) {
  errors.push('metrics.overallStatus must be PASS or FAIL');
}
if (!isStatus(metrics.readmeValidationStatus)) {
  errors.push('metrics.readmeValidationStatus must be PASS or FAIL');
}
if (!isStatus(metrics.presentationValidationStatus)) {
  errors.push('metrics.presentationValidationStatus must be PASS or FAIL');
}
if (
  typeof metrics.presentationDriftWarningCount !== 'number' ||
  !Number.isInteger(metrics.presentationDriftWarningCount) ||
  metrics.presentationDriftWarningCount < 0
) {
  errors.push('metrics.presentationDriftWarningCount must be a non-negative integer');
}
if (
  metrics.presentationValidationRecordedAt !== null &&
  typeof metrics.presentationValidationRecordedAt !== 'string'
) {
  errors.push('metrics.presentationValidationRecordedAt must be string or null');
}
if (
  typeof metrics.presentationValidationRecordedAt === 'string' &&
  Number.isNaN(Date.parse(metrics.presentationValidationRecordedAt))
) {
  errors.push('metrics.presentationValidationRecordedAt must be an ISO-8601 date string');
}
if (metrics.presentationValidationStatus === 'FAIL' && metrics.presentationDriftWarningCount !== 1) {
  errors.push('metrics.presentationDriftWarningCount must be 1 when presentationValidationStatus is FAIL');
}
if (metrics.presentationValidationStatus === 'PASS' && metrics.presentationDriftWarningCount !== 0) {
  errors.push('metrics.presentationDriftWarningCount must be 0 when presentationValidationStatus is PASS');
}
if (metrics.presentationValidationRecordedAt === null) {
  errors.push('metrics.presentationValidationRecordedAt must be present when presentationValidationStatus is PASS or FAIL');
}
if (!isStatus(metrics.policyValidationStatus)) {
  errors.push('metrics.policyValidationStatus must be PASS or FAIL');
}
if (!isStatus(metrics.codeownersValidationStatus)) {
  errors.push('metrics.codeownersValidationStatus must be PASS or FAIL');
}
if (metrics.readmeReport?.status !== readmeReport.status) {
  errors.push('metrics.readmeReport.status must match README report status');
}
if (metrics.policyReport?.status !== policyReport.status) {
  errors.push('metrics.policyReport.status must match policy report status');
}
if (metrics.codeownersReport?.status !== codeownersReport.status) {
  errors.push('metrics.codeownersReport.status must match codeowners report status');
}

if (!isStatus(readmeReport.status)) {
  errors.push('README report status must be PASS or FAIL');
}
if (!Array.isArray(readmeReport.missingAnchors)) {
  errors.push('README report missingAnchors must be an array');
}
if (!Array.isArray(readmeReport.markdownErrors)) {
  errors.push('README report markdownErrors must be an array');
}

if (!isStatus(policyReport.status)) {
  errors.push('policy report status must be PASS or FAIL');
}
if (typeof policyReport.errorCount !== 'number') {
  errors.push('policy report errorCount must be a number');
}
if (!Array.isArray(policyReport.errors)) {
  errors.push('policy report errors must be an array');
}

if (!isStatus(codeownersReport.status)) {
  errors.push('codeowners report status must be PASS or FAIL');
}
if (!Array.isArray(codeownersReport.missingEntries)) {
  errors.push('codeowners report missingEntries must be an array');
}
if (!Array.isArray(codeownersReport.ownerMismatch)) {
  errors.push('codeowners report ownerMismatch must be an array');
}

if (errors.length > 0) {
  console.error('OpenAPI governance artifact assertion failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(
  `OpenAPI governance artifact assertion passed (${expectedArtifacts.length} artifact definitions).`,
);
