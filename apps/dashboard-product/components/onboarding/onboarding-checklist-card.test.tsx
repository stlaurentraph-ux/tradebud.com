// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OnboardingChecklistCard } from './onboarding-checklist-card';

vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    user: {
      id: 'user-sponsor',
      active_role: 'sponsor',
    },
  }),
}));

vi.mock('@/lib/onboarding-context', () => ({
  useOnboarding: () => ({
    phase: 'checklist',
    config: {
      steps: [{ key: 'sp_overview' }],
    },
    completedSteps: {},
    resumeTour: vi.fn(),
    showChecklist: true,
  }),
}));

describe('OnboardingChecklistCard sponsor taxonomy', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('renders sponsor-specific checklist labels and ctas', () => {
    render(<OnboardingChecklistCard />);

    expect(screen.getByText('Finish sponsor overview')).toBeInTheDocument();
    expect(screen.getByText('Map organisations')).toBeInTheDocument();
    expect(screen.getByText('Launch programme campaign')).toBeInTheDocument();

    expect(screen.getByRole('link', { name: 'Open overview' })).toBeInTheDocument();
  });
});
