import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ExporterBatchRecord } from './exporter-batch-store';
import { getBatchIntakeById, listBatchIntakes } from './batch-intake-service';

const sampleBatch: ExporterBatchRecord = {
  id: 'batch_123',
  batch_id: 'BATCH-2026-099',
  plot_id: 'plot_117',
  plot_name: 'Nyota Block A',
  plot_area_hectares: 1.8,
  farmer_name: 'Amina N.',
  weight_kg: 1280,
  expected_yield_kg_per_ha: 700,
  date: '2026-04-18T09:30:00.000Z',
  status: 'warning',
  exception_status: 'pending',
};

vi.mock('./exporter-batch-store', () => ({
  loadExporterBatches: vi.fn(() => [sampleBatch]),
  saveExporterBatch: vi.fn(),
}));

describe('getBatchIntakeById', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ batches: [] }),
      })) as typeof fetch,
    );
  });

  it('finds a batch by internal id', async () => {
    await expect(getBatchIntakeById('tenant_1', 'batch_123')).resolves.toEqual(sampleBatch);
  });

  it('finds a batch by batch reference', async () => {
    await expect(getBatchIntakeById('tenant_1', 'BATCH-2026-099')).resolves.toEqual(sampleBatch);
  });

  it('returns null when no batch matches', async () => {
    await expect(getBatchIntakeById('tenant_1', 'missing')).resolves.toBeNull();
  });
});

describe('listBatchIntakes', () => {
  it('merges local batches when remote fetch succeeds', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          batches: [
            {
              ...sampleBatch,
              id: 'batch_remote',
              batch_id: 'BATCH-REMOTE',
            },
          ],
        }),
      })) as typeof fetch,
    );

    const batches = await listBatchIntakes('tenant_1');
    expect(batches).toHaveLength(2);
  });
});
