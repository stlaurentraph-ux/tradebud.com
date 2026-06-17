// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CsvImportWizard } from './csv-import-wizard';

vi.mock('@/lib/locale-context', () => ({
  LocaleContext: {
    Provider: ({ children }: { children: React.ReactNode }) => children,
  },
}));

describe('CsvImportWizard completion navigation', () => {
  it('calls onFinished when Done is clicked after a partial import', async () => {
    const onFinished = vi.fn();
    const onComplete = vi.fn().mockResolvedValue({
      success: 4,
      failed: 3,
      errors: [{ row: 2, field: 'general', message: 'Duplicate email' }],
    });
    const user = userEvent.setup();

    render(
      <CsvImportWizard
        importType="contacts"
        onComplete={onComplete}
        onCancel={vi.fn()}
        onFinished={onFinished}
      />,
    );

    const file = new File(
      ['Full Name,Email\nJane Doe,jane@test.com'],
      'suppliers.csv',
      { type: 'text/csv' },
    );
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Next/i })).toBeEnabled();
    });
    await user.click(screen.getByRole('button', { name: /Next/i }));
    await user.click(screen.getByRole('button', { name: /Import \d+ Records/i }));

    await waitFor(() => {
      expect(screen.getByText('Import Complete')).toBeInTheDocument();
    });

    expect(screen.getByText(/Row 2: Duplicate email/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /View directory/i }));
    expect(onFinished).toHaveBeenCalledTimes(1);
  });

  it('calls onFinished immediately when all rows import successfully', async () => {
    const onFinished = vi.fn();
    const onComplete = vi.fn().mockResolvedValue({ success: 2, failed: 0, errors: [] });
    const user = userEvent.setup();

    render(
      <CsvImportWizard
        importType="contacts"
        onComplete={onComplete}
        onCancel={vi.fn()}
        onFinished={onFinished}
      />,
    );

    const file = new File(
      ['Full Name,Email\nA,a@test.com\nB,b@test.com'],
      'suppliers.csv',
      { type: 'text/csv' },
    );
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Next/i })).toBeEnabled();
    });
    await user.click(screen.getByRole('button', { name: /Next/i }));
    await user.click(screen.getByRole('button', { name: /Import \d+ Records/i }));

    await waitFor(() => {
      expect(onFinished).toHaveBeenCalledTimes(1);
    });
  });
});
