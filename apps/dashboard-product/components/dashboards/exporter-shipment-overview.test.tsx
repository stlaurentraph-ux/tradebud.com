// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ExporterShipmentOverview } from './exporter-shipment-overview';

vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({ user: { active_role: 'exporter' } }),
}));

describe('ExporterShipmentOverview', () => {
  it('shows primary workflow stages and manage link', () => {
    render(
      <ExporterShipmentOverview
        packagesByStatus={{
          DRAFT: 1,
          READY: 2,
          SEALED: 3,
          SUBMITTED: 1,
          ON_HOLD: 0,
          ACCEPTED: 0,
          REJECTED: 0,
          ARCHIVED: 0,
        }}
      />,
    );

    expect(screen.getByText('Shipments')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Manage shipments/i })).toHaveAttribute('href', '/packages');
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('shows accepted and rejected only when non-zero', () => {
    const { rerender } = render(
      <ExporterShipmentOverview
        packagesByStatus={{
          DRAFT: 0,
          READY: 0,
          SEALED: 1,
          SUBMITTED: 0,
          ON_HOLD: 0,
          ACCEPTED: 0,
          REJECTED: 0,
          ARCHIVED: 0,
        }}
      />,
    );
    expect(screen.queryByText('Accepted')).not.toBeInTheDocument();

    rerender(
      <ExporterShipmentOverview
        packagesByStatus={{
          DRAFT: 0,
          READY: 0,
          SEALED: 1,
          SUBMITTED: 0,
          ON_HOLD: 0,
          ACCEPTED: 2,
          REJECTED: 1,
          ARCHIVED: 0,
        }}
      />,
    );
    expect(screen.getAllByText('Accepted').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Rejected').length).toBeGreaterThan(0);
  });
});
