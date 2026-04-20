import { readFileSync, existsSync, writeFileSync, appendFileSync } from 'node:fs';
import { buildGovernanceSummaryLines } from './metrics-summary-lines.mjs';

const policyReportPath = 'openapi-governance-policy-report.json';
const codeownersReportPath = 'openapi-governance-codeowners-report.json';
const readmeReportPath = 'openapi-governance-readme-report.json';
const snapshotRegistryReportPath = 'openapi-snapshot-registry-report.json';
const metricsPath = 'openapi-governance-metrics.json';

const readJson = (path) => {
  if (!existsSync(path)) {
    return null;
  }
  return JSON.parse(readFileSync(path, 'utf8'));
};

const policyReport = readJson(policyReportPath);
const codeownersReport = readJson(codeownersReportPath);
const readmeReport = readJson(readmeReportPath);
const snapshotRegistryReport = readJson(snapshotRegistryReportPath);

const policyStatus = policyReport?.status ?? 'FAIL';
const codeownersStatus = codeownersReport?.status ?? 'FAIL';
const readmeStatus = readmeReport?.status ?? 'FAIL';
const snapshotRegistryStatus = snapshotRegistryReport?.status ?? 'FAIL';
const snapshotRegistryRowCount =
  typeof snapshotRegistryReport?.rowCount === 'number' &&
  Number.isFinite(snapshotRegistryReport.rowCount)
    ? snapshotRegistryReport.rowCount
    : 0;
const presentationStatus =
  process.env.PRESENTATION_VALIDATION_STATUS === 'PASS' ||
  process.env.PRESENTATION_VALIDATION_STATUS === 'FAIL'
    ? process.env.PRESENTATION_VALIDATION_STATUS
    : 'UNKNOWN';
const generatedAt = new Date().toISOString();
const presentationDriftWarningCount = presentationStatus === 'FAIL' ? 1 : 0;
const presentationValidationRecordedAt =
  presentationStatus === 'UNKNOWN' ? null : generatedAt;
const overallStatus =
  policyStatus === 'PASS' &&
  codeownersStatus === 'PASS' &&
  readmeStatus === 'PASS' &&
  snapshotRegistryStatus === 'PASS'
    ? 'PASS'
    : 'FAIL';

const expectedArtifacts = [
  {
    name: 'contracts-openapi-readme-governance-metrics',
    files: [readmeReportPath],
  },
  {
    name: 'contracts-openapi-governance-metrics',
    files: [metricsPath],
  },
  {
    name: 'contracts-openapi-governance-reports',
    files: [policyReportPath, codeownersReportPath],
  },
  {
    name: 'contracts-openapi-snapshot-registry-metrics',
    files: [snapshotRegistryReportPath],
  },
];

const runUrl =
  process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID
    ? `https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
    : null;
const summary = buildGovernanceSummaryLines({
  readmeStatus,
  policyStatus,
  codeownersStatus,
  overallStatus,
  runUrl,
}).join('\n');

const skipSummary = process.argv.includes('--no-summary');
if (!skipSummary && process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${summary}\n`);
}

writeFileSync(
  metricsPath,
  JSON.stringify(
    {
      overallStatus,
      readmeValidationStatus: readmeStatus,
      presentationValidationStatus: presentationStatus,
      presentationDriftWarningCount,
      presentationValidationRecordedAt,
      policyValidationStatus: policyStatus,
      codeownersValidationStatus: codeownersStatus,
      readmeReport,
      policyReport,
      codeownersReport,
      snapshotRegistryStatus,
      snapshotRegistryRowCount,
      snapshotRegistryReport,
      expectedArtifacts,
      generatedAt,
      runId: process.env.GITHUB_RUN_ID ?? null,
      runNumber: process.env.GITHUB_RUN_NUMBER ?? null,
    },
    null,
    2,
  ),
);
