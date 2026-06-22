import type { Href } from 'expo-router';

export function deliveryReceiptHref(
  receiptId: string,
  options?: { fresh?: boolean; from?: string; receiptsPlot?: string },
): Href {
  const params = new URLSearchParams();
  if (options?.fresh) params.set('fresh', '1');
  if (options?.from) params.set('from', options.from);
  if (options?.receiptsPlot?.trim()) params.set('receiptsPlot', options.receiptsPlot.trim());
  const query = params.toString();
  return `/receipt/${encodeURIComponent(receiptId)}${query ? `?${query}` : ''}` as Href;
}
