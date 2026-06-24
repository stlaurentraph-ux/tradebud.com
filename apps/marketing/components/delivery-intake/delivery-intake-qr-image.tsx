'use client';

import { useMemo } from 'react';

type DeliveryIntakeQrImageProps = {
  value: string;
  size?: number;
  alt: string;
};

/**
 * Read-only QR for marketing preview pages (same URL encoded on field receipts).
 */
export function DeliveryIntakeQrImage({ value, size = 168, alt }: DeliveryIntakeQrImageProps) {
  const src = useMemo(() => {
    const params = new URLSearchParams({
      size: `${size}x${size}`,
      data: value,
      margin: '8',
      format: 'png',
    });
    return `https://api.qrserver.com/v1/create-qr-code/?${params.toString()}`;
  }, [size, value]);

  return (
    // eslint-disable-next-line @next/next/no-img-element -- external QR render service
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className="mx-auto rounded-md border border-border bg-white p-2"
    />
  );
}
