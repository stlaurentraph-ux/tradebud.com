import { beforeEach, describe, expect, it, vi } from 'vitest';

const sentryMocks = vi.hoisted(() => ({
  isSentryEnabled: vi.fn(() => true),
  reportErrorToSentry: vi.fn(),
}));

vi.mock('@/features/observability/sentryClient', () => sentryMocks);

import { logError } from './ErrorLogger';

describe('logError Sentry bridge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sentryMocks.isSentryEnabled.mockReturnValue(true);
  });

  it('reports network errors to Sentry', () => {
    logError(new Error('Network request failed'), { context: 'harvest_submission' });
    expect(sentryMocks.reportErrorToSentry).toHaveBeenCalled();
  });

  it('skips validation errors', () => {
    logError(new Error('invalid harvest weight'), { context: 'harvest_submission' });
    expect(sentryMocks.reportErrorToSentry).not.toHaveBeenCalled();
  });
});
