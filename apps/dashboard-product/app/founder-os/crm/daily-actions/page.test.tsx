// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import FounderOsCrmDailyActionsPage from './page';

const emitAuditEventMock = vi.fn();
const markCompleteMock = vi.fn();

type MockAction = {
  id: string;
  action_type: string;
  priority: string;
  reason: string;
  completed: boolean;
  prospects?: { name?: string | null };
};

let actionsState: MockAction[] = [];

vi.mock('@/lib/audit-events', () => ({
  emitAuditEvent: (...args: unknown[]) => emitAuditEventMock(...args),
}));

vi.mock('@/lib/use-crm', () => ({
  useDailyActions: () => ({
    actions: actionsState,
    isLoading: false,
    error: null,
    reload: vi.fn(),
    ensureDailyTarget: vi.fn(),
    markComplete: (...args: unknown[]) => markCompleteMock(...args),
  }),
}));

describe('FounderOsCrmDailyActionsPage', () => {
  it('marks action complete and emits analytics event', async () => {
    actionsState = [
      {
        id: 'da_1',
        action_type: 'first_message',
        priority: 'high',
        reason: 'Daily target queue.',
        completed: false,
        prospects: { name: 'Alice' },
      },
    ];

    markCompleteMock.mockImplementation(async (id: string) => {
      actionsState = actionsState.map((action) =>
        action.id === id ? { ...action, completed: true } : action
      );
    });

    const user = userEvent.setup();
    const view = render(<FounderOsCrmDailyActionsPage />);
    await user.click(screen.getByRole('button', { name: 'Mark complete' }));

    await waitFor(() => expect(markCompleteMock).toHaveBeenCalledWith('da_1'));
    await waitFor(() =>
      expect(emitAuditEventMock).toHaveBeenCalledWith(
        expect.objectContaining({
          event_type: 'REQUEST_CAMPAIGN_RESPONSE_RECEIVED',
          entity_type: 'founder_os_daily_action',
          entity_id: 'da_1',
        })
      )
    );

    view.rerender(<FounderOsCrmDailyActionsPage />);

    expect(screen.getByText('done')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Mark complete' })).not.toBeInTheDocument();
  });
});
