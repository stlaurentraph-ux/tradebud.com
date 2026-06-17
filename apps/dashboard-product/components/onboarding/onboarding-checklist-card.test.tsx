// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OnboardingChecklistCard } from './onboarding-checklist-card';

const authState = {
  user: {
    id: 'user-sponsor',
    active_role: 'sponsor' as string,
  },
};

vi.mock('@/lib/auth-context', () => ({
  useAuth: () => authState,
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
    authState.user = { id: 'user-sponsor', active_role: 'sponsor' };
  });

  it('renders sponsor-specific checklist labels and ctas', () => {
    render(<OnboardingChecklistCard />);

    expect(screen.getByText('Finish sponsor overview')).toBeInTheDocument();
    expect(screen.getByText('Map organisations')).toBeInTheDocument();
    expect(screen.getByText('Launch programme campaign')).toBeInTheDocument();

    expect(screen.getByRole('link', { name: /Finish sponsor overview/i })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: /Launch programme campaign/i })).toHaveAttribute(
      'href',
      '/programmes?new=1',
    );
  });
});

describe('OnboardingChecklistCard producer/contact deep links', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('routes exporter add-producers step to the supplier CSV import', () => {
    authState.user = { id: 'user-exporter', active_role: 'exporter' };
    render(<OnboardingChecklistCard />);

    expect(screen.getByRole('link', { name: /Register suppliers/i })).toHaveAttribute(
      'href',
      '/contacts/add?mode=csv',
    );
  });

  it('routes cooperative member step to the member add wizard', () => {
    authState.user = { id: 'user-coop', active_role: 'cooperative' };
    render(<OnboardingChecklistCard />);

    expect(screen.getByRole('link', { name: /Build member directory/i })).toHaveAttribute(
      'href',
      '/contacts/add?mode=contact',
    );
  });

  it('routes importer network step to the contact add wizard', () => {
    authState.user = { id: 'user-importer', active_role: 'importer' };
    render(<OnboardingChecklistCard />);

    expect(screen.getByRole('link', { name: /Build network/i })).toHaveAttribute(
      'href',
      '/contacts/add?mode=contact',
    );
  });
});
