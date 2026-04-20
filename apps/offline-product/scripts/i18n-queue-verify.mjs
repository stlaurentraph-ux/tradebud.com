import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

function scriptPath(name) {
  return resolve(process.cwd(), 'scripts', name);
}

function runNode(scriptName, args = [], { capture = false } = {}) {
  const r = spawnSync(process.execPath, [scriptPath(scriptName), ...args], {
    cwd: process.cwd(),
    stdio: capture ? 'pipe' : 'inherit',
    encoding: capture ? 'utf8' : undefined,
  });
  if (r.status !== 0) {
    process.exit(r.status ?? 1);
  }
  return capture ? r.stdout : undefined;
}

runNode('i18n-queue-panel.smoke.mjs');
const summaryJson = runNode('i18n-queue-panel.smoke.mjs', ['--summary-json'], { capture: true });
writeFileSync(resolve(process.cwd(), 'queue-i18n-smoke-summary.json'), summaryJson, 'utf8');
runNode('i18n-queue-summary-assert.mjs');
runNode('i18n-queue-baseline-schema-assert.mjs');
runNode('i18n-queue-report-generate.mjs');
runNode('i18n-queue-report-assert.mjs');
process.stdout.write('PASS queue i18n verify (full chain)\n');
