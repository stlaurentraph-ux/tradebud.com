// @vitest-environment jsdom
import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DashboardPage from './page';

const searchParamsState = {
  feature: 'mvp_gated',
  gate: 'request_campaigns',
};

vi.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: (key: string) => (key === 'feature' ? searchParamsState.feature : searchParamsState.gate),
  }),
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    user: {
      id: 'user_1',
      email: 'user@example.com',
      name: 'Demo User',
      tenant_id: 'tenant_1',
      roles: ['exporter'],
      active_role: 'exporter',
      created_at: new Date().toISOString(),
    },
  }),
}));

vi.mock('@/components/layout/app-header', () => ({
  AppHeader: () => <div>Header</div>,
}));

vi.mock('@/components/dashboards/exporter-dashboard', () => ({
  ExporterDashboard: () => <div>Exporter Dashboard</div>,
}));
vi.mock('@/components/dashboards/importer-dashboard', () => ({
  ImporterDashboard: () => <div>Importer Dashboard</div>,
}));
vi.mock('@/components/dashboards/cooperative-dashboard', () => ({
  CooperativeDashboard: () => <div>Cooperative Dashboard</div>,
}));
vi.mock('@/components/dashboards/reviewer-dashboard', () => ({
  ReviewerDashboard: () => <div>Reviewer Dashboard</div>,
}));
vi.mock('@/components/dashboards/sponsor-dashboard', () => ({
  SponsorDashboard: () => <div>Sponsor Dashboard</div>,
}));

describe('DashboardPage gated-entry telemetry', () => {
  const getTelemetryCalls = (fetchSpy: ReturnType<typeof vi.spyOn>) =>
    fetchSpy.mock.calls.filter((call) => call[0] === '/api/analytics/gated-entry');

  beforeEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
    searchParamsState.feature = 'mvp_gated';
    searchParamsState.gate = 'request_campaigns';
  });

  it('posts gated-entry telemetry once per session key', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 202,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const { rerender } = render(<DashboardPage />);
    await waitFor(() => {
      expect(getTelemetryCalls(fetchSpy)).toHaveLength(1);
    });
    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/analytics/gated-entry',
      expect.objectContaining({
        method: 'POST',
      }),
    );

    rerender(<DashboardPage />);
    await waitFor(() => {
      expect(getTelemetryCalls(fetchSpy)).toHaveLength(1);
    });
  });

  it('does not post telemetry when markers are invalid', async () => {
    searchParamsState.feature = 'other';
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 202,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    render(<DashboardPage />);
    await waitFor(() => {
      expect(getTelemetryCalls(fetchSpy)).toHaveLength(0);
    });
  });

  it('passes session token to telemetry route when available', async () => {
    sessionStorage.setItem('tracebud_token', 'demo_token_user_1');
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 202,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    render(<DashboardPage />);
    await waitFor(() => {
      expect(getTelemetryCalls(fetchSpy)).toHaveLength(1);
    });
    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/analytics/gated-entry',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer demo_token_user_1',
        }),
      }),
    );
  });
});
