import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BulkPlotImportJobService } from './bulk-plot-import-job.service';
import { BulkPlotImportService } from './bulk-plot-import.service';

function makeRow(index: number) {
  return {
    clientPlotId: `PLOT-${index}`,
    producerFullName: `Producer ${index}`,
    latitude: 14.6349,
    longitude: -87.8494,
    declaredAreaHa: 1.2,
  };
}

function makeService(deps?: {
  pool?: { query: jest.Mock };
  bulkPlotImportService?: Partial<BulkPlotImportService>;
}) {
  const pool = deps?.pool ?? { query: jest.fn() };
  return {
    service: new BulkPlotImportJobService(
      pool as never,
      (deps?.bulkPlotImportService as BulkPlotImportService) ??
        ({
          execute: jest.fn().mockResolvedValue({
            totalRows: 1,
            importedCount: 1,
            duplicateSkippedCount: 0,
            failedCount: 0,
            rows: [],
          }),
        } as unknown as BulkPlotImportService),
    ),
    pool,
  };
}

describe('BulkPlotImportJobService.createJob', () => {
  it('rejects sync-sized payloads', async () => {
    const { service } = makeService();
    const rows = Array.from({ length: 10 }, (_, index) => makeRow(index + 1));
    await expect(
      service.createJob({ tenantId: 'tenant_1', userId: 'user_1', rows }),
    ).rejects.toThrow(BadRequestException);
  });

  it('persists a queued job for large payloads', async () => {
    const pool = {
      query: jest
        .fn()
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'job_1',
              tenant_id: 'tenant_1',
              import_type: 'PLOTS',
              file_hash_sha256: 'abc',
              payload_jsonb: { rows: [] },
              total_records: 501,
              processed_records: 0,
              success_count: 0,
              failure_count: 0,
              duplicate_skipped_count: 0,
              status: 'QUEUED',
              error_summary: null,
              started_at: null,
              completed_at: null,
              created_by_id: 'user_1',
              created_at: new Date('2026-06-24T10:00:00.000Z'),
              updated_at: new Date('2026-06-24T10:00:00.000Z'),
            },
          ],
        }),
    };
    const { service } = makeService({ pool });
    const rows = Array.from({ length: 501 }, (_, index) => makeRow(index + 1));
    const job = await service.createJob({ tenantId: 'tenant_1', userId: 'user_1', rows });
    expect(job.id).toBe('job_1');
    expect(job.status).toBe('QUEUED');
    expect(job.totalRecords).toBe(501);
    expect(pool.query).toHaveBeenCalled();
  });
});

describe('BulkPlotImportJobService.getJob', () => {
  it('throws when job is outside tenant scope', async () => {
    const pool = { query: jest.fn().mockResolvedValue({ rows: [] }) };
    const { service } = makeService({ pool });
    await expect(service.getJob('tenant_1', 'missing')).rejects.toThrow(NotFoundException);
  });
});
