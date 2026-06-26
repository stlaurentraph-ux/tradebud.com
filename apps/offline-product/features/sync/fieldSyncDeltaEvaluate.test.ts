import { describe, expect, it } from 'vitest';
import type { FieldSyncDeltaResponse } from '@/features/api/fieldSyncDelta';
import {
  buildFieldSyncCursorSnapshot,
  buildVoucherFingerprint,
  fieldSyncDeltaHasInboundChanges,
  type FieldSyncCursorSnapshot,
} from './fieldSyncDeltaEvaluate';

function delta(overrides?: Partial<FieldSyncDeltaResponse>): FieldSyncDeltaResponse {
  return {
    serverTime: '2026-06-24T12:00:00.000Z',
    farmers: [{ farmerId: 'farmer-1', plots: [], voucherIds: ['v-1'], latestAuditAt: '2026-06-24T11:00:00.000Z' }],
    ...overrides,
  };
}

const baselineSnapshot: FieldSyncCursorSnapshot = {
  cursorMs: 1_719_200_000_000,
  auditByFarmer: { 'farmer-1': '2026-06-24T11:00:00.000Z' },
  voucherFingerprint: 'v-1',
};

describe('fieldSyncDeltaEvaluate', () => {
  it('treats missing cursor as inbound changes', () => {
    expect(fieldSyncDeltaHasInboundChanges(delta(), null)).toBe(true);
  });
  it('detects plot updates since cursor', () => {
    expect(fieldSyncDeltaHasInboundChanges(delta({ farmers: [{ farmerId: 'farmer-1', plots: [{ id: 'plot-1', updatedAt: '2026-06-24T12:01:00.000Z' }], voucherIds: ['v-1'], latestAuditAt: '2026-06-24T11:00:00.000Z' }] }), baselineSnapshot)).toBe(true);
  });
  it('detects new vouchers', () => {
    expect(fieldSyncDeltaHasInboundChanges(delta({ farmers: [{ farmerId: 'farmer-1', plots: [], voucherIds: ['v-1', 'v-2'], latestAuditAt: '2026-06-24T11:00:00.000Z' }] }), baselineSnapshot)).toBe(true);
  });
  it('detects newer audit watermark', () => {
    expect(fieldSyncDeltaHasInboundChanges(delta({ farmers: [{ farmerId: 'farmer-1', plots: [], voucherIds: ['v-1'], latestAuditAt: '2026-06-24T12:05:00.000Z' }] }), baselineSnapshot)).toBe(true);
  });
  it('returns false when watermarks match and no plot deltas', () => {
    expect(fieldSyncDeltaHasInboundChanges(delta(), baselineSnapshot)).toBe(false);
  });
  it('builds stable voucher fingerprints', () => {
    expect(buildVoucherFingerprint(delta({ farmers: [{ farmerId: 'farmer-1', plots: [], voucherIds: ['b', 'a'], latestAuditAt: null }] }))).toBe('a|b');
  });
  it('builds cursor snapshot from server time', () => {
    const snapshot = buildFieldSyncCursorSnapshot(delta());
    expect(snapshot.cursorMs).toBe(Date.parse('2026-06-24T12:00:00.000Z'));
    expect(snapshot.voucherFingerprint).toBe('v-1');
  });
});
