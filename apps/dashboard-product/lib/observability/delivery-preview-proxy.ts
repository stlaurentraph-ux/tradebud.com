import * as Sentry from '@sentry/nextjs';

import { isSentryEnabled } from '@/lib/observability/sentry-options';

type DeliveryPreviewProxyContext = {
  route: 'delivery-preview' | 'delivery-trip-preview';
  ref: string;
  status: number;
};

export function reportDeliveryPreviewProxyOutcome(context: DeliveryPreviewProxyContext): void {
  if (!isSentryEnabled()) return;
  if (context.status < 400) return;

  const outcome =
    context.status === 404 ? 'not_found' : context.status === 429 ? 'rate_limited' : 'error';

  Sentry.addBreadcrumb({
    category: 'delivery_intake',
    message: `delivery_preview_proxy_${outcome}`,
    level: context.status === 429 ? 'warning' : 'info',
    data: {
      route: context.route,
      ref: context.ref,
      status: context.status,
    },
  });

  Sentry.setTag('delivery_preview_outcome', outcome);
}
