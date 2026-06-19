import type { Href } from 'expo-router';

export function deliveryReceiptHref(
  receiptId: string,
  options?: { fresh?: boolean; from?: string },
): Href {
  const params = new URLSearchParams();
  if (options?.fresh) params.set('fresh', '1');
  if (options?.from) params.set('from', options.from);
  const query = params.toString();
  return `/receipt/${encodeURIComponent(receiptId)}${query ? `?${query}` : ''}` as Href;
}
