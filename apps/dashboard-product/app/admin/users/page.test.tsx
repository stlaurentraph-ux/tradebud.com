// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import UserManagementPage from './page';

vi.mock('@/components/layout/app-header', () => ({
  AppHeader: ({ title, action }: { title: string; action?: React.ReactNode }) => (
    <div>
      <div>{title}</div>
      {action}
    </div>
  ),
}));

vi.mock('@/components/common/permission-gate', () => ({
  PermissionGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/lib/use-admin-data', () => ({
  useAdminData: () => ({
    organizations: [{ id: 'org_1', name: 'Tracebud Ops' }],
    users: [],
    isLoading: false,
    error: null,
  }),
}));

const inviteUserMock = vi.hoisted(() => vi.fn());
vi.mock('@/lib/admin-service', () => ({
  inviteUser: inviteUserMock,
}));

const markOnboardingActionMock = vi.hoisted(() => vi.fn());
vi.mock('@/lib/onboarding-actions', () => ({
  markOnboardingAction: markOnboardingActionMock,
}));

describe('Admin users onboarding smoke', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    inviteUserMock.mockReset();
    markOnboardingActionMock.mockReset();
    inviteUserMock.mockResolvedValue({
      id: 'usr_1',
      name: 'Ops User',
      email: 'ops@tracebud.test',
      organisation_id: 'org_1',
      roles: ['exporter'],
      status: 'PENDING',
      invited_at: new Date().toISOString(),
      last_login_at: null,
    });
  });

  it('marks onboarding when invite succeeds', async () => {
    render(<UserManagementPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Invite User' }));
    const dialog = await screen.findByRole('dialog');
    const scoped = within(dialog);
    fireEvent.change(scoped.getByPlaceholderText('user@example.com'), {
      target: { value: 'ops@tracebud.test' },
    });
    fireEvent.change(scoped.getByPlaceholderText('John Doe'), {
      target: { value: 'Ops User' },
    });
    const selects = scoped.getAllByRole('combobox');
    fireEvent.change(selects[1], { target: { value: 'org_1' } });
    fireEvent.click(scoped.getByRole('button', { name: 'Send Invitation' }));

    await waitFor(() => {
      expect(inviteUserMock).toHaveBeenCalled();
      expect(markOnboardingActionMock).toHaveBeenCalledWith('team_invited');
    });
  });
});
