import { describe, expect, it } from 'vitest';
import { buildEudrDdsStatusErrorMessage, isMalformedEudrDdsStatusPayloadError } from './eudr-dds-status-feedback';

describe('buildEudrDdsStatusErrorMessage', () => {
  it('returns default error when message is missing', () => {
    expect(buildEudrDdsStatusErrorMessage({})).toBe('Failed to read EUDR DDS status.');
  });

  it('maps malformed payload error to operator guidance', () => {
    expect(
      buildEudrDdsStatusErrorMessage({ message: 'EUDR DDS status response was not valid JSON' }),
    ).toBe('EUDR returned malformed status payload. Retry the check or escalate to integration support.');
  });

  it('returns original message for non-mapped errors', () => {
    expect(buildEudrDdsStatusErrorMessage({ message: 'Backend timeout' })).toBe('Backend timeout');
  });

  it('detects malformed payload errors for UI hint branching', () => {
    expect(isMalformedEudrDdsStatusPayloadError({ message: 'EUDR DDS status response was not valid JSON' })).toBe(true);
    expect(isMalformedEudrDdsStatusPayloadError({ message: 'Backend timeout' })).toBe(false);
    expect(isMalformedEudrDdsStatusPayloadError({})).toBe(false);
  });
});
