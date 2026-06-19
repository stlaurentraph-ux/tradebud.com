import { describe, expect, it } from 'vitest';

import { readHarvestSubmitQrCodeRef } from './resolveDeliveryQrCode';

describe('resolveDeliveryQrCode', () => {
  it('reads qr from harvest submit voucher payload', () => {
    expect(
      readHarvestSubmitQrCodeRef({
        voucher: { qr_code_ref: 'V-ABC12345' },
      }),
    ).toBe('V-ABC12345');
  });

  it('reads qr from top-level submit response', () => {
    expect(readHarvestSubmitQrCodeRef({ qr_code_ref: 'V-TOP12345' })).toBe('V-TOP12345');
  });

  it('returns null when submit response has no delivery qr', () => {
    expect(readHarvestSubmitQrCodeRef({ voucher: {} })).toBeNull();
    expect(readHarvestSubmitQrCodeRef(null)).toBeNull();
  });
});
