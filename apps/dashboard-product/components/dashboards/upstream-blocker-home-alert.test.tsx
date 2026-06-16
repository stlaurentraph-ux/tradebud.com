// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { UpstreamBlockerHomeAlert } from './upstream-blocker-home-alert';

vi.mock('@/lib/observability/analytics', () => ({
  trackDashboardEvent: vi.fn(),
  DASHBOARD_EVENTS: {
    UPSTREAM_BLOCKER_ALERT_CLICKED: 'dashboard_upstream_blocker_alert_clicked',
  },
}));

describe('UpstreamBlockerHomeAlert', () => {
  it('renders nothing when count is zero', () => {
    const { container } = render(<UpstreamBlockerHomeAlert count={0} role="importer" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders alert and link when upstream blockers exist', () => {
    render(<UpstreamBlockerHomeAlert count={2} role="importer" />);
    expect(screen.getByRole('link', { name: /View upstream blockers/i })).toHaveAttribute(
      'href',
      '/compliance/issues?ownership=upstream_blocker',
    );
  });
});
