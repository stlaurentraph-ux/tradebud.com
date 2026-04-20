import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  buildGovernanceSummaryLines,
  GOVERNANCE_SUMMARY_HEADING,
} from './metrics-summary-lines.mjs';

const scriptPath = resolve('scripts/openapi-governance/metrics-generate.mjs');

const runCase = ({
  name,
  readmeStatus,
  policyStatus,
  codeownersStatus,
  expectedOverallStatus,
}) => {
  const tempDir = mkdtempSync(join(tmpdir(), 'tracebud-governance-metrics-'));
  const summaryPath = join(tempDir, 'summary.md');

  try {
    mkdirSync(tempDir, { recursive: true });

    writeFileSync(
      join(tempDir, 'openapi-governance-readme-report.json'),
      `${JSON.stringify(
        {
          status: readmeStatus,
          commandCount: 1,
          pathCount: 1,
          requiredAnchorCount: 1,
          missingAnchors: [],
          markdownErrors: [],
          readmePath: 'scripts/openapi-governance/README.md',
          packageJsonPath: 'package.json',
          readmePolicyPath: 'docs/openapi/governance-readme-policy.json',
          readmePolicySchemaPath: 'docs/openapi/governance-readme-policy.schema.json',
          generatedAt: new Date().toISOString(),
        },
        null,
        2,
      )}\n`,
    );
    writeFileSync(
      join(tempDir, 'openapi-governance-policy-report.json'),
      `${JSON.stringify(
        {
          status: policyStatus,
          errorCount: 0,
          errors: [],
          entryCount: 4,
          policyPath: 'docs/openapi/governance-codeowners-policy.json',
          schemaPath: 'docs/openapi/governance-codeowners-policy.schema.json',
          generatedAt: new Date().toISOString(),
        },
        null,
        2,
      )}\n`,
    );
    writeFileSync(
      join(tempDir, 'openapi-governance-codeowners-report.json'),
      `${JSON.stringify(
        {
          status: codeownersStatus,
          missingEntries: [],
          ownerMismatch: [],
          entryCount: 4,
          policyPath: 'docs/openapi/governance-codeowners-policy.json',
          codeownersPath: '.github/CODEOWNERS',
          generatedAt: new Date().toISOString(),
        },
        null,
        2,
      )}\n`,
    );

    execFileSync('node', [scriptPath], {
      cwd: tempDir,
      env: {
        ...process.env,
        GITHUB_STEP_SUMMARY: summaryPath,
        GITHUB_REPOSITORY: 'owner/repo',
        GITHUB_RUN_ID: '123456',
      },
      stdio: 'pipe',
    });

    const metricsPath = join(tempDir, 'openapi-governance-metrics.json');
    if (!existsSync(metricsPath)) {
      throw new Error(`${name}: metrics file not generated`);
    }

    const metrics = JSON.parse(readFileSync(metricsPath, 'utf8'));
    if (metrics.overallStatus !== expectedOverallStatus) {
      throw new Error(
        `${name}: expected overallStatus ${expectedOverallStatus}, got ${metrics.overallStatus}`,
      );
    }
    if (metrics.readmeValidationStatus !== readmeStatus) {
      throw new Error(
        `${name}: expected readmeValidationStatus ${readmeStatus}, got ${metrics.readmeValidationStatus}`,
      );
    }
    if (metrics.presentationValidationStatus !== 'UNKNOWN') {
      throw new Error(
        `${name}: expected presentationValidationStatus UNKNOWN, got ${metrics.presentationValidationStatus}`,
      );
    }
    if (metrics.presentationDriftWarningCount !== 0) {
      throw new Error(
        `${name}: expected presentationDriftWarningCount 0, got ${metrics.presentationDriftWarningCount}`,
      );
    }
    if (metrics.presentationValidationRecordedAt !== null) {
      throw new Error(
        `${name}: expected presentationValidationRecordedAt null, got ${metrics.presentationValidationRecordedAt}`,
      );
    }
    if (metrics.policyValidationStatus !== policyStatus) {
      throw new Error(
        `${name}: expected policyValidationStatus ${policyStatus}, got ${metrics.policyValidationStatus}`,
      );
    }
    if (metrics.codeownersValidationStatus !== codeownersStatus) {
      throw new Error(
        `${name}: expected codeownersValidationStatus ${codeownersStatus}, got ${metrics.codeownersValidationStatus}`,
      );
    }
    if (!Array.isArray(metrics.expectedArtifacts) || metrics.expectedArtifacts.length !== 3) {
      throw new Error(`${name}: expectedArtifacts must contain 3 entries`);
    }
    const expectedArtifactNames = [
      'contracts-openapi-readme-governance-metrics',
      'contracts-openapi-governance-metrics',
      'contracts-openapi-governance-reports',
    ];
    for (const artifactName of expectedArtifactNames) {
      if (!metrics.expectedArtifacts.some((artifact) => artifact.name === artifactName)) {
        throw new Error(`${name}: expectedArtifacts missing ${artifactName}`);
      }
    }

    const summary = readFileSync(summaryPath, 'utf8');
    if (!summary.includes(GOVERNANCE_SUMMARY_HEADING)) {
      throw new Error(`${name}: governance summary heading missing`);
    }
    const requiredSummaryLines = buildGovernanceSummaryLines({
      readmeStatus,
      policyStatus,
      codeownersStatus,
      overallStatus: expectedOverallStatus,
      runUrl: 'https://github.com/owner/repo/actions/runs/123456',
    });
    let lastIndex = -1;
    for (const line of requiredSummaryLines) {
      const currentIndex = summary.indexOf(line);
      if (currentIndex < 0) {
        throw new Error(`${name}: missing summary line "${line}"`);
      }
      if (currentIndex < lastIndex) {
        throw new Error(`${name}: summary line out of order "${line}"`);
      }
      lastIndex = currentIndex;
    }
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
};

runCase({
  name: 'all-pass',
  readmeStatus: 'PASS',
  policyStatus: 'PASS',
  codeownersStatus: 'PASS',
  expectedOverallStatus: 'PASS',
});

runCase({
  name: 'readme-fail',
  readmeStatus: 'FAIL',
  policyStatus: 'PASS',
  codeownersStatus: 'PASS',
  expectedOverallStatus: 'FAIL',
});

console.log('Metrics generator smoke checks passed (2 scenarios).');
