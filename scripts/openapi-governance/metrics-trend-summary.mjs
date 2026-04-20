import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const METRICS_FILE = 'openapi-governance-metrics.json';

const args = process.argv.slice(2);
const inputPaths = [];
let outputMode = 'text';

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index];
  if (arg === '--input') {
    const value = args[index + 1];
    if (!value) {
      console.error('Missing value for --input');
      process.exit(1);
    }
    inputPaths.push(value);
    index += 1;
    continue;
  }
  if (arg === '--json') {
    outputMode = 'json';
    continue;
  }
  console.error(`Unsupported argument: ${arg}`);
  process.exit(1);
}

if (inputPaths.length === 0) {
  inputPaths.push(process.cwd());
}

const discoveredFiles = [];
const seenFiles = new Set();

const collectMetricsFiles = (targetPath) => {
  const absolutePath = resolve(targetPath);
  if (!existsSync(absolutePath)) {
    return;
  }
  const stat = statSync(absolutePath);
  if (stat.isDirectory()) {
    for (const entry of readdirSync(absolutePath)) {
      collectMetricsFiles(join(absolutePath, entry));
    }
    return;
  }
  if (!stat.isFile()) {
    return;
  }
  if (!absolutePath.endsWith(`/${METRICS_FILE}`)) {
    return;
  }
  if (seenFiles.has(absolutePath)) {
    return;
  }
  seenFiles.add(absolutePath);
  discoveredFiles.push(absolutePath);
};

for (const inputPath of inputPaths) {
  collectMetricsFiles(inputPath);
}

const statusCounts = {
  PASS: 0,
  FAIL: 0,
  UNKNOWN: 0,
};
let totalPresentationDriftWarnings = 0;
const snapshotRegistryStatusCounts = {
  PASS: 0,
  FAIL: 0,
};
let totalSnapshotRegistryRows = 0;
const recordedAt = [];
const files = [];

for (const filePath of discoveredFiles) {
  const raw = readFileSync(filePath, 'utf8');
  const metrics = JSON.parse(raw);
  const status = metrics.presentationValidationStatus;
  if (status === 'PASS' || status === 'FAIL' || status === 'UNKNOWN') {
    statusCounts[status] += 1;
  }
  const warningCount = Number.isInteger(metrics.presentationDriftWarningCount)
    ? metrics.presentationDriftWarningCount
    : 0;
  totalPresentationDriftWarnings += warningCount;
  const snapshotRegistryStatus =
    metrics.snapshotRegistryStatus === 'PASS' || metrics.snapshotRegistryStatus === 'FAIL'
      ? metrics.snapshotRegistryStatus
      : 'FAIL';
  snapshotRegistryStatusCounts[snapshotRegistryStatus] += 1;
  const snapshotRegistryRowCount = Number.isInteger(metrics.snapshotRegistryRowCount)
    ? metrics.snapshotRegistryRowCount
    : 0;
  totalSnapshotRegistryRows += snapshotRegistryRowCount;
  if (typeof metrics.presentationValidationRecordedAt === 'string') {
    recordedAt.push(metrics.presentationValidationRecordedAt);
  }
  files.push({
    path: filePath,
    status: metrics.presentationValidationStatus ?? 'UNKNOWN',
    warningCount,
    recordedAt: metrics.presentationValidationRecordedAt ?? null,
    generatedAt: metrics.generatedAt ?? null,
    snapshotRegistryStatus,
    snapshotRegistryRowCount,
  });
}

recordedAt.sort();

const report = {
  scannedPaths: inputPaths.map((value) => resolve(value)),
  fileCount: files.length,
  statusCounts,
  totalPresentationDriftWarnings,
  snapshotRegistryStatusCounts,
  totalSnapshotRegistryRows,
  earliestPresentationValidationRecordedAt: recordedAt[0] ?? null,
  latestPresentationValidationRecordedAt: recordedAt[recordedAt.length - 1] ?? null,
  files,
};

if (outputMode === 'json') {
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  process.exit(0);
}

console.log('OpenAPI Governance Presentation Trend');
console.log(`- Metrics files: ${report.fileCount}`);
console.log(`- PASS: ${report.statusCounts.PASS}`);
console.log(`- FAIL: ${report.statusCounts.FAIL}`);
console.log(`- UNKNOWN: ${report.statusCounts.UNKNOWN}`);
console.log(`- Total drift warnings: ${report.totalPresentationDriftWarnings}`);
console.log(`- Snapshot registry PASS: ${report.snapshotRegistryStatusCounts.PASS}`);
console.log(`- Snapshot registry FAIL: ${report.snapshotRegistryStatusCounts.FAIL}`);
console.log(`- Total snapshot registry rows: ${report.totalSnapshotRegistryRows}`);
console.log(
  `- Validation window: ${report.earliestPresentationValidationRecordedAt ?? 'n/a'} -> ${report.latestPresentationValidationRecordedAt ?? 'n/a'}`,
);
