import { describe, expect, it } from 'vitest';
import { buildFieldSyncRestoreScope, isPlotInRestoreScope } from './fieldSyncRestoreScope';

describe('fieldSyncRestoreScope', () => {
  it('builds scope from change set', () => {
    const scope = buildFieldSyncRestoreScope({ changedServerPlotIds: ['p1', 'p2'], vouchersChanged: true, auditChangedFarmerIds: ['f1'] });
    expect(scope.serverPlotIds.has('p1')).toBe(true);
    expect(scope.restoreVouchers).toBe(true);
    expect(scope.restoreFarmerAuditArtifacts).toBe(true);
  });
  it('marks no audit restore when audit unchanged', () => {
    const scope = buildFieldSyncRestoreScope({ changedServerPlotIds: ['p1'], vouchersChanged: false, auditChangedFarmerIds: [] });
    expect(scope.restoreFarmerAuditArtifacts).toBe(false);
  });
  it('isPlotInRestoreScope returns true without scope', () => {
    expect(isPlotInRestoreScope('any', undefined)).toBe(true);
  });
  it('isPlotInRestoreScope filters by set', () => {
    const scope = buildFieldSyncRestoreScope({ changedServerPlotIds: ['p1'], vouchersChanged: false, auditChangedFarmerIds: [] });
    expect(isPlotInRestoreScope('p1', scope)).toBe(true);
    expect(isPlotInRestoreScope('p2', scope)).toBe(false);
  });
});
