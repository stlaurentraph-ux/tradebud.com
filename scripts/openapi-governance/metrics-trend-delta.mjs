import { existsSync, readFileSync } from 'node:fs';

const args = process.argv.slice(2);
let currentPath = null;
let previousPath = null;
let baselineMetadataPath = null;
let outputMode = 'text';

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index];
  if (arg === '--current') {
    currentPath = args[index + 1] ?? null;
    index += 1;
    continue;
  }
  if (arg === '--previous') {
    previousPath = args[index + 1] ?? null;
    index += 1;
    continue;
  }
  if (arg === '--json') {
    outputMode = 'json';
    continue;
  }
  if (arg === '--baseline-metadata') {
    baselineMetadataPath = args[index + 1] ?? null;
    index += 1;
    continue;
  }
  console.error(`Unsupported argument: ${arg}`);
  process.exit(1);
}

if (!currentPath) {
  console.error('Missing required argument --current <path>');
  process.exit(1);
}
if (!existsSync(currentPath)) {
  console.error(`Current report does not exist: ${currentPath}`);
  process.exit(1);
}

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
const current = readJson(currentPath);
const previous = previousPath && existsSync(previousPath) ? readJson(previousPath) : null;
const baselineMetadata =
  baselineMetadataPath && existsSync(baselineMetadataPath)
    ? readJson(baselineMetadataPath)
    : null;

const safeNumber = (value) => (typeof value === 'number' && Number.isFinite(value) ? value : 0);

const currentWarnings = safeNumber(current.totalPresentationDriftWarnings);
const previousWarnings = previous ? safeNumber(previous.totalPresentationDriftWarnings) : null;
const currentFail = safeNumber(current.statusCounts?.FAIL);
const previousFail = previous ? safeNumber(previous.statusCounts?.FAIL) : null;
const currentSnapshotRegistryFail = safeNumber(current.snapshotRegistryStatusCounts?.FAIL);
const previousSnapshotRegistryFail = previous
  ? safeNumber(previous.snapshotRegistryStatusCounts?.FAIL)
  : null;
const currentSnapshotRegistryRows = safeNumber(current.totalSnapshotRegistryRows);
const previousSnapshotRegistryRows = previous ? safeNumber(previous.totalSnapshotRegistryRows) : null;

const report = {
  currentPath,
  previousPath: previous && previousPath ? previousPath : null,
  previousAvailable: Boolean(previous),
  baseline: {
    runId: baselineMetadata?.runId ?? null,
    workflowPath: baselineMetadata?.workflowPath ?? null,
    workflowName: baselineMetadata?.workflowName ?? null,
  },
  current: {
    fileCount: safeNumber(current.fileCount),
    passCount: safeNumber(current.statusCounts?.PASS),
    failCount: currentFail,
    unknownCount: safeNumber(current.statusCounts?.UNKNOWN),
    totalPresentationDriftWarnings: currentWarnings,
    snapshotRegistryFailCount: currentSnapshotRegistryFail,
    totalSnapshotRegistryRows: currentSnapshotRegistryRows,
  },
  delta: previous
    ? {
        failCount: currentFail - previousFail,
        totalPresentationDriftWarnings: currentWarnings - previousWarnings,
        snapshotRegistryFailCount: currentSnapshotRegistryFail - previousSnapshotRegistryFail,
        totalSnapshotRegistryRows: currentSnapshotRegistryRows - previousSnapshotRegistryRows,
      }
    : null,
};

if (outputMode === 'json') {
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  process.exit(0);
}

console.log('OpenAPI Governance Presentation Drift Delta');
console.log(`- Previous available: ${report.previousAvailable ? 'yes' : 'no'}`);
console.log(`- Baseline run id: ${report.baseline.runId ?? 'n/a'}`);
console.log(`- Baseline workflow path: ${report.baseline.workflowPath ?? 'n/a'}`);
console.log(`- Baseline workflow name: ${report.baseline.workflowName ?? 'n/a'}`);
console.log(`- Current FAIL count: ${report.current.failCount}`);
console.log(`- Current total drift warnings: ${report.current.totalPresentationDriftWarnings}`);
console.log(`- Current snapshot registry FAIL count: ${report.current.snapshotRegistryFailCount}`);
console.log(`- Current total snapshot registry rows: ${report.current.totalSnapshotRegistryRows}`);
if (report.delta) {
  const failDelta = report.delta.failCount;
  const warningDelta = report.delta.totalPresentationDriftWarnings;
  const snapshotRegistryFailDelta = report.delta.snapshotRegistryFailCount;
  const snapshotRegistryRowsDelta = report.delta.totalSnapshotRegistryRows;
  const formatSigned = (n) => (n > 0 ? `+${n}` : `${n}`);
  console.log(`- FAIL delta: ${formatSigned(failDelta)}`);
  console.log(`- Drift warning delta: ${formatSigned(warningDelta)}`);
  console.log(`- Snapshot registry FAIL delta: ${formatSigned(snapshotRegistryFailDelta)}`);
  console.log(`- Snapshot registry rows delta: ${formatSigned(snapshotRegistryRowsDelta)}`);
} else {
  console.log('- FAIL delta: n/a');
  console.log('- Drift warning delta: n/a');
  console.log('- Snapshot registry FAIL delta: n/a');
  console.log('- Snapshot registry rows delta: n/a');
}
