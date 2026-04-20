import { describe, expect, it } from 'vitest';
import {
  EUDR_DDS_STATUS_ERROR_FILENAME_TIMESTAMP_TOKEN,
  buildEudrDdsStatusErrorFilename,
  serializeEudrDdsStatusErrorContext,
} from './eudr-dds-status-error-context';

describe('eudr-dds-status-error-context', () => {
  it('builds deterministic filename from reference and timestamp token', () => {
    expect(buildEudrDdsStatusErrorFilename('TB-REF-123', EUDR_DDS_STATUS_ERROR_FILENAME_TIMESTAMP_TOKEN)).toBe(
      'eudr-dds-status-error-TB-REF-123-<timestamp>.json',
    );
  });

  it('exposes timestamp placeholder token for consistent UI copy', () => {
    expect(EUDR_DDS_STATUS_ERROR_FILENAME_TIMESTAMP_TOKEN).toBe('<timestamp>');
  });

  it('serializes context payload with stable shape', () => {
    expect(
      serializeEudrDdsStatusErrorContext({
        message: 'EUDR returned malformed status payload.',
        occurredAt: '2026-04-20T13:43:00.000Z',
        referenceNumber: 'TB-REF-123',
      }),
    ).toEqual({
      message: 'EUDR returned malformed status payload.',
      occurredAt: '2026-04-20T13:43:00.000Z',
      referenceNumber: 'TB-REF-123',
    });
  });
});
