import { describe, expect, it } from 'vitest';
import {
  buildDashboardClaimUrl,
  buildDeliveryQrUrl,
  buildDeliveryTripQrUrl,
  parseDeliveryIntakeRef,
  parseDeliveryTripRef,
} from './delivery-intake-qr';

describe('delivery-intake-qr', () => {
  it('parses voucher and trip refs from smart links', () => {
    expect(parseDeliveryIntakeRef('V-ABC12345')).toEqual({ kind: 'voucher', ref: 'V-ABC12345' });
    expect(parseDeliveryTripRef('https://tracebud.com/t/T-TRIP1234')).toBe('T-TRIP1234');
    expect(parseDeliveryIntakeRef('https://tracebud.com/t/T-TRIP1234')).toEqual({
      kind: 'trip',
      ref: 'T-TRIP1234',
    });
  });

  it('builds delivery, trip, and claim URLs', () => {
    expect(buildDeliveryQrUrl('V-TEST1234', 'https://tracebud.com/d')).toBe(
      'https://tracebud.com/d/V-TEST1234',
    );
    expect(buildDeliveryTripQrUrl('T-TRIP1234', 'https://tracebud.com/t')).toBe(
      'https://tracebud.com/t/T-TRIP1234',
    );
    expect(buildDashboardClaimUrl('T-TRIP1234', 'https://dashboard.tracebud.com')).toBe(
      'https://dashboard.tracebud.com/harvests?claim=T-TRIP1234',
    );
  });
});
