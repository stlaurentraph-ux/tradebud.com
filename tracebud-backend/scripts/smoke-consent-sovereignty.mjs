#!/usr/bin/env node
/**
 * Smoke-check consent sovereignty endpoints on a deployed API.
 *
 * Usage:
 *   TRACEBUD_API_BASE=https://api.tracebud.com/api \
 *   TRACEBUD_COOP_TOKEN=<jwt> \
 *   TRACEBUD_FARMER_PROFILE_ID=<uuid> \
 *   node scripts/smoke-consent-sovereignty.mjs
 *
 * Optional:
 *   TRACEBUD_FARMER_EMAIL — used for GET /v1/farmers/resolve?email=
 */

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

function authHeaders(token) {
  return { Authorization: `Bearer ${token}`, Accept: 'application/json' };
}

async function readJson(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

async function assertOk(label, res) {
  const body = await readJson(res);
  if (!res.ok) {
    console.error(`FAIL ${label} → ${res.status}`);
    console.error(body);
    process.exit(1);
  }
  console.log(`OK  ${label} → ${res.status}`);
  return body;
}

async function main() {
  const base = required('TRACEBUD_API_BASE').replace(/\/+$/, '');
  const token = required('TRACEBUD_COOP_TOKEN');
  const farmerProfileId = required('TRACEBUD_FARMER_PROFILE_ID');
  const farmerEmail = process.env.TRACEBUD_FARMER_EMAIL?.trim();

  if (farmerEmail) {
    const resolveUrl = `${base}/v1/farmers/resolve?email=${encodeURIComponent(farmerEmail)}`;
    const resolved = await assertOk('farmers/resolve', await fetch(resolveUrl, { headers: authHeaders(token) }));
    if (resolved?.farmer_id && resolved.farmer_id !== farmerProfileId) {
      console.warn(
        `[warn] resolve returned ${resolved.farmer_id} but TRACEBUD_FARMER_PROFILE_ID is ${farmerProfileId}`,
      );
    }
  }

  const grantsUrl = `${base}/v1/farmers/${encodeURIComponent(farmerProfileId)}/consent-grants`;
  const grants = await assertOk('consent-grants list', await fetch(grantsUrl, { headers: authHeaders(token) }));
  const items = Array.isArray(grants) ? grants : grants?.items ?? grants?.grants ?? [];
  console.log(`     grants: ${items.length} record(s)`);

  const plotsUrl = `${base}/v1/plots?farmerId=${encodeURIComponent(farmerProfileId)}&scope=farmer`;
  const plotsRes = await fetch(plotsUrl, { headers: authHeaders(token) });
  const plotsBody = await readJson(plotsRes);
  if (plotsRes.status === 403) {
    console.log('OK  plots farmer scope → 403 CONSENT_REQUIRED (expected when grant revoked/denied)');
  } else if (plotsRes.ok) {
    const plotRows = Array.isArray(plotsBody) ? plotsBody : plotsBody?.plots ?? [];
    console.log(`OK  plots farmer scope → ${plotsRes.status} (${plotRows.length} plot(s))`);
  } else {
    console.error(`FAIL plots farmer scope → ${plotsRes.status}`);
    console.error(plotsBody);
    process.exit(1);
  }

  const vouchersUrl = `${base}/v1/harvest/vouchers?farmerId=${encodeURIComponent(farmerProfileId)}&scope=farmer`;
  const vouchersRes = await fetch(vouchersUrl, { headers: authHeaders(token) });
  const vouchersBody = await readJson(vouchersRes);
  if (vouchersRes.status === 403) {
    console.log('OK  harvest vouchers → 403 CONSENT_REQUIRED (expected when no sold lineage)');
  } else if (vouchersRes.ok) {
    const voucherRows = vouchersBody?.vouchers ?? [];
    console.log(`OK  harvest vouchers → ${vouchersRes.status} (${voucherRows.length} voucher(s))`);
  } else {
    console.error(`FAIL harvest vouchers → ${vouchersRes.status}`);
    console.error(vouchersBody);
    process.exit(1);
  }

  console.log('\nConsent sovereignty smoke passed.');
  console.log('Manual E2E: request access in dashboard → approve in field app → re-run → revoke → expect partial access.');
}

main().catch((error) => {
  console.error(`FAIL ${error.message ?? error}`);
  process.exit(1);
});
