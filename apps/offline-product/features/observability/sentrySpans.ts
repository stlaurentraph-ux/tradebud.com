import { sanitizeAnalyticsProperties } from '@/features/security/sanitizeLogContext';

import { isSentryEnabled, Sentry } from './sentryClient';

export type SentrySpanAttributeValue = string | number | boolean;

export type SentrySpanConfig = {
  name: string;
  op: string;
  attributes?: Record<string, unknown>;
};

const SPAN_STATUS_ERROR = 2;

function toSpanAttributes(
  attributes?: Record<string, unknown>,
): Record<string, SentrySpanAttributeValue> | undefined {
  const safe = sanitizeAnalyticsProperties(attributes);
  if (!safe) return undefined;

  const out: Record<string, SentrySpanAttributeValue> = {};
  for (const [key, value] of Object.entries(safe)) {
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      out[key] = value;
    } else if (value != null) {
      out[key] = String(value);
    }
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function applySpanAttributes(
  span: { setAttribute: (key: string, value: SentrySpanAttributeValue) => void },
  attributes?: Record<string, unknown>,
): void {
  const mapped = toSpanAttributes(attributes);
  if (!mapped) return;
  for (const [key, value] of Object.entries(mapped)) {
    span.setAttribute(key, value);
  }
}

/** Runs async work inside a Sentry span when the client is initialized. */
export async function withSentrySpan<T>(
  config: SentrySpanConfig,
  fn: (span: { setAttribute: (key: string, value: SentrySpanAttributeValue) => void }) => Promise<T>,
): Promise<T> {
  if (!isSentryEnabled()) {
    const noopSpan = { setAttribute: () => undefined };
    return fn(noopSpan);
  }

  return Sentry.startSpan(
    {
      name: config.name,
      op: config.op,
      attributes: toSpanAttributes(config.attributes),
    },
    async (span) => {
      try {
        return await fn(span);
      } catch (error) {
        span.setStatus({
          code: SPAN_STATUS_ERROR,
          message: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
  );
}

/** Annotates the active span (no-op when Sentry is off or no span is active). */
export function annotateActiveSentrySpan(attributes: Record<string, unknown>): void {
  if (!isSentryEnabled()) return;
  const span = Sentry.getActiveSpan();
  if (!span) return;
  applySpanAttributes(span, attributes);
}

/** Marks the active span as failed for classified sync/oauth/boot issues. */
export function markActiveSentrySpanError(
  message: string,
  attributes?: Record<string, unknown>,
): void {
  if (!isSentryEnabled()) return;
  const span = Sentry.getActiveSpan();
  if (!span) return;
  if (attributes) {
    applySpanAttributes(span, attributes);
  }
  span.setStatus({ code: SPAN_STATUS_ERROR, message });
}
