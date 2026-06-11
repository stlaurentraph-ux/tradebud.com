#!/usr/bin/env node
/**
 * Smoke-test Global Forest Watch API credentials from local/Railway env.
 * Does not print secret values.
 */
import fs from 'node:fs';
import path from 'node:path';

const backendRoot = path.resolve(import.meta.dirname, '..');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx <= 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(path.join(backendRoot, '.env'));
loadEnvFile(path.join(backendRoot, '.env.local'));

const apiKey = process.env.GFW_API_KEY?.trim();
const baseUrl = (process.env.GFW_BASE_URL ?? 'https://data-api.globalforestwatch.org').replace(/\/+$/, '');
const dataset = process.env.GFW_DATASET ?? 'gfw_integrated_alerts';
const version = process.env.GFW_VERSION ?? 'latest';
const cutoffDate = process.env.EUDR_DEFORESTATION_CUTOFF ?? '2020-12-31';
const sqlTemplate =
  process.env.GFW_DEFORESTATION_SQL_TEMPLATE ??
  "SELECT COUNT(*) AS count, SUM(area__ha) AS area_ha FROM data WHERE gfw_integrated_alerts__date > '{{cutoffDate}}'";
const sql = sqlTemplate.split('{{cutoffDate}}').join(cutoffDate);

if (!apiKey) {
  console.error('FAIL GFW_API_KEY is not set.');
  console.error('Add it to tracebud-backend/.env or Railway → Variables.');
  process.exit(1);
}

// Small polygon in Honduras (coffee belt) — minimal query footprint.
const geometry = {
  type: 'Polygon',
  coordinates: [
    [
      [-88.12, 14.08],
      [-88.119, 14.08],
      [-88.119, 14.081],
      [-88.12, 14.081],
      [-88.12, 14.08],
    ],
  ],
};

const url = `${baseUrl}/dataset/${encodeURIComponent(dataset)}/${encodeURIComponent(version)}/query/json`;

async function main() {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({ geometry, sql }),
  });

  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }

  if (!res.ok) {
    console.error(`FAIL GFW query HTTP ${res.status}`);
    console.error(typeof body === 'string' ? body.slice(0, 500) : JSON.stringify(body).slice(0, 500));
    process.exit(1);
  }

  const row = Array.isArray(body?.data) ? body.data[0] : Array.isArray(body) ? body[0] : body;
  const count = row?.count ?? row?.COUNT ?? null;
  console.log('OK GFW connectivity');
  console.log(`    dataset: ${dataset}/${version}`);
  console.log(`    cutoff:  after ${cutoffDate}`);
  console.log(`    sample:  alert count = ${count ?? 'n/a'}`);

  if ((process.env.GFW_CONTEXT_ENABLED ?? 'true').toLowerCase() !== 'false') {
    const cutoffYear = String(new Date(`${cutoffDate}T00:00:00.000Z`).getUTCFullYear());
    const contextChecks = [
      {
        label: 'tropical tree cover',
        dataset: process.env.GFW_CONTEXT_TROPICAL_TREE_COVER_DATASET ?? 'wri_tropical_tree_cover',
        sql:
          process.env.GFW_CONTEXT_TROPICAL_TREE_COVER_SQL ??
          'SELECT AVG(wri_tropical_tree_cover__percent) AS avg_pct FROM data',
      },
      {
        label: 'tree cover loss',
        dataset: process.env.GFW_CONTEXT_TREE_COVER_LOSS_DATASET ?? 'umd_tree_cover_loss',
        sql: (
          process.env.GFW_CONTEXT_TREE_COVER_LOSS_SQL_TEMPLATE ??
          'SELECT SUM(area__ha) AS loss_ha FROM data WHERE umd_tree_cover_loss__year > {{cutoffYear}}'
        ).split('{{cutoffYear}}').join(cutoffYear),
      },
    ];

    for (const check of contextChecks) {
      const contextUrl = `${baseUrl}/dataset/${encodeURIComponent(check.dataset)}/latest/query/json`;
      const contextRes = await fetch(contextUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({ geometry, sql: check.sql }),
      });
      const contextText = await contextRes.text();
      let contextBody;
      try {
        contextBody = JSON.parse(contextText);
      } catch {
        contextBody = contextText;
      }
      if (!contextRes.ok) {
        console.error(`FAIL GFW context (${check.label}) HTTP ${contextRes.status}`);
        console.error(
          typeof contextBody === 'string'
            ? contextBody.slice(0, 500)
            : JSON.stringify(contextBody).slice(0, 500),
        );
        process.exit(1);
      }
      const contextRow = Array.isArray(contextBody?.data) ? contextBody.data[0] : null;
      console.log(`OK GFW context ${check.label}: ${JSON.stringify(contextRow ?? contextBody).slice(0, 120)}`);
    }
  }
}

main().catch((err) => {
  console.error(`FAIL GFW connectivity: ${err.message}`);
  process.exit(1);
});
