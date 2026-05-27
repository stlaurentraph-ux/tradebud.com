// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NewRequestWizardDialog } from './new-request-wizard-dialog';

vi.mock('@/lib/onboarding-actions', () => ({
  markOnboardingAction: vi.fn(),
}));

vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    user: { active_role: 'sponsor' },
  }),
}));

describe('NewRequestWizardDialog campaign mode taxonomy', () => {
  it('renders campaign labels in step 1', () => {
    render(
      <NewRequestWizardDialog
        open
        onOpenChange={vi.fn()}
        onComplete={vi.fn()}
        mode="campaign"
        title="New Programme Campaign"
        description="Launch a sponsor programme campaign"
      />
    );

    expect(screen.getByText('New Programme Campaign')).toBeInTheDocument();
    expect(screen.getByText('Launch a sponsor programme campaign')).toBeInTheDocument();
    expect(screen.getByText('Campaign Type')).toBeInTheDocument();
    expect(screen.getByText('What campaign are you launching?')).toBeInTheDocument();
  });
});
// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NewRequestWizardDialog } from './new-request-wizard-dialog';

vi.mock('@/lib/onboarding-actions', () => ({
  markOnboardingAction: vi.fn(),
}));

describe('NewRequestWizardDialog campaign mode taxonomy', () => {
  it('renders campaign labels in step 1', () => {
    render(
      <NewRequestWizardDialog
        open
        onOpenChange={vi.fn()}
        onComplete={vi.fn()}
        mode="campaign"
        title="New Programme Campaign"
        description="Launch a sponsor programme campaign"
      />
    );

    expect(screen.getByText('New Programme Campaign')).toBeInTheDocument();
    expect(screen.getByText('Launch a sponsor programme campaign')).toBeInTheDocument();
    expect(screen.getByText('Campaign Type')).toBeInTheDocument();
    expect(screen.getByText('What campaign are you launching?')).toBeInTheDocument();
  });
});
