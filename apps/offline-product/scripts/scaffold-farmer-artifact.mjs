#!/usr/bin/env node
/**
 * Scaffold checklist + auto-wire registry/orchestrator for a new farmer-owned cross-device artifact.
 *
 * Usage:
 *   node scripts/scaffold-farmer-artifact.mjs --id land_survey --audit land_survey_synced
 *   node scripts/scaffold-farmer-artifact.mjs --id land_survey --audit land_survey_synced --local-table plot_evidence --no-write
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function parseArgs(argv) {
  const out = { id: null, audit: null, localTable: null, noWrite: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--id') out.id = argv[++i];
    else if (arg === '--audit') out.audit = argv[++i];
    else if (arg === '--local-table') out.localTable = argv[++i];
    else if (arg === '--no-write') out.noWrite = true;
  }
  return out;
}

function toPascalCase(slug) {
  return slug
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

function appendToConstArray(source, exportName, value) {
  if (source.includes(`'${value}'`)) return { source, changed: false };
  const pattern = new RegExp(`(export const ${exportName} = \\[[\\s\\S]*?)(\\] as const;)`);
  const next = source.replace(pattern, `$1  '${value}',\n$2`);
  return { source: next, changed: next !== source };
}

function wireRegistry(audit, restoreFn, noWrite) {
  const registryPath = path.join(root, 'features/sync/farmerArtifactRegistry.ts');
  let source = fs.readFileSync(registryPath, 'utf8');
  let changed = false;

  for (const [exportName, value] of [
    ['FIELD_CLOUD_AUDIT_EVENT_TYPES', audit],
    ['FARMER_ARTIFACT_RESTORE_MODULES', restoreFn],
  ]) {
    const result = appendToConstArray(source, exportName, value);
    source = result.source;
    changed = changed || result.changed;
  }

  if (changed && !noWrite) {
    fs.writeFileSync(registryPath, source);
  }
  return changed;
}

function wireOrchestrator(restoreFn, id, noWrite) {
  const orchestratorPath = path.join(root, 'features/sync/restoreFarmerCloudState.ts');
  let source = fs.readFileSync(orchestratorPath, 'utf8');
  if (source.includes(restoreFn)) return false;

  const importLine = `import { ${restoreFn} } from '@/features/sync/${restoreFn}';`;
  if (!source.includes(importLine)) {
    const lastImport = source.lastIndexOf("from '@/features/sync/");
    const lineEnd = source.indexOf('\n', lastImport);
    source = `${source.slice(0, lineEnd + 1)}${importLine}\n${source.slice(lineEnd + 1)}`;
  }

  const todoCall = `
  // TODO(${id}): wire ${restoreFn} result into RestoreFarmerCloudStateResult
  await ${restoreFn}({ apiFarmerId: params.apiFarmerId, ownedFarmerIds: params.ownedFarmerIds }).catch(() => undefined);`;

  const marker = '  const [photos, evidence, devicePrefs, profilePhoto, mappingDraft] = await Promise.all([';
  if (source.includes(marker) && !source.includes(restoreFn)) {
    source = source.replace(marker, `${todoCall}\n${marker}`);
  }

  if (!noWrite) {
    fs.writeFileSync(orchestratorPath, source);
  }
  return true;
}

function main() {
  const { id, audit, localTable, noWrite } = parseArgs(process.argv.slice(2));
  if (!id || !audit) {
    console.error(
      'Usage: node scripts/scaffold-farmer-artifact.mjs --id <slug> --audit <audit_event> [--local-table <table>] [--no-write]',
    );
    process.exit(1);
  }

  const pascal = toPascalCase(id);
  const restoreFn = `restoreLocal${pascal}FromServer`;
  const syncFn = `sync${pascal}ToCloud`;

  const checklist = [
    `[ ] product-os/04-quality/farmer-artifact-sync-registry.md — add row (${audit})`,
    `[ ] features/sync/farmerArtifactRegistry.ts — audit + restore module (auto if --write)`,
    `[ ] features/sync/${syncFn}.ts — upload / audit enqueue`,
    `[ ] features/sync/${restoreFn}.ts — restore into SQLite${localTable ? ` (${localTable})` : ''}`,
    `[ ] features/sync/restoreFarmerCloudState.ts — call ${restoreFn} (auto TODO stub if --write)`,
    `[ ] features/sync/enqueueFarmerCloudSyncActions.ts — enqueue on local mutation`,
    `[ ] UI screen(s) — add to FARMER_ARTIFACT_UI_RELOAD_FILES if new surface`,
    `[ ] features/sync/${restoreFn}.test.ts — restore unit test`,
    `[ ] DEVICE_SMOKE_CHECKLIST.md §12 — cross-device step`,
    `[ ] npm run qa:structural`,
  ];

  console.log(`\nFarmer artifact scaffold: ${id}\n`);
  for (const line of checklist) console.log(line);

  const stubRestore = path.join(root, 'features/sync', `${restoreFn}.ts`);
  if (!fs.existsSync(stubRestore) && !noWrite) {
    const body = `/**
 * Restore ${id} from cloud for cross-device parity.
 * TODO: implement — see farmer-artifact-sync-registry.md
 */
export async function ${restoreFn}(params: {
  apiFarmerId: string;
  ownedFarmerIds: string[];
}): Promise<{ restored: number }> {
  void params;
  return { restored: 0 };
}
`;
    fs.writeFileSync(stubRestore, body);
    console.log(`\nWrote stub: features/sync/${restoreFn}.ts`);
  } else if (fs.existsSync(stubRestore)) {
    console.log(`\nStub exists: features/sync/${restoreFn}.ts (skipped)`);
  }

  if (!noWrite) {
    const registryChanged = wireRegistry(audit, restoreFn, noWrite);
    const orchestratorChanged = wireOrchestrator(restoreFn, id, noWrite);
    if (registryChanged) console.log('\nPatched: features/sync/farmerArtifactRegistry.ts');
    if (orchestratorChanged) {
      console.log('Patched: features/sync/restoreFarmerCloudState.ts (TODO call — review before merge)');
    }
  } else {
    console.log('\n--no-write: skipped registry/orchestrator patches');
  }

  console.log('\nRun: npm run qa:structural after wiring all checklist items.\n');
}

main();
