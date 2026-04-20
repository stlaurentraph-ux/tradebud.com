import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const APPROVAL_FLAG = process.env.OPENAPI_BASELINE_APPROVED;
const REFRESH_REASON = process.env.OPENAPI_BASELINE_REASON;

if (APPROVAL_FLAG !== 'true') {
  console.error(
    'Refusing to refresh baseline. Set OPENAPI_BASELINE_APPROVED=true to continue.',
  );
  process.exit(1);
}

if (!REFRESH_REASON || REFRESH_REASON.trim().length < 8) {
  console.error(
    'Refusing to refresh baseline. Set OPENAPI_BASELINE_REASON with at least 8 characters.',
  );
  process.exit(1);
}

const lintRun = spawnSync('npm', ['run', 'openapi:lint'], {
  encoding: 'utf8',
});

if (lintRun.stdout) {
  process.stdout.write(lintRun.stdout);
}

if (lintRun.stderr) {
  process.stderr.write(lintRun.stderr);
}

const combinedOutput = `${lintRun.stdout ?? ''}\n${lintRun.stderr ?? ''}`;

if (lintRun.status !== 0) {
  console.error('OpenAPI lint failed; baseline was not updated.');
  process.exit(lintRun.status ?? 1);
}

let warnings = 0;
let errors = 0;

const warningMatch = combinedOutput.match(/You have (\d+) warnings?/i);
if (warningMatch) {
  warnings = Number(warningMatch[1]);
}

const errorAndWarningMatch = combinedOutput.match(
  /(\d+) errors?(?: and (\d+) warnings?)?/i,
);
if (errorAndWarningMatch) {
  errors = Number(errorAndWarningMatch[1]);
  if (errorAndWarningMatch[2] !== undefined) {
    warnings = Number(errorAndWarningMatch[2]);
  }
}

const baselinePath = 'docs/openapi/lint-baseline.json';
const previousBaseline = JSON.parse(readFileSync(baselinePath, 'utf8'));

const nextBaseline = {
  errors,
  warnings,
  note: `Baseline refreshed after approved governance update on ${new Date().toISOString().slice(0, 10)}.`,
  refreshReason: REFRESH_REASON.trim(),
  refreshedAt: new Date().toISOString(),
  refreshedBy: process.env.GITHUB_ACTOR ?? process.env.USER ?? 'unknown',
  previous: {
    errors: Number(previousBaseline.errors ?? 0),
    warnings: Number(previousBaseline.warnings ?? 0),
  },
};

writeFileSync(`${baselinePath}`, `${JSON.stringify(nextBaseline, null, 2)}\n`);

console.log(
  `Updated ${baselinePath} -> errors=${errors}, warnings=${warnings}.`,
);
