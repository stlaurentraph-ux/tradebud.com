import { track } from '@vercel/analytics';

const CONSENT_KEY = 'cookie-consent';

export type MarketingAnalyticsEvent =
  | 'marketing_waitlist_opened'
  | 'marketing_waitlist_submitted'
  | 'marketing_thank_you_viewed'
  | 'marketing_lead_submitted'
  | 'marketing_cta_clicked';

export type MarketingEventProps = Record<string, string | number | boolean>;

export function hasAnalyticsConsent(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(CONSENT_KEY) === 'accepted';
}

/** Fired by cookie banner when the user accepts or rejects. */
export function notifyAnalyticsConsentChanged(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event('cookie-consent-changed'));
}

export function trackMarketingEvent(
  event: MarketingAnalyticsEvent,
  properties?: MarketingEventProps,
): void {
  if (!hasAnalyticsConsent()) return;
  track(event, properties);
}
