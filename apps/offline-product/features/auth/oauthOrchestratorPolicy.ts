export type OAuthRuntimePlatform = 'ios' | 'android' | 'web';

export type GoogleNativeBrowserFallbackInput = {
  platform: OAuthRuntimePlatform;
  isDev: boolean;
  isSimulatorInDev: boolean;
  /** False when the installed APK cannot handle com.googleusercontent.apps.*:/oauth2redirect. */
  androidNativeRedirectInstalled?: boolean;
};

export function shouldAllowGoogleNativeBrowserFallback(
  input: GoogleNativeBrowserFallbackInput,
): boolean {
  if (input.platform === 'android') {
    if (input.androidNativeRedirectInstalled === false) {
      return input.isDev;
    }
    return input.isDev && input.isSimulatorInDev;
  }
  if (input.platform === 'ios' && !input.isDev) return true;
  if (input.isDev && input.isSimulatorInDev) return true;
  return false;
}

export type OAuthColdStartStatus =
  | 'delivered_to_waiter'
  | 'already_signed_in'
  | 'exit_to_home'
  | 'needs_session_exchange';

export function resolveOAuthColdStartPhase(input: {
  url: string | null;
  deliveredToWaiter: boolean;
  hasSession: boolean;
}): OAuthColdStartStatus {
  if (input.deliveredToWaiter) return 'delivered_to_waiter';
  if (input.hasSession) return 'already_signed_in';
  if (!input.url) return 'exit_to_home';
  return 'needs_session_exchange';
}
