// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { ContactStatusPipeline } from './contact-status-pipeline';

describe('ContactStatusPipeline', () => {
  it('renders funnel dots for engaged status', () => {
    render(<ContactStatusPipeline status="engaged" />);
    expect(screen.getByTestId('contact-status-pipeline')).toHaveAttribute('data-status', 'engaged');
    expect(screen.getByText('Engaged')).toBeInTheDocument();
  });

  it('renders terminal badge for blocked contacts', () => {
    render(<ContactStatusPipeline status="blocked" />);
    expect(screen.queryByTestId('contact-status-pipeline')).not.toBeInTheDocument();
    expect(screen.getByText('Blocked')).toBeInTheDocument();
  });

  it('shows full step labels in full variant', () => {
    render(<ContactStatusPipeline status="submitted" variant="full" />);
    expect(screen.getByText('New')).toBeInTheDocument();
    expect(screen.getAllByText('Submitted').length).toBeGreaterThanOrEqual(1);
  });
});
