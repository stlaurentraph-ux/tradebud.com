import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import AdminPage from './page';

export async function renderAdminWithStatusReadFailure() {
  vi.spyOn(global, 'fetch').mockResolvedValue(
    new Response(
      JSON.stringify({
        error: 'EUDR DDS status response was not valid JSON',
      }),
      {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      },
    ),
  );

  render(<AdminPage />);
  fireEvent.click(screen.getByRole('button', { name: 'Check Status' }));

  await waitFor(() => {
    expect(screen.getByRole('button', { name: 'Copy DDS status error context JSON' })).toBeInTheDocument();
  });
}

export async function renderAdminWithStatusReadSuccess() {
  vi.spyOn(global, 'fetch').mockResolvedValue(
    new Response(
      JSON.stringify({
        statusCode: 200,
        payload: {
          state: 'accepted',
          providerReference: 'TB-DEMO-IMPORT-001',
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    ),
  );

  render(<AdminPage />);
  fireEvent.click(screen.getByRole('button', { name: 'Check Status' }));

  await waitFor(() => {
    expect(screen.getByRole('button', { name: 'Download JSON' })).toBeInTheDocument();
  });
}

export function setupDownloadMocks() {
  const originalBlob = globalThis.Blob;
  const BlobMock = vi.fn().mockImplementation((parts: unknown[], options?: { type?: string }) => ({
    parts,
    type: options?.type ?? '',
    text: async () => parts.join(''),
  }));
  globalThis.Blob = BlobMock as unknown as typeof Blob;

  const originalCreateObjectURL = (URL as { createObjectURL?: (blob: Blob) => string }).createObjectURL;
  const originalRevokeObjectURL = (URL as { revokeObjectURL?: (url: string) => void }).revokeObjectURL;
  const createObjectURL = vi.fn().mockReturnValue('blob:mock-error-context');
  const revokeObjectURL = vi.fn();
  (URL as { createObjectURL: (blob: Blob) => string }).createObjectURL = createObjectURL;
  (URL as { revokeObjectURL: (url: string) => void }).revokeObjectURL = revokeObjectURL;

  const appendChild = vi.spyOn(document.body, 'appendChild');
  const removeChild = vi.spyOn(document.body, 'removeChild');
  const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

  const restore = () => {
    globalThis.Blob = originalBlob;
    if (originalCreateObjectURL) {
      (URL as { createObjectURL: (blob: Blob) => string }).createObjectURL = originalCreateObjectURL;
    } else {
      delete (URL as { createObjectURL?: (blob: Blob) => string }).createObjectURL;
    }
    if (originalRevokeObjectURL) {
      (URL as { revokeObjectURL: (url: string) => void }).revokeObjectURL = originalRevokeObjectURL;
    } else {
      delete (URL as { revokeObjectURL?: (url: string) => void }).revokeObjectURL;
    }
    appendChild.mockRestore();
    removeChild.mockRestore();
    click.mockRestore();
  };

  return {
    createObjectURL,
    revokeObjectURL,
    appendChild,
    removeChild,
    click,
    restore,
  };
}
