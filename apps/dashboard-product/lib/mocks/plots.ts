import type { Plot } from '@/types';

export const mockPlots: Plot[] = [
  {
    id: 'plot_001',
    name: 'Kigali Highland Plot A',
    package_id: 'pkg_001',
    farmer_id: 'farmer_001',
    area_hectares: 2.5,
    deforestation_risk: 'low',
    evidence: [
      { id: 'ev_001', type: 'satellite_imagery', plot_id: 'plot_001', verified: true, created_at: '2024-05-01T00:00:00Z' },
      { id: 'ev_002', type: 'gps_coordinates', plot_id: 'plot_001', verified: true, created_at: '2024-05-01T00:00:00Z' },
    ],
    verified: true,
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-06-01T00:00:00Z',
  },
  {
    id: 'plot_002',
    name: 'Musanze Valley Farm',
    package_id: 'pkg_001',
    farmer_id: 'farmer_002',
    area_hectares: 1.8,
    deforestation_risk: 'low',
    evidence: [
      { id: 'ev_003', type: 'satellite_imagery', plot_id: 'plot_002', verified: true, created_at: '2024-05-02T00:00:00Z' },
    ],
    verified: true,
    created_at: '2024-02-20T00:00:00Z',
    updated_at: '2024-06-05T00:00:00Z',
  },
  {
    id: 'plot_003',
    name: 'Huye Mountain Terrace',
    package_id: 'pkg_002',
    farmer_id: 'farmer_003',
    area_hectares: 3.2,
    deforestation_risk: 'medium',
    evidence: [
      { id: 'ev_004', type: 'gps_coordinates', plot_id: 'plot_003', verified: true, created_at: '2024-05-10T00:00:00Z' },
    ],
    verified: false,
    created_at: '2024-03-25T00:00:00Z',
    updated_at: '2024-06-10T00:00:00Z',
  },
  {
    id: 'plot_004',
    name: 'Nyagatare Eastern Farm',
    package_id: 'pkg_002',
    farmer_id: 'farmer_004',
    area_hectares: 4.1,
    deforestation_risk: 'high',
    evidence: [],
    verified: true,
    created_at: '2024-04-10T00:00:00Z',
    updated_at: '2024-06-15T00:00:00Z',
  },
  {
    id: 'plot_005',
    name: 'Rubavu Lake View',
    package_id: 'pkg_003',
    farmer_id: 'farmer_005',
    area_hectares: 2.0,
    deforestation_risk: 'low',
    evidence: [
      { id: 'ev_005', type: 'satellite_imagery', plot_id: 'plot_005', verified: true, created_at: '2024-05-20T00:00:00Z' },
      { id: 'ev_006', type: 'farmer_affidavit', plot_id: 'plot_005', verified: true, created_at: '2024-05-21T00:00:00Z' },
    ],
    verified: true,
    created_at: '2024-05-01T00:00:00Z',
    updated_at: '2024-06-20T00:00:00Z',
  },
];

export function getPlotById(id: string): Plot | undefined {
  return mockPlots.find((p) => p.id === id);
}

export function getMockPlots(): Plot[] {
  return mockPlots;
}
