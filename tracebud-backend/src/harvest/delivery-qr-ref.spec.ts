import { describe, expect, it } from '@jest/globals';
import { parseDeliveryQrRef, parseDeliveryTripRef } from './delivery-qr-ref';

describe('parseDeliveryQrRef', () => {
  it('accepts raw voucher codes', () => {
    expect(parseDeliveryQrRef('v-abc12345')).toBe('V-ABC12345');
  });

  it('extracts code from smart-link URLs', () => {
    expect(parseDeliveryQrRef('https://tracebud.com/d/V-TEST1234')).toBe('V-TEST1234');
    expect(parseDeliveryQrRef('https://dashboard.tracebud.com/d/V-TEST1234?claim=ignored')).toBe(
      'V-TEST1234',
    );
  });

  it('extracts claim query param from dashboard deep links', () => {
    expect(parseDeliveryQrRef('https://dashboard.tracebud.com/harvests?claim=V-CLAIM99')).toBe(
      'V-CLAIM99',
    );
  });

  it('parses trip refs from smart links', () => {
    expect(parseDeliveryTripRef('T-TRIP1234')).toBe('T-TRIP1234');
    expect(parseDeliveryTripRef('https://tracebud.com/t/T-TRIP1234')).toBe('T-TRIP1234');
  });

  it('returns null for unrelated input', () => {
    expect(parseDeliveryQrRef('hello')).toBeNull();
    expect(parseDeliveryQrRef('')).toBeNull();
  });
});
