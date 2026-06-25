import { BulkPlotImportJobStorageService } from './bulk-plot-import-job-storage.service';
import type { BulkPlotImportInputRow } from './bulk-plot-import.types';

function makeRow(index: number): BulkPlotImportInputRow {
  return {
    clientPlotId: `PLOT-${index}`,
    producerFullName: `Producer ${index}`,
    latitude: 14.6349,
    longitude: -87.8494,
    declaredAreaHa: 1.2,
  };
}

describe('BulkPlotImportJobStorageService', () => {
  const observability = {
    log: jest.fn(),
    warn: jest.fn(),
    recordStorageFallback: jest.fn().mockResolvedValue(undefined),
  };

  it('keeps small payloads inline', async () => {
    const service = new BulkPlotImportJobStorageService(observability as never);
    const payload = { rows: [makeRow(1)] };
    const stored = await service.persistJobPayload({
      tenantId: 'tenant_1',
      jobId: 'job_1',
      payload,
    });
    expect(stored.fileStorageKey).toBeNull();
    expect(stored.storageMode).toBe('inline');
    expect(stored.payloadJsonb.rows).toEqual(payload.rows);
  });

  it('loads inline payloads without storage key', async () => {
    const service = new BulkPlotImportJobStorageService(observability as never);
    const payload = { rows: [makeRow(1)], actorEmail: 'ops@example.com', storageMode: 'inline' };
    const loaded = await service.loadJobPayload({ payloadJsonb: payload });
    expect(loaded.rows).toHaveLength(1);
    expect(loaded.actorEmail).toBe('ops@example.com');
    expect(loaded.storageMode).toBe('inline');
  });

  it('detects large payloads for object storage', () => {
    const service = new BulkPlotImportJobStorageService(observability as never);
    const serialized = JSON.stringify({ rows: [{ clientPlotId: 'x'.repeat(600_000) }] });
    expect(service.shouldUseObjectStorage(serialized)).toBe(true);
  });
});
