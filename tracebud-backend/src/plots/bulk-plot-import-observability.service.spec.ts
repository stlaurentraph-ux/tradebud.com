import { BulkPlotImportObservabilityService } from './bulk-plot-import-observability.service';

describe('BulkPlotImportObservabilityService', () => {
  it('writes sync execute audit events', async () => {
    const pool = { query: jest.fn().mockResolvedValue({ rows: [] }) };
    const service = new BulkPlotImportObservabilityService(pool as never);

    await service.recordExecuteCompleted({
      tenantId: 'tenant_1',
      userId: 'user_1',
      mode: 'sync',
      totalRows: 10,
      importedCount: 8,
      duplicateSkippedCount: 1,
      failedCount: 1,
    });

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO audit_log'),
      expect.arrayContaining(['user_1', 'bulk_import_execute_completed', expect.any(String)]),
    );
  });

  it('writes job completion audit events', async () => {
    const pool = { query: jest.fn().mockResolvedValue({ rows: [] }) };
    const service = new BulkPlotImportObservabilityService(pool as never);

    await service.recordJobCompleted({
      tenantId: 'tenant_1',
      userId: 'user_1',
      jobId: 'job_1',
      status: 'PARTIAL',
      totalRecords: 501,
      successCount: 400,
      failureCount: 50,
      duplicateSkippedCount: 51,
      storageMode: 'object_storage',
    });

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO audit_log'),
      expect.arrayContaining(['user_1', 'bulk_import_job_completed', expect.any(String)]),
    );
  });
});
