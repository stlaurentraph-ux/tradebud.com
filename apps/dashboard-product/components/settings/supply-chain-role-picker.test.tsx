// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SupplyChainRolePicker } from './supply-chain-role-picker';

describe('SupplyChainRolePicker', () => {
  it('applies cooperative + exporter preset', () => {
    const onChange = vi.fn();
    render(<SupplyChainRolePicker selected={['exporter']} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Cooperative + exporter' }));

    expect(onChange).toHaveBeenCalledWith(['cooperative', 'exporter']);
  });

  it('shows vertically integrated brand description for exporter + importer', () => {
    render(
      <SupplyChainRolePicker selected={['exporter', 'importer']} onChange={vi.fn()} showPresets={false} />,
    );

    expect(screen.getByText(/Vertically integrated brand/i)).toBeInTheDocument();
  });
});
