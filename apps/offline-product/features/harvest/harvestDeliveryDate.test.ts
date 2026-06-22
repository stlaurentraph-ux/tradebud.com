import { describe, expect, it } from 'vitest';

import {
  harvestDateIsoFromMs,
  parseRecordedAtFromClientEventId,
} from './harvestDeliveryDate';
import { voucherDeliveredAtMs } from './voucherRowFields';

describe('harvestDeliveryDate', () => {
  it('formats recordedAt as ISO calendar date', () => {
    expect(harvestDateIsoFromMs(Date.parse('2026-06-19T15:30:00.000Z'))).toBe('2026-06-19');
  });

  it('parses field-app client event ids', () => {
    expect(
      parseRecordedAtFromClientEventId(
        'harvest-550e8400-e29b-41d4-a716-446655440000-1718793600000',
      ),
    ).toBe(1718793600000);
  });
});

describe('voucherDeliveredAtMs', () => {
  it('prefers harvest_date over upload created_at', () => {
    const ms = voucherDeliveredAtMs({
      harvest_date: '2026-06-19',
      created_at: '2026-06-22T13:05:10.000Z',
    });
    expect(new Date(ms).toISOString().slice(0, 10)).toBe('2026-06-19');
  });

  it('falls back to client_event_id timestamp', () => {
    const ms = voucherDeliveredAtMs({
      client_event_id: 'harvest-plot-a-1718793600000',
      created_at: '2026-06-22T13:05:10.000Z',
    });
    expect(ms).toBe(1718793600000);
  });
});
