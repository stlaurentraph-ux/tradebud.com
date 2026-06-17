// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PlotDetailFieldOperationsSection } from './plot-detail-field-operations-section';

const mockUseAuth = vi.fn();

vi.mock('@/lib/auth-context', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('@/lib/locale-context', () => ({
  LocaleContext: {
    Provider: ({ children }: { children: React.ReactNode }) => children,
  },
}));

vi.mock('@/components/plots/plot-assignment-lifecycle-panel', () => ({
  PlotAssignmentLifecyclePanel: () => <div>Assignment lifecycle panel</div>,
}));

describe('PlotDetailFieldOperationsSection', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockUseAuth.mockReturnValue({ user: { active_role: 'exporter' } });
  });

  it('is hidden for importer role', () => {
    mockUseAuth.mockReturnValue({ user: { active_role: 'importer' } });
    render(<PlotDetailFieldOperationsSection plotId="plot_1" />);
    expect(screen.queryByText('Advanced — Field operations')).not.toBeInTheDocument();
  });

  it('shows collapsed accordion for exporter and loads panel on expand', async () => {
    const user = userEvent.setup();
    render(<PlotDetailFieldOperationsSection plotId="plot_1" />);

    expect(screen.getByText('Advanced — Field operations')).toBeInTheDocument();
    expect(screen.queryByText('Assignment lifecycle panel')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Advanced — Field operations/i }));
    expect(screen.getByText('Assignment lifecycle panel')).toBeInTheDocument();
  });
});
