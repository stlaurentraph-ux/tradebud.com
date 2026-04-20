// @vitest-environment jsdom
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderAdminWithStatusReadFailure, renderAdminWithStatusReadSuccess, setupDownloadMocks } from './test-helpers';

const { toastSuccess, toastError } = vi.hoisted(() => ({
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: toastSuccess,
    error: toastError,
  },
}));

vi.mock('@/components/layout/app-header', () => ({
  AppHeader: ({ title }: { title: string }) => <div>{title}</div>,
}));

vi.mock('@/lib/use-admin-data', () => ({
  useAdminData: () => ({
    organizations: [],
    users: [],
    isLoading: false,
    error: null,
  }),
}));

vi.mock('@/lib/use-gated-entry', () => ({
  DIAGNOSTICS_PRESETS: [],
  getTelemetryDebugCounters: () => ({ requests: 0 }),
  getTelemetryDebugEnabled: () => false,
  setTelemetryDebugEnabled: vi.fn(),
  subscribeTelemetryDebugCounters: () => () => undefined,
  useDashboardDiagnosticsSummary: () => ({
    summary: {
      tenantId: 'tenant_1',
      fromHours: 24,
      totalDiagnostics: 0,
      counters: {
        gatedEntryAttempts: 0,
        assignmentExportEvents: 0,
        riskScoreEvents: 0,
        filingActivityEvents: 0,
        chatActivityEvents: 0,
      },
      breakdown: {
        assignmentPhase: { requested: 0, succeeded: 0, failed: 0 },
        assignmentStatus: { active: 0, completed: 0, cancelled: 0 },
        riskBand: { low: 0, medium: 0, high: 0 },
        filingFamily: { generation: 0, submission: 0 },
        chatPhase: { created: 0, posted: 0, replayed: 0, resolved: 0, reopened: 0, archived: 0 },
      },
      readiness: { hasAnyDiagnostics: false, canExportDetailed: false, latestEventAt: null },
    },
    isLoading: false,
    error: null,
    reload: vi.fn(),
  }),
  useAssignmentExportEvents: () => ({ events: [], total: 0, isLoading: false, error: null, reload: vi.fn() }),
  useFilingActivityEvents: () => ({ events: [], total: 0, isLoading: false, error: null, reload: vi.fn() }),
  useGatedEntryEvents: () => ({ events: [], total: 0, isLoading: false, error: null, reload: vi.fn() }),
  useGatedEntryExportEvents: () => ({ events: [], isLoading: false, error: null, reload: vi.fn() }),
  useRiskScoreEvents: () => ({ events: [], total: 0, isLoading: false, error: null, reload: vi.fn() }),
  useWorkflowActivityEvents: () => ({ events: [], total: 0, isLoading: false, error: null, reload: vi.fn() }),
  useWebhookDeliveryEvents: () => ({ events: [], total: 0, isLoading: false, error: null, reload: vi.fn() }),
  useWebhookRegistrationEvents: () => ({ events: [], total: 0, isLoading: false, error: null, reload: vi.fn() }),
  useChatThreadActivityEvents: () => ({ events: [], total: 0, isLoading: false, error: null, reload: vi.fn() }),
}));

vi.mock('@/lib/demo-bootstrap', () => ({
  seedFirstCustomerWorkspace: vi.fn().mockResolvedValue({ ok: true }),
  resetDemoWorkspace: vi.fn().mockResolvedValue({ ok: true }),
}));

describe('AdminPage DDS status last-error accessibility labels', () => {
  beforeEach(() => {
    toastSuccess.mockReset();
    toastError.mockReset();
  });

  it('renders export-control accessible names after status-read failure', async () => {
    await renderAdminWithStatusReadFailure();

    expect(screen.getByRole('button', { name: 'Download DDS status error context JSON' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copy DDS status error export filename' })).toBeInTheDocument();
  });

  it('renders timestamp helper note after status-read failure', async () => {
    await renderAdminWithStatusReadFailure();

    expect(screen.getByText(/is replaced at download time\./)).toBeInTheDocument();
    expect(screen.getAllByText(/<timestamp>/).length).toBeGreaterThanOrEqual(1);
  });

  it('copies suggested filename and shows success toast', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(window.navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });

    await renderAdminWithStatusReadFailure();
    fireEvent.click(screen.getByRole('button', { name: 'Copy DDS status error export filename' }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(expect.stringContaining('eudr-dds-status-error-'));
      expect(toastSuccess).toHaveBeenCalledWith('EUDR status error filename copied to clipboard.');
    });
  });

  it('shows error toast when filename copy fails', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('clipboard denied'));
    Object.defineProperty(window.navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });

    await renderAdminWithStatusReadFailure();
    fireEvent.click(screen.getByRole('button', { name: 'Copy DDS status error export filename' }));

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Failed to copy EUDR status error filename.');
    });
  });

  it('shows error toast when error-context copy fails', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('clipboard denied'));
    Object.defineProperty(window.navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });

    await renderAdminWithStatusReadFailure();
    fireEvent.click(screen.getByRole('button', { name: 'Copy DDS status error context JSON' }));

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Failed to copy EUDR status error context.');
    });
  });

  it('copies error-context payload and shows success toast', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(window.navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });

    await renderAdminWithStatusReadFailure();
    fireEvent.click(screen.getByRole('button', { name: 'Copy DDS status error context JSON' }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalled();
      const [serializedPayload] = writeText.mock.calls.at(-1) ?? [];
      const payload = JSON.parse(String(serializedPayload));
      expect(payload).toEqual(
        expect.objectContaining({
          message: 'EUDR returned malformed status payload. Retry the check or escalate to integration support.',
          referenceNumber: 'TB-DEMO-IMPORT-001',
        }),
      );
      expect(typeof payload.occurredAt).toBe('string');
      expect(toastSuccess).toHaveBeenCalledWith('EUDR status error context copied to clipboard.');
    });
  });

  it('downloads error-context payload with expected filename and success toast', async () => {
    const { createObjectURL, revokeObjectURL, appendChild, removeChild, click, restore } = setupDownloadMocks();

    await renderAdminWithStatusReadFailure();
    fireEvent.click(screen.getByRole('button', { name: 'Download DDS status error context JSON' }));

    await waitFor(() => {
      expect(createObjectURL).toHaveBeenCalledTimes(1);
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-error-context');
      expect(toastSuccess).toHaveBeenCalledWith('EUDR status error context downloaded.');
    });

    const appendedAnchor = appendChild.mock.calls
      .map(([node]) => node)
      .find((node): node is HTMLAnchorElement => node instanceof HTMLAnchorElement);
    const [blobArg] = createObjectURL.mock.calls[0] ?? [];
    const serializedDownloadPayload = await (blobArg as { text: () => Promise<string> }).text();
    const downloadPayload = JSON.parse(serializedDownloadPayload);
    expect(appendedAnchor).toBeDefined();
    expect(appendedAnchor?.download).toMatch(/^eudr-dds-status-error-TB-DEMO-IMPORT-001-\d+\.json$/);
    expect(appendedAnchor?.href).toBe('blob:mock-error-context');
    expect(downloadPayload).toEqual(
      expect.objectContaining({
        message: 'EUDR returned malformed status payload. Retry the check or escalate to integration support.',
        referenceNumber: 'TB-DEMO-IMPORT-001',
      }),
    );
    expect(typeof downloadPayload.occurredAt).toBe('string');
    expect(removeChild).toHaveBeenCalledWith(appendedAnchor);
    expect(click).toHaveBeenCalled();

    restore();
  });

  it('downloads status payload JSON with expected filename, payload, and success toast', async () => {
    const { createObjectURL, revokeObjectURL, appendChild, removeChild, click, restore } = setupDownloadMocks();

    await renderAdminWithStatusReadSuccess();
    fireEvent.click(screen.getByRole('button', { name: 'Download JSON' }));

    await waitFor(() => {
      expect(createObjectURL).toHaveBeenCalledTimes(1);
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-error-context');
      expect(toastSuccess).toHaveBeenCalledWith('EUDR status payload downloaded.');
    });

    const appendedAnchor = appendChild.mock.calls
      .map(([node]) => node)
      .find((node): node is HTMLAnchorElement => node instanceof HTMLAnchorElement);
    const [blobArg] = createObjectURL.mock.calls[0] ?? [];
    const serializedDownloadPayload = await (blobArg as { text: () => Promise<string> }).text();
    const downloadPayload = JSON.parse(serializedDownloadPayload);
    expect(appendedAnchor).toBeDefined();
    expect(appendedAnchor?.download).toMatch(/^eudr-dds-status-TB-DEMO-IMPORT-001-\d+\.json$/);
    expect(appendedAnchor?.href).toBe('blob:mock-error-context');
    expect(downloadPayload).toEqual(
      expect.objectContaining({
        state: 'accepted',
        providerReference: 'TB-DEMO-IMPORT-001',
      }),
    );
    expect(removeChild).toHaveBeenCalledWith(appendedAnchor);
    expect(click).toHaveBeenCalled();

    restore();
  });

  it('shows status payload download control only after successful status read', async () => {
    expect(screen.queryByRole('button', { name: 'Download JSON' })).not.toBeInTheDocument();

    await renderAdminWithStatusReadSuccess();

    expect(screen.getByRole('button', { name: 'Download JSON' })).toBeInTheDocument();
    expect(toastSuccess).toHaveBeenCalledWith('EUDR DDS status read completed (status 200).');
  });
});
