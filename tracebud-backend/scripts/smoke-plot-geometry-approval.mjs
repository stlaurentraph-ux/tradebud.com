#!/usr/bin/env node
/**
 * Post-deploy smoke for POST /v1/plots/:id/approve-geometry
 *
 * Usage:
 *   TRACEBUD_API_BASE=https://api.tracebud.com/api \
 *   TRACEBUD_SMOKE_BEARER_TOKEN=<jwt> \
 *   TRACEBUD_SMOKE_PLOT_ID=<uuid> \
 *   node scripts/smoke-plot-geometry-approval.mjs
 */

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required env: ${name}`);
  return value;
}

async function readJson(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

async function main() {
  const base = required('TRACEBUD_API_BASE').replace(/\/+$/, '');
  const token = required('TRACEBUD_SMOKE_BEARER_TOKEN');
  const plotId = required('TRACEBUD_SMOKE_PLOT_ID');
  const url = `${base}/v1/plots/${encodeURIComponent(plotId)}/approve-geometry`;

  const previewRes = await fetch(`${base}/v1/plots/${encodeURIComponent(plotId)}/map-preview`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });
  const preview = await readJson(previewRes);
  if (!previewRes.ok) {
    console.error('FAIL map-preview', previewRes.status, preview);
    process.exit(1);
  }
  console.log(`OK  map-preview → ${previewRes.status}`);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });
  const body = await readJson(res);
  if (!res.ok) {
    console.error('FAIL approve-geometry', res.status, body);
    process.exit(1);
  }
  if (!body.geometry_approved_at && !body.geometryApprovedAt) {
    console.error('FAIL approve-geometry missing geometry_approved_at in response', body);
    process.exit(1);
  }
  console.log(`OK  approve-geometry → ${res.status}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
