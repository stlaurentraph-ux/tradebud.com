import type { Farmer } from '@/types';

export const mockFarmers: Farmer[] = [
  {
    id: 'farmer_001',
    name: 'Jean-Baptiste Niyonzima',
    contact_phone: '+250 788 123 456',
    cooperative_id: 'coop_001',
    plots: [],
    verified: true,
    fpic_signed: true,
    labor_compliant: true,
    created_at: '2024-01-10T00:00:00Z',
    updated_at: '2024-06-15T00:00:00Z',
  },
  {
    id: 'farmer_002',
    name: 'Marie Uwimana',
    contact_phone: '+250 788 234 567',
    cooperative_id: 'coop_001',
    plots: [],
    verified: true,
    fpic_signed: true,
    labor_compliant: true,
    created_at: '2024-02-15T00:00:00Z',
    updated_at: '2024-06-10T00:00:00Z',
  },
  {
    id: 'farmer_003',
    name: 'Pierre Habimana',
    contact_phone: '+250 788 345 678',
    cooperative_id: 'coop_002',
    plots: [],
    verified: false,
    fpic_signed: true,
    labor_compliant: true,
    created_at: '2024-03-20T00:00:00Z',
    updated_at: '2024-06-20T00:00:00Z',
  },
  {
    id: 'farmer_004',
    name: 'Esperance Mukamana',
    contact_phone: '+250 788 456 789',
    cooperative_id: 'coop_001',
    plots: [],
    verified: true,
    fpic_signed: false,
    labor_compliant: true,
    created_at: '2024-04-01T00:00:00Z',
    updated_at: '2024-06-18T00:00:00Z',
  },
  {
    id: 'farmer_005',
    name: 'Emmanuel Nsabimana',
    contact_phone: '+250 788 567 890',
    cooperative_id: 'coop_002',
    plots: [],
    verified: true,
    fpic_signed: true,
    labor_compliant: false,
    created_at: '2024-04-15T00:00:00Z',
    updated_at: '2024-06-12T00:00:00Z',
  },
];

export interface FarmerWithStats {
  id: string;
  name: string;
  phone: string;
  cooperative: string;
  total_plots: number;
  total_area_hectares: number;
  compliance_status: 'compliant' | 'partial' | 'non_compliant';
  verified: boolean;
  fpic_signed: boolean;
  created_at: string;
}

export function getMockFarmersWithStats(): FarmerWithStats[] {
  return mockFarmers.map((f) => ({
    id: f.id,
    name: f.name,
    phone: f.contact_phone ?? '',
    cooperative: f.cooperative_id === 'coop_001' ? 'Rwanda Coffee Cooperative' : 'Huye Highland Growers',
    total_plots: Math.floor(Math.random() * 5) + 1,
    total_area_hectares: parseFloat((Math.random() * 10 + 1).toFixed(2)),
    compliance_status: f.verified && f.fpic_signed && f.labor_compliant ? 'compliant' : f.verified ? 'partial' : 'non_compliant',
    verified: f.verified,
    fpic_signed: f.fpic_signed,
    created_at: f.created_at,
  }));
}

export function getFarmerById(id: string): Farmer | undefined {
  return mockFarmers.find((f) => f.id === id);
}

export function getMockFarmers(): Farmer[] {
  return mockFarmers;
}
