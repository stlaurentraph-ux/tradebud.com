// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import FounderOsHomePage from './page';

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

vi.mock('@/lib/use-crm', () => ({
  useDailyActions: () => ({
    actions: [],
    isLoading: false,
    error: null,
    ensureDailyTarget: vi.fn(),
  }),
  useDailyActionHistory: () => ({
    actions: [
      { id: 'a1', action_date: '2026-04-14', completed: true },
      { id: 'a2', action_date: '2026-04-14', completed: true },
      { id: 'a3', action_date: '2026-04-14', completed: true },
      { id: 'a4', action_date: '2026-04-13', completed: true },
      { id: 'a5', action_date: '2026-04-13', completed: true },
      { id: 'a6', action_date: '2026-04-13', completed: true },
    ],
    isLoading: false,
    error: null,
  }),
  useOutreachActivity: () => ({
    activities: [],
    isLoading: false,
    error: null,
  }),
}));

vi.mock('@/lib/use-content', () => ({
  useContentCalendar: () => ({
    items: [
      { id: 'c1', channel: 'linkedin_post', scheduled_at: '2026-04-15T09:00:00.000Z' },
      { id: 'c2', channel: 'linkedin_post', scheduled_at: '2026-04-16T09:00:00.000Z' },
      { id: 'c3', channel: 'linkedin_post', scheduled_at: '2026-04-09T09:00:00.000Z' },
      { id: 'c4', channel: 'linkedin_post', scheduled_at: '2026-04-10T09:00:00.000Z' },
    ],
    isLoading: false,
    error: null,
    ensureWeeklyTarget: vi.fn(),
  }),
}));

describe('FounderOsHomePage', () => {
  it('shows outreach and publishing streak signals', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-14T10:00:00.000Z'));

    render(<FounderOsHomePage />);

    expect(screen.getByText(/Outreach streak: 1 weekday\(s\)/)).toBeInTheDocument();
    expect(screen.getByText(/Publishing streak: 2 week\(s\)/)).toBeInTheDocument();

    vi.useRealTimers();
  });
});
