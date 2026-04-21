import { ForbiddenException } from '@nestjs/common';
import { PartnerDataController } from './partner-data.controller';

describe('PartnerDataController', () => {
  it('rejects dataset reads when tenant claim is missing', async () => {
    const pool = { query: jest.fn() };
    const controller = new PartnerDataController(pool as any);

    await expect(
      controller.listDatasets('read:lineage', {
        user: { id: 'user_1', email: 'exporter+ops@tracebud.com' },
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects partner export starts for non-exporter roles', async () => {
    const pool = { query: jest.fn() };
    const controller = new PartnerDataController(pool as any);

    await expect(
      controller.startExport(
        {
          scope: 'read:compliance',
          dataset: 'dds_packages',
          format: 'csv',
          idempotencyKey: 'idem_1',
        },
        {
          user: {
            id: 'user_1',
            email: 'agent+ops@tracebud.com',
            app_metadata: { tenant_id: 'tenant_1' },
          },
        },
      ),
    ).rejects.toThrow('Only exporters can start partner exports');
  });

  it('lists scope-allowed datasets and writes immutable audit evidence', async () => {
    const pool = { query: jest.fn().mockResolvedValue({ rows: [] }) };
    const controller = new PartnerDataController(pool as any);

    await expect(
      controller.listDatasets('read:lineage', {
        user: {
          id: 'user_1',
          email: 'exporter+ops@tracebud.com',
          app_metadata: { tenant_id: 'tenant_1' },
        },
      }),
    ).resolves.toEqual({
      tenantId: 'tenant_1',
      scope: 'read:lineage',
      datasets: ['lineage_nodes', 'lineage_edges', 'root_plot_ids'],
      state: 'partner_connection_active',
    });
    expect(pool.query).toHaveBeenCalledTimes(1);
    expect(pool.query).toHaveBeenCalledWith(
      expect.any(String),
      expect.arrayContaining(['user_1', 'dashboard-web', 'partner_dataset_requested']),
    );
  });

  it('starts partner export with idempotency and emits export evidence event', async () => {
    const pool = {
      query: jest
        .fn()
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'export_1',
              tenant_id: 'tenant_1',
              scope: 'read:compliance',
              dataset: 'dds_packages',
              format: 'parquet',
              idempotency_key: 'idem_1',
              cursor: 'cursor_2026_04_21',
              status: 'queued',
              state: 'partner_sync_pending',
              artifact_url: null,
              attempt_count: 1,
              error_code: null,
              next_retry_at: null,
              retry_exhausted_at: null,
              created_by_user_id: 'user_1',
              created_at: '2026-04-21T00:00:00.000Z',
              updated_at: '2026-04-21T00:00:00.000Z',
            },
          ],
        })
        .mockResolvedValue({ rows: [] }),
    };
    const controller = new PartnerDataController(pool as any);

    const result = await controller.startExport(
      {
        scope: 'read:compliance',
        dataset: 'dds_packages',
        format: 'parquet',
        idempotencyKey: 'idem_1',
        cursor: 'cursor_2026_04_21',
      },
      {
        user: {
          id: 'user_1',
          email: 'exporter+ops@tracebud.com',
          app_metadata: { tenant_id: 'tenant_1' },
        },
      },
    );

    expect(result).toEqual({
      exportId: 'export_1',
      status: 'queued',
      state: 'partner_sync_pending',
      dataset: 'dds_packages',
      format: 'parquet',
      idempotencyKey: 'idem_1',
      cursor: 'cursor_2026_04_21',
      attemptCount: 1,
      errorCode: null,
      nextRetryAt: null,
      retryExhaustedAt: null,
      createdAt: '2026-04-21T00:00:00.000Z',
      updatedAt: '2026-04-21T00:00:00.000Z',
      replayed: false,
    });
    expect(pool.query).toHaveBeenCalledTimes(3);
    expect(pool.query).toHaveBeenLastCalledWith(
      expect.any(String),
      expect.arrayContaining(['user_1', 'dashboard-web', 'partner_dataset_exported']),
    );
  });

  it('returns replayed=true when idempotency key already exists for tenant', async () => {
    const pool = {
      query: jest
        .fn()
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'export_existing',
              tenant_id: 'tenant_1',
              scope: 'read:compliance',
              dataset: 'dds_packages',
              format: 'csv',
              idempotency_key: 'idem_1',
              cursor: null,
              status: 'queued',
              state: 'partner_sync_pending',
              artifact_url: null,
              attempt_count: 1,
              error_code: null,
              next_retry_at: null,
              retry_exhausted_at: null,
              created_by_user_id: 'user_1',
              created_at: '2026-04-21T00:00:00.000Z',
              updated_at: '2026-04-21T00:00:00.000Z',
            },
          ],
        })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'export_1',
              tenant_id: 'tenant_1',
              scope: 'read:shipments',
              dataset: 'shipment_headers',
              format: 'csv',
              idempotency_key: 'idem_1',
              cursor: null,
              status: 'completed',
              state: 'partner_sync_succeeded',
              artifact_url: 'https://files.example.com/export_1.csv',
              attempt_count: 1,
              error_code: null,
              next_retry_at: null,
              retry_exhausted_at: null,
              created_by_user_id: 'user_1',
              created_at: '2026-04-21T00:00:00.000Z',
              updated_at: '2026-04-21T00:10:00.000Z',
            },
          ],
        })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'export_1',
              tenant_id: 'tenant_1',
              scope: 'read:shipments',
              dataset: 'shipment_headers',
              format: 'csv',
              idempotency_key: 'idem_1',
              cursor: null,
              status: 'completed',
              state: 'partner_sync_succeeded',
              artifact_url: 'https://files.example.com/export_1.csv',
              attempt_count: 1,
              error_code: null,
              next_retry_at: null,
              retry_exhausted_at: null,
              created_by_user_id: 'user_1',
              created_at: '2026-04-21T00:00:00.000Z',
              updated_at: '2026-04-21T00:10:00.000Z',
            },
          ],
        })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'export_1',
              tenant_id: 'tenant_1',
              scope: 'read:shipments',
              dataset: 'shipment_headers',
              format: 'csv',
              idempotency_key: 'idem_1',
              cursor: null,
              status: 'completed',
              state: 'partner_sync_succeeded',
              artifact_url: 'https://files.example.com/export_1.csv',
              attempt_count: 1,
              error_code: null,
              next_retry_at: null,
              retry_exhausted_at: null,
              created_by_user_id: 'user_1',
              created_at: '2026-04-21T00:00:00.000Z',
              updated_at: '2026-04-21T00:10:00.000Z',
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [] }),
    };
    const controller = new PartnerDataController(pool as any);

    const result = await controller.startExport(
      {
        scope: 'read:compliance',
        dataset: 'dds_packages',
        format: 'csv',
        idempotencyKey: 'idem_1',
      },
      {
        user: {
          id: 'user_1',
          email: 'exporter+ops@tracebud.com',
          app_metadata: { tenant_id: 'tenant_1' },
        },
      },
    );

    expect(result).toEqual({
      exportId: 'export_existing',
      status: 'queued',
      state: 'partner_sync_pending',
      dataset: 'dds_packages',
      format: 'csv',
      idempotencyKey: 'idem_1',
      cursor: null,
      attemptCount: 1,
      errorCode: null,
      nextRetryAt: null,
      retryExhaustedAt: null,
      createdAt: '2026-04-21T00:00:00.000Z',
      updatedAt: '2026-04-21T00:00:00.000Z',
      replayed: true,
    });
  });

  it('returns tenant-scoped export status', async () => {
    const pool = {
      query: jest.fn().mockResolvedValue({
        rows: [
          {
            id: 'export_1',
            tenant_id: 'tenant_1',
            scope: 'read:shipments',
            dataset: 'shipment_headers',
            format: 'csv',
            idempotency_key: 'idem_1',
            cursor: null,
            status: 'completed',
            state: 'partner_sync_succeeded',
            artifact_url: 'https://files.example.com/export_1.csv',
            attempt_count: 1,
            error_code: null,
            next_retry_at: null,
            retry_exhausted_at: null,
            created_by_user_id: 'user_1',
            created_at: '2026-04-21T00:00:00.000Z',
            updated_at: '2026-04-21T00:10:00.000Z',
          },
        ],
      }),
    };
    const controller = new PartnerDataController(pool as any);

    await expect(
      controller.getExportStatus('export_1', {
        user: {
          id: 'user_2',
          email: 'agent+ops@tracebud.com',
          app_metadata: { tenant_id: 'tenant_1' },
        },
      }),
    ).resolves.toEqual({
      exportId: 'export_1',
      status: 'completed',
      state: 'partner_sync_succeeded',
      dataset: 'shipment_headers',
      format: 'csv',
      idempotencyKey: 'idem_1',
      cursor: null,
      attemptCount: 1,
      errorCode: null,
      nextRetryAt: null,
      retryExhaustedAt: null,
      createdAt: '2026-04-21T00:00:00.000Z',
      updatedAt: '2026-04-21T00:10:00.000Z',
      replayed: false,
    });
  });

  it('returns download URL only for completed exports', async () => {
    const pool = {
      query: jest.fn().mockResolvedValue({
        rows: [
          {
            id: 'export_1',
            tenant_id: 'tenant_1',
            scope: 'read:shipments',
            dataset: 'shipment_headers',
            format: 'csv',
            idempotency_key: 'idem_1',
            cursor: null,
            status: 'completed',
            state: 'partner_sync_succeeded',
            artifact_url: 'https://files.example.com/export_1.csv',
            attempt_count: 1,
            error_code: null,
            next_retry_at: null,
            retry_exhausted_at: null,
            created_by_user_id: 'user_1',
            created_at: '2026-04-21T00:00:00.000Z',
            updated_at: '2026-04-21T00:10:00.000Z',
          },
        ],
      }),
    };
    const controller = new PartnerDataController(pool as any);

    await expect(
      controller.getExportDownload('export_1', {
        user: {
          id: 'user_1',
          email: 'exporter+ops@tracebud.com',
          app_metadata: { tenant_id: 'tenant_1' },
        },
      }),
    ).resolves.toEqual({
      exportId: 'export_1',
      status: 'completed',
      dataset: 'shipment_headers',
      format: 'csv',
      downloadUrl: 'https://files.example.com/export_1.csv',
      expiresInSeconds: 900,
    });
  });

  it('finalizes export as completed and emits delivery telemetry', async () => {
    const pool = {
      query: jest
        .fn()
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'export_1',
              tenant_id: 'tenant_1',
              scope: 'read:shipments',
              dataset: 'shipment_headers',
              format: 'csv',
              idempotency_key: 'idem_1',
              cursor: null,
              status: 'completed',
              state: 'partner_sync_succeeded',
              artifact_url: 'https://files.example.com/export_1.csv',
              attempt_count: 1,
              error_code: null,
              next_retry_at: null,
              retry_exhausted_at: null,
              created_by_user_id: 'user_1',
              created_at: '2026-04-21T00:00:00.000Z',
              updated_at: '2026-04-21T00:10:00.000Z',
            },
          ],
        })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'export_1',
              tenant_id: 'tenant_1',
              scope: 'read:shipments',
              dataset: 'shipment_headers',
              format: 'csv',
              idempotency_key: 'idem_1',
              cursor: null,
              status: 'completed',
              state: 'partner_sync_succeeded',
              artifact_url: 'https://files.example.com/export_1.csv',
              attempt_count: 1,
              error_code: null,
              next_retry_at: null,
              retry_exhausted_at: null,
              created_by_user_id: 'user_1',
              created_at: '2026-04-21T00:00:00.000Z',
              updated_at: '2026-04-21T00:10:00.000Z',
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [] }),
    };
    const controller = new PartnerDataController(pool as any);

    await expect(
      controller.finalizeExport(
        'export_1',
        { outcome: 'completed', artifactUrl: 'https://files.example.com/export_1.csv' },
        {
          user: {
            id: 'user_1',
            email: 'exporter+ops@tracebud.com',
            app_metadata: { tenant_id: 'tenant_1' },
          },
        },
      ),
    ).resolves.toEqual({
      exportId: 'export_1',
      status: 'completed',
      state: 'partner_sync_succeeded',
      dataset: 'shipment_headers',
      format: 'csv',
      idempotencyKey: 'idem_1',
      cursor: null,
      attemptCount: 1,
      errorCode: null,
      nextRetryAt: null,
      retryExhaustedAt: null,
      createdAt: '2026-04-21T00:00:00.000Z',
      updatedAt: '2026-04-21T00:10:00.000Z',
      replayed: false,
    });
  });

  it('lists due retry queue items and retries failed exports', async () => {
    const pool = {
      query: jest
        .fn()
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'export_failed',
              tenant_id: 'tenant_1',
              scope: 'read:risk',
              dataset: 'risk_scores',
              format: 'csv',
              idempotency_key: 'idem_failed',
              cursor: null,
              status: 'failed',
              state: 'partner_sync_terminal_failed',
              artifact_url: null,
              attempt_count: 2,
              error_code: 'UPSTREAM_TIMEOUT',
              next_retry_at: '2026-04-21T00:00:00.000Z',
              retry_exhausted_at: null,
              created_by_user_id: 'user_1',
              created_at: '2026-04-21T00:00:00.000Z',
              updated_at: '2026-04-21T00:10:00.000Z',
            },
          ],
        })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'export_failed',
              tenant_id: 'tenant_1',
              scope: 'read:risk',
              dataset: 'risk_scores',
              format: 'csv',
              idempotency_key: 'idem_failed',
              cursor: null,
              status: 'failed',
              state: 'partner_sync_terminal_failed',
              artifact_url: null,
              attempt_count: 2,
              error_code: 'UPSTREAM_TIMEOUT',
              next_retry_at: '2026-04-21T00:00:00.000Z',
              retry_exhausted_at: null,
              created_by_user_id: 'user_1',
              created_at: '2026-04-21T00:00:00.000Z',
              updated_at: '2026-04-21T00:10:00.000Z',
            },
          ],
        })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'export_failed',
              tenant_id: 'tenant_1',
              scope: 'read:risk',
              dataset: 'risk_scores',
              format: 'csv',
              idempotency_key: 'idem_failed',
              cursor: null,
              status: 'queued',
              state: 'partner_sync_pending',
              artifact_url: null,
              attempt_count: 3,
              error_code: null,
              next_retry_at: null,
              retry_exhausted_at: null,
              created_by_user_id: 'user_1',
              created_at: '2026-04-21T00:00:00.000Z',
              updated_at: '2026-04-21T00:15:00.000Z',
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [] }),
    };
    const controller = new PartnerDataController(pool as any);

    const queue = await controller.listRetryQueue('20', {
      user: {
        id: 'user_1',
        email: 'agent+ops@tracebud.com',
        app_metadata: { tenant_id: 'tenant_1' },
      },
    });
    expect(queue.items).toHaveLength(1);
    expect(queue.items[0]).toEqual(
      expect.objectContaining({
        exportId: 'export_failed',
        status: 'failed',
        attemptCount: 2,
      }),
    );

    const retried = await controller.retryExport('export_failed', {
      user: {
        id: 'user_1',
        email: 'exporter+ops@tracebud.com',
        app_metadata: { tenant_id: 'tenant_1' },
      },
    });
    expect(retried).toEqual(
      expect.objectContaining({
        exportId: 'export_failed',
        status: 'queued',
        attemptCount: 3,
      }),
    );
  });

  it('rejects retry when export reached retry cap', async () => {
    const pool = {
      query: jest
        .fn()
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'export_failed',
              tenant_id: 'tenant_1',
              scope: 'read:risk',
              dataset: 'risk_scores',
              format: 'csv',
              idempotency_key: 'idem_failed',
              cursor: null,
              status: 'failed',
              state: 'partner_sync_terminal_failed',
              artifact_url: null,
              attempt_count: 5,
              error_code: 'UPSTREAM_TIMEOUT',
              next_retry_at: '2026-04-21T00:00:00.000Z',
              retry_exhausted_at: '2026-04-21T01:00:00.000Z',
              created_by_user_id: 'user_1',
              created_at: '2026-04-21T00:00:00.000Z',
              updated_at: '2026-04-21T01:00:00.000Z',
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [] }),
    };
    const controller = new PartnerDataController(pool as any);
    await expect(
      controller.retryExport('export_failed', {
        user: {
          id: 'user_1',
          email: 'exporter+ops@tracebud.com',
          app_metadata: { tenant_id: 'tenant_1' },
        },
      }),
    ).rejects.toThrow('Partner export retry cap reached');
  });

  it('returns retry summary diagnostics', async () => {
    const pool = {
      query: jest
        .fn()
        .mockResolvedValueOnce({
          rows: [{ due_retry_count: '2', failed_count: '4', exhausted_count: '1' }],
        })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'export_latest',
              status: 'failed',
              attempt_count: 4,
              next_retry_at: '2026-04-21T00:30:00.000Z',
              retry_exhausted_at: null,
              updated_at: '2026-04-21T00:20:00.000Z',
            },
          ],
        })
        .mockResolvedValueOnce({
          rows: [
            {
              timestamp: '2026-04-21T00:21:00.000Z',
              event_type: 'partner_retry_sweep_completed',
              payload: {
                sweepExecutionId: 'sweep_1',
                status: 'completed',
                scannedCount: 3,
                retriedCount: 2,
              },
            },
          ],
        }),
    };
    const controller = new PartnerDataController(pool as any);
    await expect(
      controller.getRetrySummary({
        user: {
          id: 'user_1',
          email: 'agent+ops@tracebud.com',
          app_metadata: { tenant_id: 'tenant_1' },
        },
      }),
    ).resolves.toEqual({
      tenantId: 'tenant_1',
      maxAttempts: 5,
      dueRetryCount: 2,
      failedCount: 4,
      exhaustedCount: 1,
      latestRetryActivity: {
        id: 'export_latest',
        status: 'failed',
        attempt_count: 4,
        next_retry_at: '2026-04-21T00:30:00.000Z',
        retry_exhausted_at: null,
        updated_at: '2026-04-21T00:20:00.000Z',
      },
      lastSweepRun: {
        at: '2026-04-21T00:21:00.000Z',
        eventType: 'partner_retry_sweep_completed',
        sweepExecutionId: 'sweep_1',
        status: 'completed',
        scannedCount: 3,
        retriedCount: 2,
        schedulerTokenVersion: null,
        errorMessage: null,
      },
    });
  });

  it('runs scheduler retry sweep and emits sweep telemetry', async () => {
    process.env.PARTNER_EXPORT_RETRY_SWEEP_TOKEN = 'token_1';
    process.env.PARTNER_EXPORT_RETRY_SWEEP_TOKEN_VERSION = 'v1';
    const pool = {
      query: jest
        .fn()
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'export_a',
              tenant_id: 'tenant_1',
              scope: 'read:risk',
              dataset: 'risk_scores',
              format: 'csv',
              idempotency_key: 'idem_a',
              cursor: null,
              status: 'failed',
              state: 'partner_sync_terminal_failed',
              artifact_url: null,
              attempt_count: 2,
              error_code: 'UPSTREAM_TIMEOUT',
              next_retry_at: '2026-04-21T00:00:00.000Z',
              retry_exhausted_at: null,
              created_by_user_id: 'user_1',
              created_at: '2026-04-21T00:00:00.000Z',
              updated_at: '2026-04-21T00:10:00.000Z',
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [{ id: 'export_a' }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] }),
    };
    const controller = new PartnerDataController(pool as any);
    await expect(
      controller.triggerRetrySweep(
        { limit: 10 },
        {
          user: {
            id: 'user_1',
            email: 'exporter+ops@tracebud.com',
            app_metadata: { tenant_id: 'tenant_1' },
          },
        },
        'token_1',
      ),
    ).resolves.toEqual({
      tenantId: 'tenant_1',
      schedulerContract: true,
      sweepExecutionId: expect.any(String),
      status: 'completed',
      schedulerTokenVersion: 'v1',
      scannedCount: 1,
      retriedCount: 1,
      retriedExportIds: ['export_a'],
      limit: 10,
    });
  });
});

