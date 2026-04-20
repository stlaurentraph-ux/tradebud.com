// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EvidenceRequirement } from './evidence-requirement';

describe('EvidenceRequirement', () => {
  it('renders autonomous reason-code remediation for blocking issues', () => {
    render(
      <EvidenceRequirement
        plotId="plot-1"
        plotName="South Field"
        requiredEvidence={[
          {
            id: 'ev-1',
            type: 'field_report',
            title: 'Field Inspection Report',
            status: 'rejected',
            date: '2024-01-20',
            source: '',
          },
        ]}
        missingEvidence={['Government Deforestation Clearance']}
      />,
    );

    expect(screen.getByText(/Autonomous check: fail/i)).toBeInTheDocument();
    expect(screen.getByText(/DOC_REJECTED:/)).toBeInTheDocument();
    expect(screen.getByText(/DOC_MISSING:/)).toBeInTheDocument();
    expect(screen.getAllByText(/Remediation:/).length).toBeGreaterThan(0);
  });
});
