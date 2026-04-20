#!/usr/bin/env node

const raw = (process.env.BENCHMARK_ADMIN_ROLE_CLAIMS ?? '').trim();
const requiredClaims = ['ADMIN', 'COMPLIANCE_MANAGER'];

if (!raw) {
  console.error(
    'BENCHMARK_ADMIN_ROLE_CLAIMS is required and must contain canonical benchmark-admin claims.',
  );
  process.exit(1);
}

const parsedClaims = raw
  .split(',')
  .map((value) => value.trim().toUpperCase())
  .filter((value) => value.length > 0);

if (parsedClaims.length === 0) {
  console.error(
    'BENCHMARK_ADMIN_ROLE_CLAIMS resolved to an empty claim list; benchmark-admin routes would be inaccessible.',
  );
  process.exit(1);
}

const missing = requiredClaims.filter((claim) => !parsedClaims.includes(claim));
if (missing.length > 0) {
  console.error(
    `BENCHMARK_ADMIN_ROLE_CLAIMS is missing required claim(s): ${missing.join(', ')}.`,
  );
  process.exit(1);
}

console.log(
  `Benchmark-admin claim preflight passed. Required claims present: ${requiredClaims.join(', ')}.`,
);
