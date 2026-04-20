import { readFileSync } from 'node:fs';

const policyPath = 'docs/openapi/governance-codeowners-policy.json';
const schemaPath = 'docs/openapi/governance-codeowners-policy.schema.json';
const reportArgIndex = process.argv.indexOf('--report');
const reportPath =
  reportArgIndex >= 0 ? process.argv[reportArgIndex + 1] ?? null : null;

const policy = JSON.parse(readFileSync(policyPath, 'utf8'));
const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));

const errors = [];
const allowedTopLevel = new Set(Object.keys(schema.properties ?? {}));

const pushError = (message) => errors.push(message);

if (typeof policy !== 'object' || policy === null || Array.isArray(policy)) {
  pushError('Policy must be a JSON object.');
} else {
  for (const key of Object.keys(policy)) {
    if (!allowedTopLevel.has(key)) {
      pushError(`Unsupported top-level key: ${key}`);
    }
  }

  if (!Array.isArray(policy.requiredEntries) || policy.requiredEntries.length === 0) {
    pushError('requiredEntries must be a non-empty array.');
  } else {
    const seenPaths = new Set();

    for (const [index, entry] of policy.requiredEntries.entries()) {
      if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
        pushError(`requiredEntries[${index}] must be an object.`);
        continue;
      }

      const entryKeys = Object.keys(entry);
      for (const key of entryKeys) {
        if (key !== 'path' && key !== 'owners') {
          pushError(`requiredEntries[${index}] has unsupported key: ${key}`);
        }
      }

      if (typeof entry.path !== 'string' || entry.path.trim().length === 0) {
        pushError(`requiredEntries[${index}].path must be a non-empty string.`);
      } else if (seenPaths.has(entry.path)) {
        pushError(`requiredEntries[${index}].path is duplicated: ${entry.path}`);
      } else {
        seenPaths.add(entry.path);
      }

      if (!Array.isArray(entry.owners) || entry.owners.length === 0) {
        pushError(`requiredEntries[${index}].owners must be a non-empty array.`);
      } else {
        const seenOwners = new Set();
        for (const owner of entry.owners) {
          if (typeof owner !== 'string' || owner.trim().length === 0) {
            pushError(
              `requiredEntries[${index}].owners contains empty/non-string owner.`,
            );
            continue;
          }
          if (!/^@[^\s]+$/.test(owner)) {
            pushError(
              `requiredEntries[${index}].owners contains invalid handle format: ${owner}`,
            );
          }
          if (seenOwners.has(owner)) {
            pushError(
              `requiredEntries[${index}].owners contains duplicate owner: ${owner}`,
            );
          }
          seenOwners.add(owner);
        }
      }
    }
  }
}

if (errors.length > 0) {
  if (reportPath) {
    const { writeFileSync } = await import('node:fs');
    writeFileSync(
      reportPath,
      `${JSON.stringify(
        {
          status: 'FAIL',
          errorCount: errors.length,
          errors,
          policyPath,
          schemaPath,
          generatedAt: new Date().toISOString(),
        },
        null,
        2,
      )}\n`,
    );
  }
  console.error(
    `OpenAPI governance policy validation failed for ${policyPath} (schema reference: ${schemaPath}):`,
  );
  for (const error of errors) {
    console.error(`- ${error}`);
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
        errorCount: 0,
        errors: [],
        entryCount: policy.requiredEntries.length,
        policyPath,
        schemaPath,
        generatedAt: new Date().toISOString(),
      },
      null,
      2,
    )}\n`,
  );
}

console.log(
  `OpenAPI governance policy validation passed (${policy.requiredEntries.length} entries).`,
);
