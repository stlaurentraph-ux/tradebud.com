import { describe, expect, it } from 'vitest';
import {
  buildPackageBreadcrumbs,
  getBatchPageTitle,
  getHarvestListPageSubtitle,
  getHarvestVoucherEmptyMessage,
  getPackageCreateVoucherValidationError,
  getPackageSubmitPageTitle,
  getPackageSubmitSuccessToast,
  getShipmentNoEligibleBatchesMessage,
  getTracesReferenceLabel,
} from './supply-chain-terminology';

describe('supply-chain-terminology harvest flows', () => {
  it('uses Lots & Batches for upstream roles', () => {
    expect(getBatchPageTitle('exporter')).toBe('Lots & Batches');
    expect(getBatchPageTitle('cooperative')).toBe('Lots & Batches');
    expect(getBatchPageTitle('importer')).toBe('Batches');
  });

  it('mentions importer handoff in exporter harvest list subtitle', () => {
    expect(getHarvestListPageSubtitle('exporter')).toContain('importer handoff');
    expect(getHarvestListPageSubtitle('cooperative')).toContain('export handoff');
  });

  it('scopes voucher validation and empty states to shipment workflow roles', () => {
    expect(getPackageCreateVoucherValidationError('exporter')).toContain('shipment');
    expect(getHarvestVoucherEmptyMessage('exporter', false)).toContain('shipment assembly');
    expect(getShipmentNoEligibleBatchesMessage('cooperative')).toContain('member harvest vouchers');
  });

  it('builds package detail breadcrumbs with role-aware list label', () => {
    expect(buildPackageBreadcrumbs('importer', 'SHP-001', 'pkg_1')).toEqual([
      { label: 'Dashboard', href: '/' },
      { label: 'Shipments', href: '/packages' },
      { label: 'SHP-001', href: '/packages/pkg_1' },
    ]);
    expect(buildPackageBreadcrumbs('country_reviewer', 'DDS-001', 'pkg_2', { label: 'Submit' })).toEqual([
      { label: 'Dashboard', href: '/' },
      { label: 'DDS Packages', href: '/packages' },
      { label: 'DDS-001', href: '/packages/pkg_2' },
      { label: 'Submit' },
    ]);
  });

  it('uses TRACES language for importer package detail actions', () => {
    expect(getPackageSubmitPageTitle('importer')).toBe('Submit to TRACES');
    expect(getPackageSubmitSuccessToast('importer', 'TRACES-EU-1')).toContain('TRACES');
    expect(getTracesReferenceLabel('importer')).toBe('TRACES Reference');
    expect(getTracesReferenceLabel('exporter')).toBe('Handoff Reference');
  });
});
