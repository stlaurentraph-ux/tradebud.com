#!/usr/bin/env node
/**
 * Verify Expo push is configured for production geometry/consent alerts.
 *
 * Usage:
 *   node scripts/check-expo-push-readiness.mjs
 *   node scripts/check-expo-push-readiness.mjs https://api.tracebud.com
 *   node scripts/check-expo-push-readiness.mjs --smoke ExponentPushToken[xxxx]
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Client } from 'pg';

function loadEnvFile(path) {
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (value) out[key] = value;
  }
  return out;
}

const env = {
  ...loadEnvFile(resolve(process.cwd(), '.env')),
  ...loadEnvFile(resolve(process.cwd(), '.env.local')),
  ...process.env,
};

const apiBaseArg = process.argv.find((arg) => arg.startsWith('http'));
const smokeTokenArg = process.argv.find((arg) => arg.startsWith('ExponentPushToken['));
const apiBase = apiBaseArg?.replace(/\/+$/, '') ?? '';
const healthUrl = apiBase
  ? apiBase.endsWith('/api')
    ? `${apiBase}/health`
    : `${apiBase}/api/health`
  : '';

let failed = false;

function fail(message) {
  console.error(`FAIL ${message}`);
  failed = true;
}

function ok(message) {
  console.log(`OK ${message}`);
}

function warn(message) {
  console.warn(`WARN ${message}`);
}

async function verifyPushDevicesTable() {
  const databaseUrl = env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    warn('DATABASE_URL not set — skip farmer_push_devices table check');
    return;
  }
  const client = new Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    const res = await client.query(`
      SELECT COUNT(*)::int AS count
      FROM farmer_push_devices
    `);
    ok(`farmer_push_devices table reachable (${res.rows[0]?.count ?? 0} rows)`);
  } catch (error) {
    const code = error?.code;
    if (code === '42P01') {
      fail('farmer_push_devices table missing — run npm run db:apply:consent-sovereignty-v11');
      return;
    }
    fail(`farmer_push_devices check: ${error.message}`);
  } finally {
    await client.end().catch(() => undefined);
  }
}

async function verifyDeployedHealth() {
  if (!healthUrl) {
    warn('No API URL passed — skip remote /health pushReadiness check');
    return;
  }
  const res = await fetch(healthUrl);
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body?.status !== 'ok') {
    fail(`health check failed at ${healthUrl}`);
    return;
  }
  ok(`health ${healthUrl}`);
  const push = body.pushNotifications;
  if (!push) {
    warn(
      'Remote /health has no pushNotifications block — redeploy tracebud-backend (push readiness + geometry alerts)',
    );
    return;
  }
  if (!push.expoAccessTokenConfigured) {
    warn('Remote API reports EXPO_ACCESS_TOKEN is not configured (low Expo rate limits)');
  } else {
    ok('Remote API has EXPO_ACCESS_TOKEN configured');
  }
  if (!push.pushDevicesTableReady) {
    warn('Remote API reports farmer_push_devices may be missing');
  } else {
    ok('Remote API reports push device storage ready');
  }
}

async function smokeSend(token) {
  const accessToken = env.EXPO_ACCESS_TOKEN?.trim();
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  } else {
    warn('EXPO_ACCESS_TOKEN not set — sending without auth (strict rate limits)');
  }
  const message = {
    to: token,
    title: 'Tracebud push test',
    body: 'If you see this, Expo push delivery is working.',
    data: { screen: 'plots' },
    sound: 'default',
  };
  const res = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers,
    body: JSON.stringify(message),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    fail(`Expo push send HTTP ${res.status}: ${JSON.stringify(body)}`);
    return;
  }
  ok(`Expo push accepted: ${JSON.stringify(body)}`);
}

async function main() {
  if (env.EXPO_ACCESS_TOKEN?.trim()) {
    ok('EXPO_ACCESS_TOKEN is set locally');
  } else {
    warn('EXPO_ACCESS_TOKEN is not set locally — add to Railway for production push rate limits');
  }

  await verifyPushDevicesTable();
  await verifyDeployedHealth();

  if (smokeTokenArg) {
    await smokeSend(smokeTokenArg);
  }

  if (failed) {
    process.exit(1);
  }
}

main().catch((error) => {
  fail(error.message);
  process.exit(1);
});
