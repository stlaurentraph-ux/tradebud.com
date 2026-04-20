import { mkdtempSync, mkdirSync, writeFileSync, rmSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const trendAssertScript = resolve('scripts/openapi-governance/trend-report-assert.mjs');
const deltaAssertScript = resolve('scripts/openapi-governance/trend-delta-report-assert.mjs');
const trendSchema = resolve('docs/openapi/governance-presentation-trend.schema.json');
const deltaSchema = resolve('docs/openapi/governance-presentation-trend-delta.schema.json');

const runNode = (scriptPath, cwd) =>
  spawnSync('node', [scriptPath], {
    cwd,
    encoding: 'utf8',
  });

const expectSuccess = (result, label) => {
  if (result.status !== 0) {
    throw new Error(`${label} expected success, got exit ${result.status}: ${result.stderr}`);
  }
};

const expectFailure = (result, label) => {
  if (result.status === 0) {
    throw new Error(`${label} expected failure but exited 0`);
  }
};

const createHarness = () => {
  const root = mkdtempSync(join(tmpdir(), 'tracebud-trend-assert-smoke-'));
  mkdirSync(join(root, 'docs/openapi'), { recursive: true });
  copyFileSync(trendSchema, join(root, 'docs/openapi/governance-presentation-trend.schema.json'));
  copyFileSync(
    deltaSchema,
    join(root, 'docs/openapi/governance-presentation-trend-delta.schema.json'),
  );
  return root;
};

const validTrendReport = {
  scannedPaths: ['/tmp/example'],
  fileCount: 1,
  statusCounts: { PASS: 1, FAIL: 0, UNKNOWN: 0 },
  totalPresentationDriftWarnings: 0,
  snapshotRegistryStatusCounts: { PASS: 1, FAIL: 0 },
  totalSnapshotRegistryRows: 1,
  earliestPresentationValidationRecordedAt: '2026-04-16T10:00:00.000Z',
  latestPresentationValidationRecordedAt: '2026-04-16T10:00:00.000Z',
  files: [
    {
      path: '/tmp/example/openapi-governance-metrics.json',
      status: 'PASS',
      warningCount: 0,
      recordedAt: '2026-04-16T10:00:00.000Z',
      generatedAt: '2026-04-16T10:00:00.000Z',
      snapshotRegistryStatus: 'PASS',
      snapshotRegistryRowCount: 1,
    },
  ],
};

const validDeltaReport = {
  currentPath: 'openapi-governance-presentation-trend.json',
  previousPath: 'openapi-governance-presentation-trend-previous.json',
  previousAvailable: true,
  baseline: {
    runId: '123456789',
    workflowPath: '.github/workflows/ci.yml',
    workflowName: 'CI',
  },
  current: {
    fileCount: 1,
    passCount: 1,
    failCount: 0,
    unknownCount: 0,
    totalPresentationDriftWarnings: 0,
    snapshotRegistryFailCount: 0,
    totalSnapshotRegistryRows: 1,
  },
  delta: {
    failCount: 0,
    totalPresentationDriftWarnings: 0,
    snapshotRegistryFailCount: 0,
    totalSnapshotRegistryRows: 0,
  },
};

const harness = createHarness();

try {
  writeFileSync(
    join(harness, 'openapi-governance-presentation-trend.json'),
    `${JSON.stringify(validTrendReport, null, 2)}\n`,
  );
  writeFileSync(
    join(harness, 'openapi-governance-presentation-trend-delta.json'),
    `${JSON.stringify(validDeltaReport, null, 2)}\n`,
  );

  expectSuccess(runNode(trendAssertScript, harness), 'trend assert valid case');
  expectSuccess(runNode(deltaAssertScript, harness), 'delta assert valid case');

  writeFileSync(
    join(harness, 'openapi-governance-presentation-trend.json'),
    `${JSON.stringify({ ...validTrendReport, fileCount: -1 }, null, 2)}\n`,
  );
  expectFailure(runNode(trendAssertScript, harness), 'trend assert invalid case');

  writeFileSync(
    join(harness, 'openapi-governance-presentation-trend-delta.json'),
    `${JSON.stringify(
      {
        ...validDeltaReport,
        previousAvailable: false,
        delta: {
          failCount: 0,
          totalPresentationDriftWarnings: 0,
          snapshotRegistryFailCount: 0,
          totalSnapshotRegistryRows: 0,
        },
      },
      null,
      2,
    )}\n`,
  );
  expectFailure(runNode(deltaAssertScript, harness), 'delta assert invalid case');
} finally {
  rmSync(harness, { recursive: true, force: true });
}

console.log('Trend assertion smoke checks passed.');
