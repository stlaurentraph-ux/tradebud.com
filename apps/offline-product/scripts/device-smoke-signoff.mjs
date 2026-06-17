#!/usr/bin/env node
/**
 * Record device smoke sign-off after completing DEVICE_SMOKE_CHECKLIST.md on a real device.
 *
 * Usage:
 *   npm run qa:device:signoff -- --tester "Name" --device "iPhone 15" --os "iOS 18.2" --build preview
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outPath = path.join(root, 'DEVICE_SMOKE_SIGNOFF.json');

function parseArgs(argv) {
  const get = (flag) => {
    const eq = argv.find((a) => a.startsWith(`${flag}=`));
    if (eq) return eq.slice(flag.length + 1).trim();
    const idx = argv.indexOf(flag);
    if (idx >= 0 && argv[idx + 1] && !argv[idx + 1].startsWith('--')) {
      return argv[idx + 1].trim();
    }
    return null;
  };
  return {
    tester: get('--tester'),
    device: get('--device'),
    os: get('--os'),
    build: get('--build') ?? 'preview',
    sections: get('--sections') ?? '2,7',
  };
}

function gitHead() {
  const r = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' });
  if (r.status !== 0) return null;
  return r.stdout.trim();
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const missing = ['tester', 'device', 'os'].filter((k) => !args[k]);
  if (missing.length > 0) {
    console.error(`Missing required flags: ${missing.map((m) => `--${m}`).join(', ')}`);
    console.error('Example: npm run qa:device:signoff -- --tester "Ada" --device "Pixel 8" --os "Android 14" --build preview');
    process.exit(1);
  }

  const commit = gitHead();
  if (!commit) {
    console.error('Could not resolve git HEAD — run from a git checkout.');
    process.exit(1);
  }

  const payload = {
    schemaVersion: 1,
    commit,
    signedAt: new Date().toISOString().slice(0, 10),
    tester: args.tester,
    device: args.device,
    os: args.os,
    build: args.build,
    pass: true,
    sectionsVerified: args.sections.split(',').map((s) => s.trim()).filter(Boolean),
    checklist: 'DEVICE_SMOKE_CHECKLIST.md',
  };

  fs.writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${path.relative(process.cwd(), outPath)}`);
  console.log(`  commit: ${commit.slice(0, 12)}`);
  console.log(`  sections: ${payload.sectionsVerified.join(', ')}`);
  console.log('Next: npm run update:preview:safe');
}

main();
