// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SponsorDashboard } from './sponsor-dashboard';

vi.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: () => null,
  }),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => '/',
}));

vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    user: {
      id: 'user-sponsor',
      tenant_id: 'tenant-sponsor',
      active_role: 'sponsor',
    },
  }),
}));

vi.mock('@/lib/use-sponsor-dashboard-summary', () => ({
  useSponsorDashboardSummary: (_enabled: boolean, plotMetrics?: { total_plots?: number }) => {
    const isVirgin = (plotMetrics?.total_plots ?? 0) === 0;
    if (isVirgin) {
      return {
        countryCoverage: [],
        commodityCoverage: [],
        networkRoles: [],
        transparencyMetrics: null,
        organisationCount: 0,
        campaignCount: 0,
        draftCampaignCount: 0,
        contactCount: 0,
        rawOrganisations: [],
        rawCampaigns: [],
        isLoading: false,
        error: null,
      };
    }
    return {
      countryCoverage: [{ country: 'Ghana', organisationCount: 2, contactCount: 1 }],
      commodityCoverage: [{ commodity: 'Cocoa', programmeCount: 1, activeProgrammeCount: 1 }],
      networkRoles: [{ roleKey: 'exporter', label: 'Exporter', organisationCount: 1, contactCount: 0 }],
      transparencyMetrics: {
        countriesCovered: 1,
        commoditiesTracked: 1,
        networkRolesRepresented: 1,
        governedOrganisations: 2,
        activeContacts: 1,
        complianceHealthPercent: 84,
        atRiskOrganisations: 0,
        transparencyIndex: 84,
      },
      organisationCount: 2,
      campaignCount: 1,
      draftCampaignCount: 0,
      contactCount: 1,
      rawOrganisations: [{ id: 'org-1', name: 'Coop A', country: 'Ghana', type: 'COOPERATIVE', status: 'ACTIVE' }],
      rawCampaigns: [{ id: 'camp-1', title: 'Cocoa programme', status: 'RUNNING', commodity: 'Cocoa' }],
      isLoading: false,
      error: null,
    };
  },
}));

vi.mock('@/lib/contact-service', () => ({
  listContacts: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/lib/use-requests', () => ({
  useRequestCampaigns: () => ({
    campaigns: [],
    isLoading: false,
    error: null,
    reload: vi.fn(),
  }),
}));

vi.mock('@/lib/use-dashboard-activity', () => ({
  useDashboardActivity: () => ({ events: [], loaded: true }),
}));

vi.mock('@/components/dashboards/dashboard-activity-card', () => ({
  DashboardActivityCard: ({ title }: { title?: string }) => <div>{title}</div>,
}));

const mockMetrics = {
  total_packages: 30,
  packages_by_status: {
    DRAFT: 5,
    READY: 8,
    SEALED: 5,
    SUBMITTED: 7,
    ACCEPTED: 4,
    REJECTED: 1,
    ARCHIVED: 0,
    ON_HOLD: 0,
  },
  total_plots: 50,
  compliant_plots: 42,
  total_farmers: 20,
};

const virginMetrics = {
  total_packages: 0,
  packages_by_status: {
    DRAFT: 0,
    READY: 0,
    SEALED: 0,
    SUBMITTED: 0,
    ACCEPTED: 0,
    REJECTED: 0,
    ARCHIVED: 0,
    ON_HOLD: 0,
  },
  total_plots: 0,
  compliant_plots: 0,
  total_farmers: 0,
};

describe('SponsorDashboard', () => {
  it('renders virgin-state onboarding when network is empty', () => {
    render(<SponsorDashboard metrics={virginMetrics} />);
    expect(screen.getByText('Build your sponsor oversight network')).toBeInTheDocument();
    expect(screen.getByText(/Step 1 of 4/)).toBeInTheDocument();
  });

  it('renders multi-country sponsor oversight sections when metrics exist', () => {
    render(<SponsorDashboard metrics={mockMetrics} />);
    expect(screen.getByText('Network transparency for sustainable markets')).toBeInTheDocument();
    expect(screen.getAllByText('Countries in scope').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Commodities tracked').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Supply chain roles').length).toBeGreaterThan(0);
    expect(screen.getByText('Transparency & sustainable market readiness')).toBeInTheDocument();
  });

  it('shows network health and programme sections', () => {
    render(<SponsorDashboard metrics={mockMetrics} />);
    expect(screen.getByText('Network health snapshot')).toBeInTheDocument();
    expect(screen.getByText('Programme performance')).toBeInTheDocument();
  });
});
