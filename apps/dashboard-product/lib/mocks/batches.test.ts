import { describe, expect, it } from 'vitest';
import { getMockBatchById, mockBatches } from './batches';

describe('mock batches', () => {
  it('exposes three demo batches for harvest list and detail', () => {
    expect(mockBatches).toHaveLength(3);
    expect(mockBatches.map((batch) => batch.batch_id)).toEqual([
      'BATCH-2026-041',
      'BATCH-2026-042',
      'BATCH-2026-043',
    ]);
  });

  it('resolves by internal id and batch reference', () => {
    expect(getMockBatchById('harv_002')?.plot_name).toBe('Kijani Ridge');
    expect(getMockBatchById('BATCH-2026-041')?.status).toBe('warning');
    expect(getMockBatchById('missing')).toBeNull();
  });
});
