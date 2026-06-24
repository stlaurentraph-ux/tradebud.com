import { Logger } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';

export type PublicPreviewSurface = 'delivery_receipt' | 'delivery_trip' | 'campaign_invite';
export type PublicPreviewOutcome = 'found' | 'not_found' | 'invalid_ref';

const logger = new Logger('PublicPreview');

export function observePublicPreviewLookup(input: {
  surface: PublicPreviewSurface;
  ref: string;
  outcome: PublicPreviewOutcome;
  durationMs?: number;
}): void {
  logger.log(
    JSON.stringify({
      event: 'public_preview_lookup',
      surface: input.surface,
      ref: input.ref,
      outcome: input.outcome,
      durationMs: input.durationMs ?? null,
    }),
  );

  Sentry.addBreadcrumb({
    category: 'public_preview',
    message: `${input.surface}:${input.outcome}`,
    data: {
      ref: input.ref,
      durationMs: input.durationMs,
    },
    level: input.outcome === 'found' ? 'info' : 'warning',
  });
}
