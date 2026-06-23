#!/usr/bin/env node
/**
 * Scaffold checklist for a new farmer-owned cross-device artifact.
 *
 * Usage:
 *   node scripts/scaffold-farmer-artifact.mjs --id land_survey --audit land_survey_synced
 *   node scripts/scaffold-farmer-artifact.mjs --id land_survey --audit land_survey_synced --local-table plot_evidence
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function parseArgs(argv) {
  const out = { id: null, audit: null, localTable: null };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--id') out.id = argv[++i];
    else if (arg === '--audit') out.audit = argv[++i];
    else if (arg === '--local-table') out.localTable = argv[++i];
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

function main() {
  const { id, audit, localTable } = parseArgs(process.argv.slice(2));
  if (!id || !audit) {
    console.error('Usage: node scripts/scaffold-farmer-artifact.mjs --id <slug> --audit <audit_event>');
    process.exit(1);
  }

  const pascal = toPascalCase(id);
  const restoreFn = `restoreLocal${pascal}FromServer`;
  const syncFn = `sync${pascal}ToCloud`;
  const queueFn = `queue${pascal}Sync`;

  const checklist = [
    `[ ] product-os/04-quality/farmer-artifact-sync-registry.md — add row (${audit})`,
    `[ ] features/sync/farmerArtifactRegistry.ts — audit + restore module + upload action if queued`,
    `[ ] features/sync/${syncFn}.ts — upload / audit enqueue`,
    `[ ] features/sync/${restoreFn}.ts — restore into SQLite${localTable ? ` (${localTable})` : ''}`,
    `[ ] features/sync/restoreFarmerCloudState.ts — call ${restoreFn}`,
    `[ ] features/sync/enqueueFarmerCloudSyncActions.ts — enqueue on local mutation`,
    `[ ] features/sync/processPendingSyncQueue.ts — handler if new pending_sync actionType`,
    `[ ] features/state/persistence.native.ts — actionType union if new queue kind`,
    `[ ] UI screen(s) — subscribeServerPlotSyncChanged + focus restore`,
    `[ ] features/sync/${restoreFn}.test.ts — restore unit test`,
    `[ ] DEVICE_SMOKE_CHECKLIST.md — cross-device step`,
    `[ ] npm run qa:structural`,
  ];

  console.log(`\nFarmer artifact scaffold: ${id}\n`);
  for (const line of checklist) console.log(line);

  const stubRestore = path.join(root, 'features/sync', `${restoreFn}.ts`);
  if (!fs.existsSync(stubRestore)) {
    const body = `/**
 * Restore ${id} from cloud for cross-device parity.
 * TODO: implement — see farmer-artifact-sync-registry.md
 */
export async function ${restoreFn}(_params: {
  profileFarmerId: string;
}): Promise<{ restored: number }> {
  return { restored: 0 };
}
`;
    fs.writeFileSync(stubRestore, body);
    console.log(`\nWrote stub: features/sync/${restoreFn}.ts`);
  } else {
    console.log(`\nStub exists: features/sync/${restoreFn}.ts (skipped)`);
  }

  console.log('\nRun: npm run qa:structural after wiring all checklist items.\n');
}

main();
