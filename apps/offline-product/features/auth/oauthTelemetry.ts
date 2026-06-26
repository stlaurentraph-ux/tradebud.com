import { ANALYTICS_EVENTS, trackEvent } from '@/features/observability/analytics';
import type { OAuthFlowPath, OAuthFlowStep } from '@/features/auth/oauthFlowError';
import { getOAuthErrorContext } from '@/features/auth/oauthFlowError';
import type { OAuthProvider } from '@/features/auth/oauthOrchestrator';

export function trackOAuthStep(
  step: OAuthFlowStep,
  properties: {
    provider: OAuthProvider;
    path: OAuthFlowPath;
    source?: string;
  },
): void {
  trackEvent(ANALYTICS_EVENTS.OAUTH_STEP, {
    step,
    provider: properties.provider,
    path: properties.path,
    ...(properties.source ? { source: properties.source } : {}),
  });
}

export function trackOAuthBrowserFallback(
  provider: OAuthProvider,
  nativeError: unknown,
): void {
  const ctx = getOAuthErrorContext(nativeError);
  trackEvent(ANALYTICS_EVENTS.OAUTH_BROWSER_FALLBACK, {
    provider,
    native_step: ctx.step,
    native_error: ctx.raw,
  });
}

export function trackOAuthFailure(
  provider: OAuthProvider,
  error: unknown,
  properties?: Record<string, unknown>,
): void {
  const ctx = getOAuthErrorContext(error);
  trackEvent(ANALYTICS_EVENTS.SIGN_IN_FAILURE, {
    method: provider,
    source: 'oauth',
    reason: ctx.raw,
    oauth_step: ctx.step,
    oauth_path: ctx.path,
    ...properties,
  });
}
