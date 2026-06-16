#!/usr/bin/env node
/**
 * Smoke-test FDP coffee screening worker (Nigeria, Rwanda, Tanzania pilot polygons).
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

const workerUrl = (process.env.FDP_SCREENING_WORKER_URL ?? 'http://127.0.0.1:8095').replace(/\/+$/, '');

const PILOT_POLYGONS = [
  {
    countryCode: 'TZ',
    label: 'Tanzania (Kilimanjaro belt)',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [37.34, -3.35],
          [37.341, -3.35],
          [37.341, -3.349],
          [37.34, -3.349],
          [37.34, -3.35],
        ],
      ],
    },
  },
  {
    countryCode: 'RW',
    label: 'Rwanda (Lake Kivu belt)',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [29.87, -1.95],
          [29.871, -1.95],
          [29.871, -1.949],
          [29.87, -1.949],
          [29.87, -1.95],
        ],
      ],
    },
  },
  {
    countryCode: 'NG',
    label: 'Nigeria (Plateau State)',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [8.9, 9.9],
          [8.901, 9.9],
          [8.901, 9.901],
          [8.9, 9.901],
          [8.9, 9.9],
        ],
      ],
    },
  },
];

async function screenPolygon(entry) {
  const res = await fetch(`${workerUrl}/screen`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      geometry: entry.geometry,
      commodity: 'coffee',
      countryCode: entry.countryCode,
      years: [2019, 2020, 2021],
      modelVersion: '2025b',
    }),
  });

  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { ok: false, error: text.slice(0, 300) };
  }

  return { status: res.status, body };
}

async function main() {
  const healthRes = await fetch(`${workerUrl}/health`).catch(() => null);
  if (!healthRes?.ok) {
    console.error(`FAIL FDP worker not reachable at ${workerUrl}`);
    console.error('Start: cd scripts/fdp-screening-worker && uvicorn main:app --port 8095');
    process.exit(1);
  }

  let failures = 0;
  for (const entry of PILOT_POLYGONS) {
    const { status, body } = await screenPolygon(entry);
    const y2020 = body?.years?.['2020']?.mean;
    if (status !== 200 || body?.ok !== true) {
      failures += 1;
      console.error(`FAIL ${entry.label} HTTP ${status} ${body?.error ?? JSON.stringify(body).slice(0, 200)}`);
      continue;
    }
    console.log(
      `OK  ${entry.label} coffee@2020 mean=${y2020 ?? 'n/a'} competing=${body.competingCommodity ?? 'none'}@${body.competingProbMean ?? 'n/a'}`,
    );
  }

  if (failures > 0) {
    process.exit(1);
  }
  console.log('FDP coffee Africa pilot connectivity check passed.');
}

main().catch((error) => {
  console.error('FAIL', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
