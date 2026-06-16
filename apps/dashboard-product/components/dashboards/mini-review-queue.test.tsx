// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MiniReviewQueue } from './mini-review-queue';
import type { DDSPackage } from '@/types';

vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    user: { id: 'user-1', tenant_id: 'tenant-1', active_role: 'importer' },
  }),
}));

const packages: DDSPackage[] = [
  {
    id: 'pkg-1',
    code: 'SHP-100',
    supplier_name: 'Rwanda Coffee Cooperative',
    season: 'A',
    year: 2024,
    status: 'READY',
    compliance_status: 'WARNINGS',
    plots: [{ id: 'p1', deforestation_risk: 'high' } as DDSPackage['plots'][number]],
    farmers: [],
    tenant_id: 'tenant-1',
    created_by: 'user-2',
    created_at: '2024-03-01T00:00:00Z',
    updated_at: '2024-06-15T00:00:00Z',
  },
];

vi.mock('@/lib/use-harvest-packages', () => ({
  useHarvestPackages: () => ({
    packages,
    isLoading: false,
    error: null,
    reload: vi.fn(),
  }),
}));

describe('MiniReviewQueue', () => {
  it('renders importer queue items with inline actions', () => {
    render(<MiniReviewQueue role="importer" />);
    expect(screen.getByText('Review queue')).toBeInTheDocument();
    expect(screen.getByText('SHP-100')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Review shipment/i })).toHaveAttribute(
      'href',
      '/compliance?package=pkg-1',
    );
  });
});
