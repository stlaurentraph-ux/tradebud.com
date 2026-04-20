import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

const REPORT_SCHEMA_VERSION = '2';
const REPORT_SCHEMA_DIGEST_ALGORITHM = 'sha256';
const summaryPath = resolve(process.cwd(), 'queue-i18n-smoke-summary.json');
const previousPath = resolve(process.cwd(), 'queue-i18n-smoke-summary-previous.json');
const previousReportPath = resolve(process.cwd(), 'queue-i18n-report-previous.json');
const baselinePath = resolve(process.cwd(), 'queue-i18n-baseline-metadata.json');
const outputPath = resolve(process.cwd(), 'queue-i18n-report.json');
const schemaPath = resolve(process.cwd(), '../../docs/openapi/queue-i18n-report.schema.json');

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function main() {
  if (!existsSync(summaryPath)) {
    throw new Error(`Missing summary payload: ${summaryPath}`);
  }

  const current = readJson(summaryPath);
  const previous = existsSync(previousPath) ? readJson(previousPath) : null;
  const baseline = existsSync(baselinePath) ? readJson(baselinePath) : null;
  if (!existsSync(schemaPath)) {
    throw new Error(`Missing report schema file: ${schemaPath}`);
  }
  const schemaSha256 = createHash('sha256').update(readFileSync(schemaPath)).digest('hex');
  // Primary pin for consumers: single token. schemaSha256 is duplicated for backward compatibility.
  const schemaDigestRef = `${REPORT_SCHEMA_DIGEST_ALGORITHM}:${schemaSha256}`;

  const currentCount = Number(current.requiredKeyCount);
  const previousCount = previous ? Number(previous.requiredKeyCount) : NaN;
  const requiredKeyDelta =
    Number.isFinite(currentCount) && Number.isFinite(previousCount)
      ? currentCount - previousCount
      : null;

  let previousReportRaw = null;
  let previousReportAvailable = false;
  if (existsSync(previousReportPath)) {
    try {
      previousReportRaw = readJson(previousReportPath);
      previousReportAvailable =
        previousReportRaw !== null && typeof previousReportRaw === 'object' && !Array.isArray(previousReportRaw);
    } catch {
      previousReportAvailable = false;
      previousReportRaw = null;
    }
  }
  const previousSchemaDigestRef =
    previousReportAvailable &&
    typeof previousReportRaw.schemaDigestRef === 'string' &&
    /^sha256:[a-f0-9]{64}$/.test(previousReportRaw.schemaDigestRef)
      ? previousReportRaw.schemaDigestRef
      : null;
  const schemaDigestRefChanged =
    previousSchemaDigestRef === null ? null : schemaDigestRef !== previousSchemaDigestRef;

  const report = {
    schemaVersion: REPORT_SCHEMA_VERSION,
    schemaDigestAlgorithm: REPORT_SCHEMA_DIGEST_ALGORITHM,
    schemaSha256,
    schemaDigestRef,
    generatedAt: new Date().toISOString(),
    current: {
      status: String(current.status ?? 'PASS'),
      smokeVersion: String(current.smokeVersion ?? 'unknown'),
      requiredKeyCount: Number.isFinite(currentCount) ? currentCount : 0,
      locales: Array.isArray(current.locales) ? current.locales.map((v) => String(v)) : [],
    },
    comparison: {
      previousAvailable: Boolean(previous),
      requiredKeyDelta,
      previousSmokeVersion: previous?.smokeVersion ? String(previous.smokeVersion) : null,
      previousReportAvailable,
      previousSchemaDigestRef,
      schemaDigestRefChanged,
    },
    baseline: baseline
      ? {
          schemaVersion: String(baseline.schemaVersion ?? ''),
          artifactId: String(baseline.artifactId ?? ''),
          runId: String(baseline.runId ?? ''),
          workflowPath: baseline.workflowPath == null ? null : String(baseline.workflowPath),
          workflowName: baseline.workflowName == null ? null : String(baseline.workflowName),
        }
      : null,
  };

  writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  process.stdout.write(`PASS queue i18n combined report generated (${outputPath})\n`);
}

try {
  main();
} catch (error) {
  process.stderr.write(`FAIL queue i18n combined report generation: ${error.message}\n`);
  process.exitCode = 1;
}
