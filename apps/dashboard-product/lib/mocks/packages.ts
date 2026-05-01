import type { DDSPackage } from '@/types';
import { mockPlots } from './plots';
import { mockFarmers } from './farmers';

export const mockPackages: DDSPackage[] = [
  {
    id: 'pkg_001',
    code: 'DDS-2024-001',
    supplier_name: 'Rwanda Coffee Cooperative',
    season: 'A',
    year: 2024,
    status: 'SEALED',
    compliance_status: 'PASSED',
    plots: mockPlots.filter((p) => p.package_id === 'pkg_001'),
    farmers: mockFarmers.slice(0, 2),
    tenant_id: 'tenant_brazil_001',
    created_by: 'usr_exporter_001',
    created_at: '2024-03-01T00:00:00Z',
    updated_at: '2024-06-15T00:00:00Z',
  },
  {
    id: 'pkg_002',
    code: 'DDS-2024-002',
    supplier_name: 'Huye Highland Growers',
    season: 'A',
    year: 2024,
    status: 'READY',
    compliance_status: 'WARNINGS',
    plots: mockPlots.filter((p) => p.package_id === 'pkg_002'),
    farmers: mockFarmers.slice(2, 4),
    tenant_id: 'tenant_brazil_001',
    created_by: 'usr_exporter_001',
    created_at: '2024-04-15T00:00:00Z',
    updated_at: '2024-06-20T00:00:00Z',
  },
  {
    id: 'pkg_003',
    code: 'DDS-2024-003',
    supplier_name: 'Lake Kivu Farms',
    season: 'B',
    year: 2024,
    status: 'SUBMITTED',
    compliance_status: 'PASSED',
    plots: mockPlots.filter((p) => p.package_id === 'pkg_003'),
    farmers: mockFarmers.slice(4),
    tenant_id: 'tenant_brazil_001',
    created_by: 'usr_exporter_001',
    traces_reference: 'TRACES-EU-2024-RW-0042',
    submitted_at: '2024-06-10T00:00:00Z',
    created_at: '2024-05-20T00:00:00Z',
    updated_at: '2024-06-10T00:00:00Z',
  },
  {
    id: 'pkg_004',
    code: 'DDS-2024-004',
    supplier_name: 'Northern Province Collective',
    season: 'B',
    year: 2024,
    status: 'DRAFT',
    compliance_status: 'PENDING',
    plots: [],
    farmers: [],
    tenant_id: 'tenant_brazil_001',
    created_by: 'usr_exporter_001',
    created_at: '2024-06-01T00:00:00Z',
    updated_at: '2024-06-18T00:00:00Z',
  },
  {
    id: 'pkg_005',
    code: 'DDS-2024-005',
    supplier_name: 'Eastern Province Union',
    season: 'B',
    year: 2024,
    status: 'READY',
    compliance_status: 'PENDING',
    plots: [],
    farmers: [],
    tenant_id: 'tenant_brazil_001',
    created_by: 'usr_exporter_001',
    created_at: '2024-06-05T00:00:00Z',
    updated_at: '2024-06-22T00:00:00Z',
  },
];

export function getPackageById(id: string): DDSPackage | undefined {
  return mockPackages.find((p) => p.id === id);
}

export function getMockPackages(): DDSPackage[] {
  return mockPackages;
}

export type MockHarvestForAssemble = {
  id: string;
  name: string;
  quantity_kg: number;
  status: 'harvested' | 'pending_yield_check' | 'blocked';
  yield_check_status: 'PASS' | 'WARNING' | 'BLOCKED';
  date: string;
};

export function getMockHarvests(): MockHarvestForAssemble[] {
  return [
    {
      id: 'h_batch_001',
      name: 'Batch 2024-001',
      quantity_kg: 12400,
      status: 'harvested',
      yield_check_status: 'PASS',
      date: '2024-06-01T00:00:00Z',
    },
    {
      id: 'h_batch_002',
      name: 'Batch 2024-002',
      quantity_kg: 9800,
      status: 'pending_yield_check',
      yield_check_status: 'WARNING',
      date: '2024-06-03T00:00:00Z',
    },
    {
      id: 'h_batch_003',
      name: 'Batch 2024-003',
      quantity_kg: 7600,
      status: 'blocked',
      yield_check_status: 'BLOCKED',
      date: '2024-06-05T00:00:00Z',
    },
  ];
}
