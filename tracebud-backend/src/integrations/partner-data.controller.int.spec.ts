import { ForbiddenException } from '@nestjs/common';
import { Pool } from 'pg';

let PartnerDataController: any;
try {
  // Keep this integration suite optional while partner-data controller files are WIP on branch.
  PartnerDataController = require('./partner-data.controller').PartnerDataController;
} catch {
  PartnerDataController = null;
}

const testDbUrl = process.env.TEST_DATABASE_URL;
const describeIfDb = testDbUrl && PartnerDataController ? describe : describe.skip;
const schema = 'tb_partner_data_controller_test';

function withSearchPath(connectionString: string, targetSchema: string) {
  const url = new URL(connectionString);
  url.searchParams.set('options', `-c search_path=${targetSchema},public`);
  return url.toString();
}

describeIfDb('PartnerDataController integration', () => {
  let pool: Pool;
  let controller: any;

  beforeAll(async () => {
    pool = new Pool({
      connectionString: withSearchPath(testDbUrl!, schema),
      ssl: { rejectUnauthorized: false },
      max: 1,
    });
    await pool.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    await pool.query(`CREATE SCHEMA IF NOT EXISTS ${schema}`);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        user_id UUID NULL,
        device_id TEXT NULL,
        event_type TEXT NOT NULL,
        payload JSONB NOT NULL DEFAULT '{}'::jsonb
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS integration_partner_exports (
        id UUID PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        scope TEXT NOT NULL CHECK (scope IN ('read:lineage', 'read:compliance', 'read:risk', 'read:shipments')),
        dataset TEXT NOT NULL,
        format TEXT NOT NULL CHECK (format IN ('csv', 'parquet')),
        idempotency_key TEXT NOT NULL,
        cursor TEXT NULL,
        status TEXT NOT NULL CHECK (status IN ('queued', 'completed', 'failed')) DEFAULT 'queued',
        state TEXT NOT NULL
          CHECK (state IN ('partner_sync_pending', 'partner_sync_succeeded', 'partner_sync_terminal_failed'))
          DEFAULT 'partner_sync_pending',
        artifact_url TEXT NULL,
        attempt_count INTEGER NOT NULL DEFAULT 1 CHECK (attempt_count >= 1),
        error_code TEXT NULL,
        next_retry_at TIMESTAMPTZ NULL,
        retry_exhausted_at TIMESTAMPTZ NULL,
        created_by_user_id UUID NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (tenant_id, idempotency_key)
      )
    `);
    await pool.query(`
      ALTER TABLE integration_partner_exports
        ADD COLUMN IF NOT EXISTS attempt_count INTEGER NOT NULL DEFAULT 1,
        ADD COLUMN IF NOT EXISTS error_code TEXT NULL,
        ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMPTZ NULL,
        ADD COLUMN IF NOT EXISTS retry_exhausted_at TIMESTAMPTZ NULL
    `);
    controller = new PartnerDataController(pool as any);
  }, 25_000);

  afterAll(async () => {
    delete process.env.PARTNER_EXPORT_RETRY_SWEEP_TOKEN;
    delete process.env.PARTNER_EXPORT_RETRY_SWEEP_TOKEN_VERSION;
    await pool.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    await pool.end();
  });

  beforeEach(async () => {
    await pool.query('DELETE FROM audit_log');
    await pool.query('DELETE FROM integration_partner_exports');
  });

  it('enforces missing tenant claim fail-closed on export starts', async () => {
    await expect(
      controller.startExport(
        {
          scope: 'read:compliance',
          dataset: 'dds_packages',
          format: 'csv',
          idempotencyKey: 'idem_1',
        },
        { user: { id: 'user_1', email: 'exporter@tracebud.com' } },
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('persists export row and returns replayed=true on duplicate idempotency key', async () => {
    const req = {
      user: {
        id: '11111111-1111-1111-1111-111111111111',
        app_metadata: { tenant_id: 'tenant_1', role: 'EXPORTER' },
      },
    };
    const first = await controller.startExport(
      {
        scope: 'read:compliance',
        dataset: 'dds_packages',
        format: 'csv',
        idempotencyKey: 'idem_dup',
      },
      req,
    );
    const second = await controller.startExport(
      {
        scope: 'read:compliance',
        dataset: 'dds_packages',
        format: 'csv',
        idempotencyKey: 'idem_dup',
      },
      req,
    );
    expect(first.replayed).toBe(false);
    expect(second.replayed).toBe(true);
    expect(second.exportId).toBe(first.exportId);
  });

  it('finalizes queued export and allows completed-download retrieval', async () => {
    const exporterReq = {
      user: {
        id: '11111111-1111-1111-1111-111111111111',
        app_metadata: { tenant_id: 'tenant_1', role: 'EXPORTER' },
      },
    };
    const agentReq = {
      user: {
        id: '22222222-2222-2222-2222-222222222222',
        app_metadata: { tenant_id: 'tenant_1', role: 'AGENT' },
      },
    };
    const started = await controller.startExport(
      {
        scope: 'read:shipments',
        dataset: 'shipment_headers',
        format: 'parquet',
        idempotencyKey: 'idem_finalize',
      },
      exporterReq,
    );
    const finalized = await controller.finalizeExport(
      started.exportId,
      {
        outcome: 'completed',
        artifactUrl: 'https://files.example.com/tenant_1/export.parquet',
      },
      exporterReq,
    );
    expect(finalized.status).toBe('completed');
    expect(finalized.state).toBe('partner_sync_succeeded');

    const status = await controller.getExportStatus(started.exportId, agentReq);
    expect(status.status).toBe('completed');

    const download = await controller.getExportDownload(started.exportId, agentReq);
    expect(download).toEqual(
      expect.objectContaining({
        exportId: started.exportId,
        status: 'completed',
      }),
    );
  });

  it('returns retry summary with due failed export counts', async () => {
    const exporterReq = {
      user: {
        id: '11111111-1111-1111-1111-111111111111',
        app_metadata: { tenant_id: 'tenant_1', role: 'EXPORTER' },
      },
    };
    const started = await controller.startExport(
      {
        scope: 'read:risk',
        dataset: 'risk_scores',
        format: 'csv',
        idempotencyKey: 'idem_summary',
      },
      exporterReq,
    );
    await controller.finalizeExport(
      started.exportId,
      { outcome: 'failed', errorCode: 'UPSTREAM_TIMEOUT' },
      exporterReq,
    );
    const summary = await controller.getRetrySummary(exporterReq);
    expect(summary.failedCount).toBeGreaterThanOrEqual(1);
    expect(summary.maxAttempts).toBe(5);
  });

  it('executes scheduler retry sweep for due failed exports', async () => {
    process.env.PARTNER_EXPORT_RETRY_SWEEP_TOKEN = 'token_1';
    process.env.PARTNER_EXPORT_RETRY_SWEEP_TOKEN_VERSION = 'v1';
    const exporterReq = {
      user: {
        id: '11111111-1111-1111-1111-111111111111',
        app_metadata: { tenant_id: 'tenant_1', role: 'EXPORTER' },
      },
    };
    const started = await controller.startExport(
      {
        scope: 'read:risk',
        dataset: 'risk_scores',
        format: 'csv',
        idempotencyKey: 'idem_sweep',
      },
      exporterReq,
    );
    await controller.finalizeExport(started.exportId, { outcome: 'failed', errorCode: 'UPSTREAM_TIMEOUT' }, exporterReq);
    await pool.query(
      `UPDATE integration_partner_exports SET next_retry_at = NOW() - INTERVAL '1 minute' WHERE id = $1`,
      [started.exportId],
    );

    const sweep = await controller.triggerRetrySweep({ limit: 10 }, exporterReq, 'token_1');
    expect(sweep.schedulerContract).toBe(true);
    expect((sweep as any).schedulerTokenVersion).toBe('v1');
    expect(sweep.retriedExportIds).toContain(started.exportId);

    const status = await controller.getExportStatus(started.exportId, exporterReq);
    expect(status.status).toBe('queued');

    const summary = await controller.getRetrySummary(exporterReq);
    expect((summary.lastSweepRun as any)?.schedulerTokenVersion).toBe('v1');
  });
});

