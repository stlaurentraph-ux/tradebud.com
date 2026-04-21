#!/usr/bin/env node

/**
 * Yearly FAOSTAT benchmark sync runner.
 *
 * Execution flow:
 * 1) Dry-run import for configured geographies.
 * 2) Human review of report output.
 * 3) Dual-control activation using the benchmark admin API.
 *
 * Required env vars:
 * - TRACEBUD_API_BASE_URL (default: http://localhost:4000/api)
 * - TRACEBUD_BENCHMARK_ADMIN_JWT
 *
 * Optional env vars:
 * - TRACEBUD_FAOSTAT_SYNC_YEAR (default: previous UTC year)
 * - TRACEBUD_FAOSTAT_SYNC_DRY_RUN (default: true)
 */

const baseUrl = (process.env.TRACEBUD_API_BASE_URL ?? 'http://localhost:4000/api').replace(/\/+$/, '');
const jwt = (process.env.TRACEBUD_BENCHMARK_ADMIN_JWT ?? '').trim();
const year =
  (process.env.TRACEBUD_FAOSTAT_SYNC_YEAR ?? '').trim() || String(new Date().getUTCFullYear() - 1);
const dryRun = (process.env.TRACEBUD_FAOSTAT_SYNC_DRY_RUN ?? 'true').trim().toLowerCase() !== 'false';

// Canonical non-re-export exporter coverage maintained in FEAT-005.
const geographies = ['BR', 'VN', 'CO', 'UG', 'ID', 'HN', 'ET', 'IN', 'PE', 'GT', 'MX', 'TZ', 'CR', 'CI', 'PG', 'KE'];

if (!jwt) {
  console.error('Missing TRACEBUD_BENCHMARK_ADMIN_JWT');
  process.exit(1);
}

async function syncOne(geography) {
  const response = await fetch(`${baseUrl}/v1/yield-benchmarks/import/sync-source`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${jwt}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sourceType: 'FAOSTAT',
      commodity: 'coffee',
      geography,
      year,
      dryRun,
    }),
  });
  const payload = await response.json().catch(() => ({}));
  return {
    geography,
    status: response.status,
    ok: response.ok,
    payload,
  };
}

async function main() {
  const startedAt = new Date().toISOString();
  const results = [];
  for (const geography of geographies) {
    // Sequential execution keeps run logs deterministic for yearly audit packets.
    // eslint-disable-next-line no-await-in-loop
    results.push(await syncOne(geography));
  }

  const summary = {
    startedAt,
    finishedAt: new Date().toISOString(),
    dryRun,
    year,
    total: results.length,
    succeeded: results.filter((item) => item.ok).length,
    failed: results.filter((item) => !item.ok).length,
  };

  console.log(JSON.stringify({ summary, results }, null, 2));

  if (summary.failed > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
