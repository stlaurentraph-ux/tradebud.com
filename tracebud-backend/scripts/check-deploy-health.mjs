#!/usr/bin/env node
/**
 * Smoke-check a deployed Tracebud API base URL.
 * Usage: node scripts/check-deploy-health.mjs https://api.tracebud.com
 */

const baseArg = process.argv[2];
if (!baseArg) {
  console.error('Usage: node scripts/check-deploy-health.mjs <base-url>');
  console.error('Example: node scripts/check-deploy-health.mjs https://api.tracebud.com');
  process.exit(1);
}

const base = baseArg.replace(/\/+$/, '');
const healthUrl = base.endsWith('/api') ? `${base}/health` : `${base}/api/health`;

async function main() {
  const res = await fetch(healthUrl, { method: 'GET' });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }

  if (!res.ok) {
    console.error(`FAIL ${res.status} ${healthUrl}`);
    console.error(body);
    process.exit(1);
  }

  if (body?.status !== 'ok') {
    console.error(`FAIL unexpected payload at ${healthUrl}`);
    console.error(body);
    process.exit(1);
  }

  console.log(`OK ${healthUrl}`);
  if (Array.isArray(body.warnings) && body.warnings.length > 0) {
    for (const warning of body.warnings) {
      console.warn(`[warn] ${warning}`);
    }
  }
}

main().catch((err) => {
  console.error(`FAIL ${healthUrl}: ${err.message}`);
  process.exit(1);
});
