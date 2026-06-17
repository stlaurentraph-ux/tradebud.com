#!/usr/bin/env node
/**
 * Blocks preview OTA unless DEVICE_SMOKE_SIGNOFF.json matches HEAD and is recent.
 *
 * Usage: npm run qa:device:assert
 * Env:   DEVICE_SMOKE_SIGNOFF_MAX_AGE_DAYS=14 (default)
 *        DEVICE_SMOKE_SIGNOFF_SKIP=1 (emergency hotfix only — logs warning)
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const signoffPath = path.join(root, 'DEVICE_SMOKE_SIGNOFF.json');
const maxAgeDays = Number(process.env.DEVICE_SMOKE_SIGNOFF_MAX_AGE_DAYS ?? '14');

function gitHead() {
  const r = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' });
  if (r.status !== 0) return null;
  return r.stdout.trim();
}

function daysBetween(a, b) {
  const ms = Math.abs(b.getTime() - a.getTime());
  return ms / (1000 * 60 * 60 * 24);
}

function main() {
  if (process.env.DEVICE_SMOKE_SIGNOFF_SKIP === '1') {
    console.warn('device-smoke-signoff-assert: SKIPPED (DEVICE_SMOKE_SIGNOFF_SKIP=1)');
    process.exit(0);
  }

  if (!fs.existsSync(signoffPath)) {
    console.error('device-smoke-signoff-assert: FAILED');
    console.error('  Missing DEVICE_SMOKE_SIGNOFF.json');
    console.error('  Complete DEVICE_SMOKE_CHECKLIST.md on a physical device, then:');
    console.error('    npm run qa:device:signoff -- --tester "You" --device "Phone" --os "iOS 18" --build preview');
    process.exit(1);
  }

  let payload;
  try {
    payload = JSON.parse(fs.readFileSync(signoffPath, 'utf8'));
  } catch {
    console.error('device-smoke-signoff-assert: FAILED — invalid JSON in DEVICE_SMOKE_SIGNOFF.json');
    process.exit(1);
  }

  const head = gitHead();
  const issues = [];

  if (payload.pass !== true) {
    issues.push('pass must be true');
  }
  if (!payload.tester || !payload.device || !payload.os) {
    issues.push('tester, device, and os are required');
  }
  if (!payload.commit || typeof payload.commit !== 'string') {
    issues.push('commit is required');
  } else if (head && payload.commit !== head) {
    issues.push(`commit mismatch: sign-off ${payload.commit.slice(0, 12)} vs HEAD ${head.slice(0, 12)}`);
  }
  if (!payload.signedAt) {
    issues.push('signedAt is required (YYYY-MM-DD)');
  } else {
    const signed = new Date(`${payload.signedAt}T12:00:00Z`);
    if (Number.isNaN(signed.getTime())) {
      issues.push('signedAt is not a valid date');
    } else if (daysBetween(signed, new Date()) > maxAgeDays) {
      issues.push(`sign-off older than ${maxAgeDays} days — re-run device smoke`);
    }
  }
  const sections = Array.isArray(payload.sectionsVerified) ? payload.sectionsVerified : [];
  for (const required of ['2', '7']) {
    if (!sections.map(String).includes(required)) {
      issues.push(`sectionsVerified must include §${required} (plot capture + documents)`);
    }
  }

  if (issues.length > 0) {
    console.error('device-smoke-signoff-assert: FAILED');
    for (const issue of issues) {
      console.error(`  - ${issue}`);
    }
    console.error('Re-run: npm run qa:device && npm run qa:device:signoff -- ...');
    process.exit(1);
  }

  console.log('device-smoke-signoff-assert: OK');
  console.log(`  ${payload.tester} · ${payload.device} · ${payload.signedAt} · §${sections.join(',§')}`);
}

main();
