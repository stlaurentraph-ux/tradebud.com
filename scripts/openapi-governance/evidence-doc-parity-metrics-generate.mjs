import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const passPath = 'openapi-evidence-doc-parity-pass.json';
const failPath = 'openapi-evidence-doc-parity-fail.json';
const outputPath = 'openapi-evidence-doc-parity-metrics.json';

if (!existsSync(passPath)) {
  console.error(`Evidence-doc parity metrics generation failed: Missing file ${passPath}`);
  process.exit(1);
}
if (!existsSync(failPath)) {
  console.error(`Evidence-doc parity metrics generation failed: Missing file ${failPath}`);
  process.exit(1);
}

let passPayload;
let failPayload;
try {
  passPayload = JSON.parse(readFileSync(passPath, 'utf8'));
  failPayload = JSON.parse(readFileSync(failPath, 'utf8'));
} catch (error) {
  console.error(`Evidence-doc parity metrics generation failed: ${error.message}`);
  process.exit(1);
}

const metrics = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  parityJsonSchemaVersion: passPayload?.schemaVersion ?? null,
  passStatus: passPayload?.status ?? 'UNKNOWN',
  failStatus: failPayload?.status ?? 'UNKNOWN',
  failCode: failPayload?.code ?? null,
  passRequiredFieldCount: Array.isArray(passPayload?.checks?.requiredFields)
    ? passPayload.checks.requiredFields.length
    : null,
  passFieldCheckCount: Array.isArray(passPayload?.checks?.fieldChecks)
    ? passPayload.checks.fieldChecks.length
    : null,
  runId: process.env.GITHUB_RUN_ID ?? null,
  runNumber: process.env.GITHUB_RUN_NUMBER ?? null,
};

writeFileSync(outputPath, `${JSON.stringify(metrics, null, 2)}\n`);
console.log(`Evidence-doc parity metrics generated (${outputPath}).`);
