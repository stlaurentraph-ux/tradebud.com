// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import HarvestDetailPage from './page';

const sampleBatch = {
  id: 'batch_123',
  batch_id: 'BATCH-2026-099',
  plot_id: 'plot_117',
  plot_name: 'Nyota Block A',
  plot_area_hectares: 1.8,
  farmer_name: 'Amina N.',
  weight_kg: 1280,
  expected_yield_kg_per_ha: 700,
  date: '2026-04-18T09:30:00.000Z',
  status: 'warning' as const,
  exception_status: 'pending' as const,
};

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'batch_123' }),
}));

vi.mock('@/components/layout/app-header', () => ({
  AppHeader: ({ title }: { title: string }) => <div>{title}</div>,
}));

vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    user: { id: 'u1', active_role: 'exporter', tenant_id: 't1', roles: ['exporter'] },
  }),
}));

vi.mock('@/lib/demo-data-context', () => ({
  useDemoData: () => ({ demoDataEnabled: false, isToggleAvailable: false, setDemoDataEnabled: vi.fn() }),
}));

vi.mock('@/lib/batch-intake-service', () => ({
  getBatchIntakeById: vi.fn(),
}));

import { getBatchIntakeById } from '@/lib/batch-intake-service';

describe('HarvestDetailPage', () => {
  beforeEach(() => {
    vi.mocked(getBatchIntakeById).mockReset();
  });

  it('renders batch details when the record exists', async () => {
    vi.mocked(getBatchIntakeById).mockResolvedValue(sampleBatch);

    render(<HarvestDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('BATCH-2026-099')).toBeInTheDocument();
    });
    expect(screen.getByText('Nyota Block A')).toBeInTheDocument();
    expect(screen.getByText('1,280 kg')).toBeInTheDocument();
    expect(screen.getByText('Exception request pending review')).toBeInTheDocument();
  });

  it('shows not found when the batch is missing', async () => {
    vi.mocked(getBatchIntakeById).mockResolvedValue(null);

    render(<HarvestDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Batch not found')).toBeInTheDocument();
    });
  });
});
