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
});
