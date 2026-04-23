#!/usr/bin/env node

/**
 * Staging smoke for dashboard onboarding proxy contracts.
 *
 * Required env:
 * - DASHBOARD_BASE_URL (e.g. https://dashboard-staging.tracebud.com)
 * - TRACEBUD_SMOKE_BEARER_TOKEN
 *
 * Optional env:
 * - TRACEBUD_SMOKE_ROLE (default: compliance_manager)
 * - TRACEBUD_SMOKE_STEP_KEY (default: create_first_campaign)
 */

const baseUrl = process.env.DASHBOARD_BASE_URL;
const bearerToken = process.env.TRACEBUD_SMOKE_BEARER_TOKEN;
const role = process.env.TRACEBUD_SMOKE_ROLE ?? 'compliance_manager';
const stepKey = process.env.TRACEBUD_SMOKE_STEP_KEY ?? 'create_first_campaign';

if (!baseUrl) {
  console.error('Missing DASHBOARD_BASE_URL');
  process.exit(1);
}
if (!bearerToken) {
  console.error('Missing TRACEBUD_SMOKE_BEARER_TOKEN');
  process.exit(1);
}

const normalizedBase = baseUrl.replace(/\/$/, '');
const headers = {
  Authorization: `Bearer ${bearerToken}`,
  'Content-Type': 'application/json',
};

async function callJson(url, init) {
  const response = await fetch(url, init);
  const payload = await response.json().catch(() => ({}));
  return {
    ok: response.ok,
    status: response.status,
    payload,
  };
}

function printEvidence(label, result) {
  console.log(`\n[${label}]`);
  console.log(`status=${result.status}`);
  console.log(`ok=${result.ok}`);
  console.log(`payload=${JSON.stringify(result.payload)}`);
}

const getUrl = `${normalizedBase}/api/launch/onboarding?role=${encodeURIComponent(role)}`;
const postUrl = `${normalizedBase}/api/launch/onboarding`;

const startedAt = new Date().toISOString();
console.log(`launch-onboarding-proxy-smoke started_at=${startedAt}`);
console.log(`base_url=${normalizedBase}`);
console.log(`role=${role}`);
console.log(`step_key=${stepKey}`);

const getResult = await callJson(getUrl, {
  method: 'GET',
  headers: {
    Authorization: headers.Authorization,
  },
});
printEvidence('GET /api/launch/onboarding', getResult);

const postResult = await callJson(postUrl, {
  method: 'POST',
  headers,
  body: JSON.stringify({ role, stepKey }),
});
printEvidence('POST /api/launch/onboarding', postResult);

if (!getResult.ok || !postResult.ok) {
  console.error('\nSmoke failed: at least one proxy call returned non-2xx.');
  process.exit(1);
}

console.log('\nSmoke passed: onboarding proxy read/write calls returned 2xx.');
