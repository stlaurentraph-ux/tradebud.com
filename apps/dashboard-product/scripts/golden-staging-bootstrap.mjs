#!/usr/bin/env node

/**
 * Bootstrap golden staging inbox state via dashboard proxy.
 *
 * Required env:
 * - DASHBOARD_BASE_URL (e.g. https://dashboard-staging.tracebud.com)
 * - TRACEBUD_SMOKE_BEARER_TOKEN (exporter/admin JWT for tenant_rwanda_001)
 *
 * See product-os/04-quality/golden-staging-tenant.md
 */

const baseUrl = process.env.DASHBOARD_BASE_URL;
const bearerToken = process.env.TRACEBUD_SMOKE_BEARER_TOKEN;
const bootstrapAction = 'seed_golden_path';

if (!baseUrl) {
  console.error('Missing DASHBOARD_BASE_URL');
  process.exit(1);
}
if (!bearerToken) {
  console.error('Missing TRACEBUD_SMOKE_BEARER_TOKEN');
  process.exit(1);
}

const normalizedBase = baseUrl.replace(/\/$/, '');
const url = `${normalizedBase}/api/inbox-requests/bootstrap`;

console.log(`golden-staging-bootstrap started_at=${new Date().toISOString()}`);
console.log(`base_url=${normalizedBase}`);
console.log(`action=${bootstrapAction}`);

const response = await fetch(url, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${bearerToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ action: bootstrapAction }),
});

const payload = await response.json().catch(() => ({}));
console.log(`status=${response.status}`);
console.log(`payload=${JSON.stringify(payload)}`);

if (!response.ok) {
  console.error('Bootstrap failed: non-2xx response.');
  process.exit(1);
}

console.log('Bootstrap passed: golden inbox state seeded.');
