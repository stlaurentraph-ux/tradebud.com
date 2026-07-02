#!/usr/bin/env node
/**
 * Gate local native installs and EAS builds: fixes must be committed and pushed on main.
 * Run: npm run native:preflight:main
 */
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

function git(args) {
  return execSync(`git ${args}`, { encoding: 'utf8', cwd: repoRoot }).trim();
}

function isCi() {
  return process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
}

function branchLabel() {
  if (isCi()) return 'ci';
  if (process.env.NATIVE_BUILD_GATE_SKIP === '1') return 'skip';
  return 'unknown';
}

/** @param {{ skipFetch?: boolean }} [options] */
export function assertMainBeforeNativeBuild(options = {}) {
  if (isCi() || process.env.NATIVE_BUILD_GATE_SKIP === '1') {
    return { branch: branchLabel(), clean: true, synced: true };
  }

  const branch = git('branch --show-current');
  if (branch !== 'main') {
    throw new Error(
      `Native build gate: checkout main first (current: ${branch}). Merge or cherry-pick fixes onto main.`,
    );
  }

  const dirty = git('status --porcelain');
  if (dirty) {
    throw new Error(
      'Native build gate: uncommitted changes — commit or stash before prebuild / EAS / device install.',
    );
  }

  if (!options.skipFetch) {
    try {
      git('fetch origin main --quiet');
    } catch {
      throw new Error(
        'Native build gate: could not fetch origin/main — check network, then retry.',
      );
    }
  }

  const behind = Number(git('rev-list HEAD..origin/main --count'));
  const ahead = Number(git('rev-list origin/main..HEAD --count'));

  if (behind > 0) {
    throw new Error(
      `Native build gate: local main is ${behind} commit(s) behind origin/main — pull before building.`,
    );
  }

  if (ahead > 0) {
    throw new Error(
      `Native build gate: local main is ${ahead} commit(s) ahead of origin/main — push before building.`,
    );
  }

  return { branch, clean: true, synced: true };
}

function main() {
  try {
    assertMainBeforeNativeBuild();
    console.log('native-build-gate: OK — main is clean and matches origin/main');
    process.exit(0);
  } catch (error) {
    console.error(`native-build-gate: FAIL — ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }
}

if (import.meta.url.startsWith('file:') && process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
