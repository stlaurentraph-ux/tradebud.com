// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DashboardAttentionStrip } from './dashboard-attention-strip';

vi.mock('@/lib/observability/analytics', () => ({
  trackDashboardEvent: vi.fn(),
  DASHBOARD_EVENTS: {
    UPSTREAM_BLOCKER_ALERT_CLICKED: 'dashboard_upstream_blocker_alert_clicked',
  },
}));

describe('DashboardAttentionStrip', () => {
  it('renders nothing when items are empty', () => {
    const { container } = render(<DashboardAttentionStrip items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders primary blocking item and secondary chips', () => {
    render(
      <DashboardAttentionStrip
        items={[
          {
            id: 'owned-blocking-issues',
            severity: 'blocking',
            title: 'Blocking issues need your action',
            message: '2 issues you own must be resolved.',
            ctaLabel: 'Review owned issues',
            ctaHref: '/compliance/issues?ownership=owned',
          },
          {
            id: 'yield-failures',
            severity: 'warning',
            title: 'Yield exceptions pending',
            message: '1 batch failed yield plausibility.',
            ctaLabel: 'View lots & batches',
            ctaHref: '/harvests',
          },
        ]}
        role="exporter"
      />,
    );
    expect(screen.getByRole('region', { name: /Attention required/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Review owned issues/i })).toHaveAttribute(
      'href',
      '/compliance/issues?ownership=owned',
    );
    expect(screen.getByText('Yield exceptions pending')).toBeInTheDocument();
  });
});
