import { describe, expect, it } from 'vitest';
import { buildDeliveryQrUrl, buildDeliveryTripQrUrl, generateDeliveryTripRef } from './buildDeliveryQrUrl';

describe('buildDeliveryQrUrl', () => {
  it('builds tracebud smart-link URLs', () => {
    expect(buildDeliveryQrUrl('V-TEST1234')).toBe('https://tracebud.com/d/V-TEST1234');
  });

  it('builds trip smart-link URLs', () => {
    const tripRef = generateDeliveryTripRef();
    expect(tripRef.startsWith('T-')).toBe(true);
    expect(buildDeliveryTripQrUrl(tripRef)).toBe(`https://tracebud.com/t/${tripRef}`);
  });
});
