import { runMarkdownReferenceCheck } from './markdown-reference-check.mjs';
import { readFileSync, writeFileSync } from 'node:fs';

const readmePath = 'scripts/openapi-governance/README.md';
const packageJsonPath = 'package.json';
const readmePolicyPath = 'docs/openapi/governance-readme-policy.json';
const readmePolicySchemaPath = 'docs/openapi/governance-readme-policy.schema.json';
const reportArgIndex = process.argv.indexOf('--report');
const reportPath =
  reportArgIndex >= 0 ? process.argv[reportArgIndex + 1] ?? null : null;
const writeReport = (report) => {
  if (!reportPath) {
    return;
  }
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
};
const failWithReport = (message, report) => {
  writeReport(report);
  console.error(message);
  process.exit(1);
};

const result = runMarkdownReferenceCheck({
  markdownPath: readmePath,
  packageJsonPath,
  enforceCommands: true,
  enforcePaths: true,
});

if (result.errors.length > 0) {
  failWithReport(`README reference check failed for ${readmePath}:`, {
    status: 'FAIL',
    commandCount: result.commandCount,
    pathCount: result.pathCount,
    requiredAnchorCount: 0,
    missingAnchors: [],
    markdownErrors: result.errors,
    readmePath,
    packageJsonPath,
    readmePolicyPath,
    readmePolicySchemaPath,
    generatedAt: new Date().toISOString(),
  });
}

const readmeContent = readFileSync(readmePath, 'utf8');
const readmePolicy = JSON.parse(readFileSync(readmePolicyPath, 'utf8'));
const readmePolicySchema = JSON.parse(readFileSync(readmePolicySchemaPath, 'utf8'));

const allowedTopLevel = new Set(Object.keys(readmePolicySchema.properties ?? {}));
const policyErrors = [];
if (typeof readmePolicy !== 'object' || readmePolicy === null || Array.isArray(readmePolicy)) {
  policyErrors.push('README policy must be a JSON object.');
} else {
  for (const key of Object.keys(readmePolicy)) {
    if (!allowedTopLevel.has(key)) {
      policyErrors.push(`Unsupported README policy key: ${key}`);
    }
  }

  if (
    !Array.isArray(readmePolicy.requiredAnchors) ||
    readmePolicy.requiredAnchors.length === 0
  ) {
    policyErrors.push('requiredAnchors must be a non-empty array.');
  } else {
    for (const [index, anchor] of readmePolicy.requiredAnchors.entries()) {
      if (typeof anchor !== 'string' || anchor.trim().length === 0) {
        policyErrors.push(`requiredAnchors[${index}] must be a non-empty string.`);
      }
    }
  }
}

if (policyErrors.length > 0) {
  failWithReport(`README policy validation failed for ${readmePolicyPath}:`, {
    status: 'FAIL',
    commandCount: result.commandCount,
    pathCount: result.pathCount,
    requiredAnchorCount: 0,
    missingAnchors: [],
    markdownErrors: policyErrors,
    readmePath,
    packageJsonPath,
    readmePolicyPath,
    readmePolicySchemaPath,
    generatedAt: new Date().toISOString(),
  });
}

const missingProcedureEntries = readmePolicy.requiredAnchors.filter(
  (entry) => !readmeContent.includes(entry),
);

if (missingProcedureEntries.length > 0) {
  failWithReport(`README structure check failed for ${readmePath}:`, {
    status: 'FAIL',
    commandCount: result.commandCount,
    pathCount: result.pathCount,
    requiredAnchorCount: readmePolicy.requiredAnchors.length,
    missingAnchors: missingProcedureEntries,
    markdownErrors: result.errors,
    readmePath,
    packageJsonPath,
    readmePolicyPath,
    readmePolicySchemaPath,
    generatedAt: new Date().toISOString(),
  });
}

writeReport({
  status: 'PASS',
  commandCount: result.commandCount,
  pathCount: result.pathCount,
  requiredAnchorCount: readmePolicy.requiredAnchors.length,
  missingAnchors: [],
  markdownErrors: result.errors,
  readmePath,
  packageJsonPath,
  readmePolicyPath,
  readmePolicySchemaPath,
  generatedAt: new Date().toISOString(),
});

console.log(
  `README checks passed (${result.commandCount} commands, ${result.pathCount} paths, ${readmePolicy.requiredAnchors.length} policy anchors verified).`,
);
