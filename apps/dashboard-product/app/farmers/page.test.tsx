// @vitest-environment jsdom
import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import FarmersPage from './page';

const replace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
}));

const authState: { user: { active_role: string } | null } = {
  user: { active_role: 'cooperative' },
};

vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({ user: authState.user }),
}));

vi.mock('@/lib/contact-service', () => ({
  listContacts: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/lib/locale-context', () => ({
  LocaleContext: {
    Provider: ({ children }: { children: React.ReactNode }) => children,
  },
}));

vi.mock('@/components/layout/app-header', () => ({
  AppHeader: ({ title }: { title: string }) => <div>{title}</div>,
}));

describe('FarmersPage exporter redirect', () => {
  beforeEach(() => {
    replace.mockReset();
    authState.user = { active_role: 'exporter' };
  });

  it('redirects exporters to the suppliers contacts directory', async () => {
    render(<FarmersPage />);

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/contacts');
    });
  });
});
