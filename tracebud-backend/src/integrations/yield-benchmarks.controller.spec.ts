import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { YieldBenchmarksController } from './yield-benchmarks.controller';

describe('YieldBenchmarksController', () => {
  it('rejects create when tenant claim is missing', async () => {
    const controller = new YieldBenchmarksController({ query: jest.fn() } as any);
    await expect(
      controller.createBenchmark(
        {
          commodity: 'Cocoa',
          geography: 'Ghana',
          sourceType: 'FAOSTAT',
          sourceReference: 'https://www.fao.org/faostat/en/#data/QCL',
          yieldLowerKgHa: 250,
          yieldUpperKgHa: 900,
          seasonalityFactor: 1,
          reviewCadence: 'annual',
        },
        { user: { id: 'user_1', email: 'exporter+ops@tracebud.com' } },
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects create for non-internal user', async () => {
    const controller = new YieldBenchmarksController({ query: jest.fn() } as any);
    await expect(
      controller.createBenchmark(
        {
          commodity: 'Cocoa',
          geography: 'Ghana',
          sourceType: 'FAOSTAT',
          sourceReference: 'https://www.fao.org/faostat/en/#data/QCL',
          yieldLowerKgHa: 250,
          yieldUpperKgHa: 900,
          seasonalityFactor: 1,
          reviewCadence: 'annual',
        },
        {
          user: {
            id: 'user_1',
            email: 'exporter+partner@example.com',
            app_metadata: { tenant_id: 'tenant_1', role: 'exporter' },
          },
        },
      ),
    ).rejects.toThrow('Only internal benchmark admins can manage yield benchmarks');
  });

  it('rejects exporter @tracebud.com user without admin/compliance claim', async () => {
    const controller = new YieldBenchmarksController({ query: jest.fn() } as any);
    await expect(
      controller.createBenchmark(
        {
          commodity: 'Cocoa',
          geography: 'Ghana',
          sourceType: 'FAOSTAT',
          sourceReference: 'https://www.fao.org/faostat/en/#data/QCL',
          yieldLowerKgHa: 250,
          yieldUpperKgHa: 900,
          seasonalityFactor: 1,
          reviewCadence: 'annual',
        },
        {
          user: {
            id: 'user_1',
            email: 'exporter@tracebud.com',
            app_metadata: { tenant_id: 'tenant_1', role: 'exporter' },
          },
        },
      ),
    ).rejects.toThrow('Only internal benchmark admins can manage yield benchmarks');
  });

  it('rejects create when source reference is not citable for FAOSTAT', async () => {
    const controller = new YieldBenchmarksController({ query: jest.fn() } as any);
    await expect(
      controller.createBenchmark(
        {
          commodity: 'Cocoa',
          geography: 'Ghana',
          sourceType: 'FAOSTAT',
          sourceReference: 'not-a-citation',
          yieldLowerKgHa: 250,
          yieldUpperKgHa: 900,
          seasonalityFactor: 1,
          reviewCadence: 'annual',
        },
        {
          user: {
            id: 'user_1',
            email: 'admin@tracebud.com',
            app_metadata: { tenant_id: 'tenant_1', role: 'ADMIN' },
          },
        },
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('creates draft and appends audit event', async () => {
    const pool = {
      query: jest
        .fn()
        .mockResolvedValueOnce({
          rows: [{ id: 'bench_1', active: false, created_at: '2026-04-20T00:00:00.000Z', updated_at: '2026-04-20T00:00:00.000Z' }],
        })
        .mockResolvedValueOnce({ rows: [] }),
    };
    const controller = new YieldBenchmarksController(pool as any);
    const result = await controller.createBenchmark(
      {
        commodity: 'Cocoa',
        geography: 'Ghana',
        sourceType: 'FAOSTAT',
        sourceReference: 'https://www.fao.org/faostat/en/#data/QCL',
        yieldLowerKgHa: 250,
        yieldUpperKgHa: 900,
        seasonalityFactor: 1,
        reviewCadence: 'annual',
      },
      {
        user: {
          id: 'user_1',
          email: 'admin@tracebud.com',
          app_metadata: { tenant_id: 'tenant_1', role: 'ADMIN' },
        },
      },
    );

    expect(result).toEqual(
      expect.objectContaining({
        id: 'bench_1',
        active: false,
        status: 'draft',
      }),
    );
    expect(pool.query).toHaveBeenCalledTimes(2);
    expect(pool.query).toHaveBeenNthCalledWith(2, expect.any(String), expect.arrayContaining(['yield_benchmark_created']));
  });

  it('enforces dual-control activation', async () => {
    const pool = {
      query: jest.fn().mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ id: 'bench_1', active: false, created_by_user_id: 'user_1' }],
      }),
    };
    const controller = new YieldBenchmarksController(pool as any);
    await expect(
      controller.activateBenchmark('bench_1', {
        user: {
          id: 'user_1',
          email: 'admin@tracebud.com',
          app_metadata: { tenant_id: 'tenant_1', role: 'ADMIN' },
        },
      }),
    ).rejects.toThrow('Dual-control violation: approver must differ from creator');
  });

  it('imports rows by creating new drafts and appends import lifecycle events', async () => {
    const pool = {
      query: jest
        .fn()
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rowCount: 0, rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] }),
    };
    const controller = new YieldBenchmarksController(pool as any);

    const result = await controller.importBenchmarks(
      {
        rows: [
          {
            commodity: 'Coffee',
            geography: 'HN',
            sourceType: 'FAOSTAT',
            sourceReference: 'https://www.fao.org/faostat/en/#data/QCL',
            yieldLowerKgHa: 400,
            yieldUpperKgHa: 1200,
            seasonalityFactor: 1,
            reviewCadence: 'annual',
          },
        ],
      },
      {
        user: {
          id: 'user_1',
          email: 'admin@tracebud.com',
          app_metadata: { tenant_id: 'tenant_1', role: 'ADMIN' },
        },
      },
    );

    expect(result).toEqual({ imported: 1, created: 1, updated: 0, status: 'imported' });
    expect(pool.query).toHaveBeenNthCalledWith(
      1,
      expect.any(String),
      expect.arrayContaining(['yield_benchmark_import_started']),
    );
    expect(pool.query).toHaveBeenNthCalledWith(
      4,
      expect.any(String),
      expect.arrayContaining(['yield_benchmark_import_completed']),
    );
  });

  it('imports rows by updating an existing matching draft', async () => {
    const pool = {
      query: jest
        .fn()
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 'bench_draft_1' }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] }),
    };
    const controller = new YieldBenchmarksController(pool as any);

    const result = await controller.importBenchmarks(
      {
        rows: [
          {
            commodity: 'Coffee',
            geography: 'GLOBAL',
            sourceType: 'USDA_FAS',
            sourceReference: 'report:usda-fas-2026',
            yieldLowerKgHa: 500,
            yieldUpperKgHa: 1300,
            seasonalityFactor: 1.05,
            reviewCadence: 'annual',
          },
        ],
      },
      {
        user: {
          id: 'user_1',
          email: 'admin@tracebud.com',
          app_metadata: { tenant_id: 'tenant_1', role: 'ADMIN' },
        },
      },
    );

    expect(result).toEqual({ imported: 1, created: 0, updated: 1, status: 'imported' });
  });

  it('syncs source rows with dry-run and records completed run', async () => {
    process.env.YIELD_BENCHMARKS_FAOSTAT_URL = 'https://example.test/faostat';
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        rows: [
          {
            commodity: 'Coffee',
            geography: 'HN',
            source_reference: 'https://example.test/faostat/coffee',
            yield_lower_kg_ha: 400,
            yield_upper_kg_ha: 1200,
            seasonality_factor: 1,
            review_cadence: 'annual',
          },
        ],
      }),
    });
    const originalFetch = global.fetch;
    (global as any).fetch = fetchMock;
    const pool = {
      query: jest
        .fn()
        .mockResolvedValueOnce({ rows: [{ id: 'run_1' }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] }),
    };
    const controller = new YieldBenchmarksController(pool as any);
    const result = await controller.syncBenchmarksFromSource(
      { sourceType: 'FAOSTAT', dryRun: true },
      {
        user: {
          id: 'user_1',
          email: 'admin@tracebud.com',
          app_metadata: { tenant_id: 'tenant_1', role: 'ADMIN' },
        },
      },
    );
    expect(result).toEqual(
      expect.objectContaining({
        runId: 'run_1',
        imported: 1,
        created: 0,
        updated: 0,
        dryRun: true,
        status: 'completed',
      }),
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
    (global as any).fetch = originalFetch;
    delete process.env.YIELD_BENCHMARKS_FAOSTAT_URL;
  });

  it('syncs directly from FAOSTAT when adapter URL is not configured', async () => {
    process.env.YIELD_BENCHMARKS_FAOSTAT_BEARER_TOKEN = 'test-token';
    delete process.env.YIELD_BENCHMARKS_FAOSTAT_URL;
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: [
          {
            area_code: '110',
            item_code: '656',
            value: 12500,
          },
        ],
      }),
    });
    const originalFetch = global.fetch;
    (global as any).fetch = fetchMock;
    const pool = {
      query: jest
        .fn()
        .mockResolvedValueOnce({ rows: [{ id: 'run_2' }] })
        .mockResolvedValueOnce({ rowCount: 0, rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] }),
    };
    const controller = new YieldBenchmarksController(pool as any);
    const result = await controller.syncBenchmarksFromSource(
      { sourceType: 'FAOSTAT', dryRun: false },
      {
        user: {
          id: 'user_1',
          email: 'admin@tracebud.com',
          app_metadata: { tenant_id: 'tenant_1', role: 'ADMIN' },
        },
      },
    );
    expect(result).toEqual(
      expect.objectContaining({
        runId: 'run_2',
        imported: 1,
        created: 1,
        updated: 0,
        dryRun: false,
        status: 'completed',
      }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('faostatservices.fao.org/api/v1/en/data/QCL'),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
      }),
    );
    (global as any).fetch = originalFetch;
    delete process.env.YIELD_BENCHMARKS_FAOSTAT_BEARER_TOKEN;
  });

  it('authenticates with FAOSTAT login endpoint when static bearer token is absent', async () => {
    process.env.YIELD_BENCHMARKS_FAOSTAT_USERNAME = 'user@example.com';
    process.env.YIELD_BENCHMARKS_FAOSTAT_PASSWORD = 'secret';
    delete process.env.YIELD_BENCHMARKS_FAOSTAT_BEARER_TOKEN;
    delete process.env.YIELD_BENCHMARKS_FAOSTAT_URL;

    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ access_token: 'runtime-token' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: [
            {
              area_code: '110',
              item_code: '656',
              value: 12500,
            },
          ],
        }),
      });
    const originalFetch = global.fetch;
    (global as any).fetch = fetchMock;
    const pool = {
      query: jest
        .fn()
        .mockResolvedValueOnce({ rows: [{ id: 'run_3' }] })
        .mockResolvedValueOnce({ rowCount: 0, rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] }),
    };
    const controller = new YieldBenchmarksController(pool as any);
    await controller.syncBenchmarksFromSource(
      { sourceType: 'FAOSTAT', dryRun: false },
      {
        user: {
          id: 'user_1',
          email: 'admin@tracebud.com',
          app_metadata: { tenant_id: 'tenant_1', role: 'ADMIN' },
        },
      },
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('/auth/login'),
      expect.objectContaining({
        method: 'POST',
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('/en/data/QCL'),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer runtime-token' }),
      }),
    );
    (global as any).fetch = originalFetch;
    delete process.env.YIELD_BENCHMARKS_FAOSTAT_USERNAME;
    delete process.env.YIELD_BENCHMARKS_FAOSTAT_PASSWORD;
  });

  it('lists import runs and returns empty list when run table is missing', async () => {
    const pool = {
      query: jest.fn().mockRejectedValue({ code: '42P01' }),
    };
    const controller = new YieldBenchmarksController(pool as any);
    const result = await controller.listImportRuns('25', {
      user: {
        id: 'user_1',
        email: 'admin@tracebud.com',
        app_metadata: { tenant_id: 'tenant_1', role: 'ADMIN' },
      },
    });
    expect(result).toEqual({ items: [] });
  });
});
