import { describe, expect, it } from 'vitest';
import type { User } from '@/types';
import {
  buildPackageCreateHref,
  canCreateHarvestBatch,
  canEditHarvestBatch,
  extractIntegratedHarvestCaptureFlag,
  mergeSupplyChainRolesForSave,
  usesVoucherFirstHarvestIntake,
} from './harvest-capture-policy';

function user(activeRole: User['active_role']): User {
  return {
    id: 'user_1',
    email: 'test@example.com',
    name: 'Test',
    active_role: activeRole,
    tenant_id: 'tenant_1',
    roles: [activeRole],
    created_at: '2026-01-01T00:00:00.000Z',
  };
}

describe('harvest-capture-policy', () => {
  it('uses voucher-first intake for cooperative and exporter roles', () => {
    expect(usesVoucherFirstHarvestIntake('cooperative')).toBe(true);
    expect(usesVoucherFirstHarvestIntake('exporter')).toBe(true);
    expect(usesVoucherFirstHarvestIntake('importer')).toBe(false);
  });

  it('denies cooperative desk batch create without integrated capture', () => {
    expect(canCreateHarvestBatch(user('cooperative'), { supply_chain_roles: ['cooperative'] })).toBe(false);
    expect(canEditHarvestBatch(user('cooperative'), { supply_chain_roles: ['cooperative'] })).toBe(false);
  });

  it('allows cooperative desk batch create with integrated capture flag', () => {
    expect(
      canCreateHarvestBatch(user('cooperative'), {
        supply_chain_roles: ['cooperative', 'integrated_harvest_capture'],
      }),
    ).toBe(true);
  });

  it('denies pure exporter tenants without integrated capture', () => {
    expect(canCreateHarvestBatch(user('exporter'), { supply_chain_roles: ['exporter'] })).toBe(false);
  });

  it('allows exporter tenants with cooperative in supply chain roles', () => {
    expect(
      canCreateHarvestBatch(user('exporter'), { supply_chain_roles: ['cooperative', 'exporter'] }),
    ).toBe(true);
  });

  it('allows exporter tenants with explicit integrated harvest capture flag', () => {
    expect(
      canCreateHarvestBatch(user('exporter'), {
        supply_chain_roles: ['exporter', 'integrated_harvest_capture'],
      }),
    ).toBe(true);
  });

  it('merges integrated capture flag for cooperative-only and exporter-only tenants', () => {
    expect(mergeSupplyChainRolesForSave(['cooperative'], true)).toEqual([
      'cooperative',
      'integrated_harvest_capture',
    ]);
    expect(mergeSupplyChainRolesForSave(['exporter'], true)).toEqual([
      'exporter',
      'integrated_harvest_capture',
    ]);
    expect(mergeSupplyChainRolesForSave(['cooperative', 'exporter'], true)).toEqual([
      'cooperative',
      'exporter',
    ]);
    expect(mergeSupplyChainRolesForSave(['exporter'], false)).toEqual(['exporter']);
  });

  it('strips legacy high_res_map_tiles workflow flag on save', () => {
    expect(
      mergeSupplyChainRolesForSave(['exporter', 'high_res_map_tiles'] as never, false),
    ).toEqual(['exporter']);
  });

  it('reads integrated capture flag from profile roles array', () => {
    expect(extractIntegratedHarvestCaptureFlag(['exporter', 'integrated_harvest_capture'])).toBe(true);
    expect(extractIntegratedHarvestCaptureFlag(['exporter'])).toBe(false);
  });

  it('builds package create href with staged voucher ids', () => {
    expect(buildPackageCreateHref([])).toBe('/packages/new');
    expect(buildPackageCreateHref(['v1', 'v2'])).toBe('/packages/new?voucherIds=v1%2Cv2');
  });
});
