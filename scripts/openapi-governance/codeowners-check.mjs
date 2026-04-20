import { readFileSync } from 'node:fs';

const codeownersPath = '.github/CODEOWNERS';
const policyPath = 'docs/openapi/governance-codeowners-policy.json';
const reportArgIndex = process.argv.indexOf('--report');
const reportPath =
  reportArgIndex >= 0 ? process.argv[reportArgIndex + 1] ?? null : null;
const policy = JSON.parse(readFileSync(policyPath, 'utf8'));

if (!Array.isArray(policy.requiredEntries) || policy.requiredEntries.length === 0) {
  console.error(
    `OpenAPI governance CODEOWNERS check failed: ${policyPath} must define a non-empty requiredEntries array.`,
  );
  process.exit(1);
}

const requiredEntries = policy.requiredEntries.map((entry) => ({
  path: entry.path,
  owners: Array.isArray(entry.owners) ? entry.owners : [],
}));

const codeownersRaw = readFileSync(codeownersPath, 'utf8');
const normalizedLines = codeownersRaw
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => line.length > 0 && !line.startsWith('#'));

const codeownersMap = new Map();
for (const line of normalizedLines) {
  const [path, ...owners] = line.split(/\s+/);
  codeownersMap.set(path, owners);
}

const missingEntries = [];
const ownerMismatch = [];

for (const { path, owners: expectedOwners } of requiredEntries) {
  if (!path || expectedOwners.length === 0) {
    console.error(
      `OpenAPI governance CODEOWNERS check failed: each requiredEntries item in ${policyPath} must include path and non-empty owners.`,
    );
    process.exit(1);
  }

  const configuredOwners = codeownersMap.get(path);
  if (!configuredOwners) {
    missingEntries.push(path);
    continue;
  }

  for (const expectedOwner of expectedOwners) {
    if (!configuredOwners.includes(expectedOwner)) {
      ownerMismatch.push({
        path,
        expectedOwner,
        configuredOwners,
      });
    }
  }
}

if (missingEntries.length > 0 || ownerMismatch.length > 0) {
  if (reportPath) {
    const { writeFileSync } = await import('node:fs');
    writeFileSync(
      reportPath,
      `${JSON.stringify(
        {
          status: 'FAIL',
          missingEntries,
          ownerMismatch,
          requiredEntryCount: requiredEntries.length,
          policyPath,
          codeownersPath,
          generatedAt: new Date().toISOString(),
        },
        null,
        2,
      )}\n`,
    );
  }
  console.error(
    `OpenAPI governance CODEOWNERS check failed for ${codeownersPath}.`,
  );
  if (missingEntries.length > 0) {
    console.error('Missing required protected path entries:');
    for (const entry of missingEntries) {
      console.error(`- ${entry}`);
    }
  }
  if (ownerMismatch.length > 0) {
    console.error('Owner-handle mismatches:');
    for (const mismatch of ownerMismatch) {
      console.error(
        `- ${mismatch.path} expected ${mismatch.expectedOwner} but found [${mismatch.configuredOwners.join(', ')}]`,
      );
    }
  }
  process.exit(1);
}

if (reportPath) {
  const { writeFileSync } = await import('node:fs');
  writeFileSync(
    reportPath,
    `${JSON.stringify(
      {
        status: 'PASS',
        missingEntries: [],
        ownerMismatch: [],
        requiredEntryCount: requiredEntries.length,
        policyPath,
        codeownersPath,
        generatedAt: new Date().toISOString(),
      },
      null,
      2,
    )}\n`,
  );
}

console.log(
  `OpenAPI governance CODEOWNERS check passed (${requiredEntries.length} required entries from ${policyPath}).`,
);
