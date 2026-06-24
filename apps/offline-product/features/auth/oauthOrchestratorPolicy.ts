export type OAuthRuntimePlatform = 'ios' | 'android' | 'web';

export type GoogleNativeBrowserFallbackInput = {
  platform: OAuthRuntimePlatform;
  isDev: boolean;
  isSimulatorInDev: boolean;
};

export function shouldAllowGoogleNativeBrowserFallback(
  input: GoogleNativeBrowserFallbackInput,
): boolean {
  if (input.platform === 'android') return true;
  if (input.platform === 'ios' && !input.isDev) return true;
  if (input.isDev && input.isSimulatorInDev) return true;
  return false;
}

export type OAuthColdStartStatus =
  | 'missing_url'
  | 'delivered_to_waiter'
  | 'already_signed_in';

export function resolveOAuthColdStartPhase(input: {
  url: string | null;
  deliveredToWaiter: boolean;
  hasSession: boolean;
}): OAuthColdStartStatus | 'needs_session_exchange' {
  if (!input.url) return 'missing_url';
  if (input.deliveredToWaiter) return 'delivered_to_waiter';
  if (input.hasSession) return 'already_signed_in';
  return 'needs_session_exchange';
}
