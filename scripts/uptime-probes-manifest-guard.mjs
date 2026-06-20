#!/usr/bin/env node
/**
 * Guardrail 2.8 — validate synthetic uptime probe manifest shape.
 *
 * Run: npm run uptime:probes:manifest:assert
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = path.join(repoRoot, 'scripts', 'uptime-probes-manifest.json');

const ALLOWED_PLATFORMS = new Set(['marketing', 'dashboard', 'backend']);
const ALLOWED_METHODS = new Set(['GET']);
const REQUIRED_PROBE_KEYS = [
  'id',
  'platform',
  'envBaseUrl',
  'fallbackBaseUrl',
  'path',
  'method',
  'expectStatus',
  'maxLatencyMs',
];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function loadManifest() {
  assert(fs.existsSync(manifestPath), `Missing manifest: ${manifestPath}`);
  const raw = fs.readFileSync(manifestPath, 'utf8');
  let manifest;
  try {
    manifest = JSON.parse(raw);
  } catch (error) {
    throw new Error(`Invalid JSON in ${manifestPath}: ${error.message}`);
  }
  return manifest;
}

function validateManifest(manifest) {
  assert(manifest.version === 1, 'manifest.version must be 1');
  assert(Array.isArray(manifest.probes), 'manifest.probes must be an array');
  assert(manifest.probes.length >= 3, 'manifest.probes must include marketing, dashboard, and backend probes');

  const ids = new Set();
  const platforms = new Set();

  for (const probe of manifest.probes) {
    for (const key of REQUIRED_PROBE_KEYS) {
      assert(Object.hasOwn(probe, key), `probe "${probe.id ?? '(missing id)'}" missing ${key}`);
    }

    assert(typeof probe.id === 'string' && probe.id.length > 0, 'probe id must be a non-empty string');
    assert(!ids.has(probe.id), `duplicate probe id: ${probe.id}`);
    ids.add(probe.id);

    assert(ALLOWED_PLATFORMS.has(probe.platform), `probe ${probe.id}: invalid platform "${probe.platform}"`);
    platforms.add(probe.platform);

    assert(typeof probe.envBaseUrl === 'string' && probe.envBaseUrl.length > 0, `probe ${probe.id}: envBaseUrl required`);
    assert(
      typeof probe.fallbackBaseUrl === 'string' && probe.fallbackBaseUrl.startsWith('https://'),
      `probe ${probe.id}: fallbackBaseUrl must be https URL`,
    );
    assert(probe.path.startsWith('/'), `probe ${probe.id}: path must start with /`);
    assert(ALLOWED_METHODS.has(probe.method), `probe ${probe.id}: unsupported method "${probe.method}"`);

    assert(Array.isArray(probe.expectStatus) && probe.expectStatus.length > 0, `probe ${probe.id}: expectStatus required`);
    for (const status of probe.expectStatus) {
      assert(Number.isInteger(status) && status >= 100 && status <= 599, `probe ${probe.id}: invalid status ${status}`);
    }

    assert(
      Number.isInteger(probe.maxLatencyMs) && probe.maxLatencyMs > 0,
      `probe ${probe.id}: maxLatencyMs must be a positive integer`,
    );

    if (probe.expectJson != null) {
      assert(typeof probe.expectJson === 'object' && !Array.isArray(probe.expectJson), `probe ${probe.id}: expectJson must be an object`);
    }
  }

  for (const platform of ALLOWED_PLATFORMS) {
    assert(platforms.has(platform), `manifest must include at least one ${platform} probe`);
  }
}

function main() {
  const manifest = loadManifest();
  validateManifest(manifest);
  console.log(`Uptime probe manifest guard passed (${manifest.probes.length} probes).`);
}

main();
