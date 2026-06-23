import { beforeEach, describe, expect, it, vi } from 'vitest';

const sentryMocks = vi.hoisted(() => ({
  isSentryEnabled: vi.fn(() => true),
  reportErrorToSentry: vi.fn(),
}));

vi.mock('@/features/observability/sentryClient', () => sentryMocks);

import { classifyError, clearErrorLog, getErrorLog, logError } from './ErrorLogger';

describe('logError Sentry bridge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearErrorLog();
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

  it('classifies rate limit errors', () => {
    const classified = classifyError(new Error('Too many requests'), { statusCode: 429 });
    expect(classified.code).toBe('RATE_LIMITED');
  });

  it('does not log rate-limit errors to console, memory, or Sentry', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    logError(new Error('Too many requests, please slow down.'), {
      statusCode: 429,
      context: 'fetchAudit',
    });
    logError(new Error('Too many requests, please slow down.'), {
      statusCode: 429,
      context: 'fetchAudit',
    });
    expect(getErrorLog(100).length).toBe(0);
    expect(consoleError).not.toHaveBeenCalled();
    expect(sentryMocks.reportErrorToSentry).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
