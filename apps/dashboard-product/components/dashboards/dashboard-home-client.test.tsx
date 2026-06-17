// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DashboardHomeClient } from './dashboard-home-client';

vi.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: () => null }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

const authState = {
  user: {
    id: 'user_exporter',
    email: 'exporter@test.com',
    name: 'Exporter',
    tenant_id: 'tenant_1',
    roles: ['exporter'] as const,
    active_role: 'exporter' as const,
    created_at: new Date().toISOString(),
  },
};

vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({ user: authState.user }),
}));

vi.mock('@/components/layout/app-header', () => ({
  AppHeader: () => <div>Header</div>,
}));

vi.mock('@/components/dashboards/exporter-dashboard', () => ({
  ExporterDashboard: () => <div>Exporter Dashboard</div>,
}));

vi.mock('@/components/dashboards/dashboard-attention-strip', () => ({
  DashboardAttentionStrip: () => null,
}));

vi.mock('@/components/onboarding/onboarding-checklist-card', () => ({
  OnboardingChecklistCard: () => <div>Getting started checklist</div>,
}));

vi.mock('@/lib/demo-data-context', () => ({
  useDemoData: () => ({ demoDataEnabled: false }),
}));

vi.mock('@/lib/use-harvest-packages', () => ({
  useHarvestPackages: () => ({ packages: [], isLoading: false, error: null }),
}));

vi.mock('@/lib/use-dashboard-summary', () => ({
  useDashboardSummary: () => ({
    metrics: {
      total_packages: 2,
      packages_by_status: { DRAFT: 1, READY: 1, SEALED: 0, SUBMITTED: 0, ACCEPTED: 0, REJECTED: 0, ON_HOLD: 0, ARCHIVED: 0 },
      total_plots: 3,
      compliant_plots: 2,
      total_farmers: 2,
      recent_activity: [],
    },
    packages: [],
    campaigns: [],
    sponsor: null,
    isLoading: false,
    error: null,
  }),
}));

describe('DashboardHomeClient exporter onboarding', () => {
  it('does not show the generic getting-started checklist (lineage card handles exporter onboarding)', () => {
    render(<DashboardHomeClient />);
    expect(screen.queryByText('Getting started checklist')).not.toBeInTheDocument();
    expect(screen.getByText('Exporter Dashboard')).toBeInTheDocument();
  });
});
