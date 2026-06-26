#!/usr/bin/env node
/**
 * Smoke GET /v1/cadastral/parcels/lookup with Honduras demo clave.
 *
 * Usage:
 *   TRACEBUD_API_BASE=https://api.tracebud.com/api \
 *   TRACEBUD_SMOKE_BEARER_TOKEN=<jwt> \
 *   node scripts/smoke-cadastral-parcel-lookup.mjs
 */

const HN_DEMO_CADASTRAL_KEY = '0123456789';

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
  const countryIso = 'HN';
  const cadastralKey = HN_DEMO_CADASTRAL_KEY;
  const url = `${base}/v1/cadastral/parcels/lookup?countryIso=${encodeURIComponent(countryIso)}&cadastralKey=${encodeURIComponent(cadastralKey)}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });
  const body = await readJson(res);
  if (!res.ok) {
    console.error('FAIL cadastral lookup', res.status, body);
    process.exit(1);
  }
  if (!body.cadastralKey && !body.cadastral_key) {
    console.error('FAIL cadastral lookup missing cadastral key in payload', body);
    process.exit(1);
  }
  console.log(`OK  cadastral/parcels/lookup → ${res.status}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
