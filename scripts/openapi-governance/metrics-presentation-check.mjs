import { readFileSync, existsSync } from 'node:fs';
import { buildGovernanceSummaryLines } from './metrics-summary-lines.mjs';

const metricsPath = 'openapi-governance-metrics.json';
const summaryPath = process.env.GITHUB_STEP_SUMMARY;

if (!existsSync(metricsPath)) {
  console.error(`Metrics presentation check failed: missing ${metricsPath}`);
  process.exit(1);
}
if (!summaryPath || !existsSync(summaryPath)) {
  console.error('Metrics presentation check failed: GITHUB_STEP_SUMMARY is unavailable');
  process.exit(1);
}

const metrics = JSON.parse(readFileSync(metricsPath, 'utf8'));
const runUrl =
  process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID
    ? `https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
    : null;

const expectedBlock = `${buildGovernanceSummaryLines({
  readmeStatus: metrics.readmeValidationStatus ?? 'FAIL',
  policyStatus: metrics.policyValidationStatus ?? 'FAIL',
  codeownersStatus: metrics.codeownersValidationStatus ?? 'FAIL',
  overallStatus: metrics.overallStatus ?? 'FAIL',
  runUrl,
}).join('\n')}\n`;

const summaryContent = readFileSync(summaryPath, 'utf8');
if (!summaryContent.includes(expectedBlock)) {
  console.error(
    'Metrics presentation snapshot drift detected: governance summary block formatting/content does not match expected template.',
  );
  process.exit(1);
}

console.log('Metrics presentation snapshot check passed.');
