import { describe, expect, it } from 'vitest';
import {
  describeSupplyChainRoleMix,
  normalizeSupplyChainRoles,
  resolveTenantRolesFromProfile,
  SUPPLY_CHAIN_ROLE_PRESETS,
  ensurePrimaryInSupplyChainRoles,
  toggleSupplyChainRoleSelection,
} from './org-supply-chain-roles';

describe('org-supply-chain-roles', () => {
  it('resolves explicit multi-role profile', () => {
    const roles = resolveTenantRolesFromProfile({
      primary_role: 'exporter',
      supply_chain_roles: ['cooperative', 'exporter'],
    });
    expect(roles).toEqual(['cooperative', 'exporter']);
  });

  it('describes vertically integrated brand mix', () => {
    const description = describeSupplyChainRoleMix(['exporter', 'importer']);
    expect(description).toContain('Vertically integrated brand');
  });

  it('deduplicates invalid role values', () => {
    expect(normalizeSupplyChainRoles(['exporter', 'importer', 'invalid', 'exporter'])).toEqual([
      'exporter',
      'importer',
    ]);
  });

  it('exposes cooperative-exporter and brand presets', () => {
    const coopExporter = SUPPLY_CHAIN_ROLE_PRESETS.find((preset) => preset.id === 'cooperative_exporter');
    const brand = SUPPLY_CHAIN_ROLE_PRESETS.find((preset) => preset.id === 'brand');
    expect(coopExporter?.roles).toEqual(['cooperative', 'exporter']);
    expect(brand?.roles).toEqual(['exporter', 'importer']);
  });

  it('ensures primary signup role stays in selection', () => {
    expect(ensurePrimaryInSupplyChainRoles('exporter', ['importer'])).toEqual(['exporter', 'importer']);
    expect(toggleSupplyChainRoleSelection(['exporter'], 'exporter')).toEqual(['exporter']);
  });
});
