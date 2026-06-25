import * as Linking from 'expo-linking';

import { isOAuthCallbackUrl } from '@/features/auth/oauthCallbackUrl';

/** Full poll for a real OAuth deep-link return (Android may deliver URL late). */
export const OAUTH_COLD_START_URL_POLL_MS = [0, 250, 500, 1000, 2000, 4000] as const;
export const OAUTH_COLD_START_URL_MAX_MS = 8_000;

/** Short probe when the app restored a stale /auth/callback route without a launch URL. */
export const STALE_OAUTH_CALLBACK_PROBE_MS = [0] as const;
export const STALE_OAUTH_CALLBACK_MAX_MS = 200;

export type ResolveOAuthColdStartUrlOptions = {
  maxMs?: number;
  pollDelaysMs?: readonly number[];
};

function isOAuthColdStartUrl(url: string | null | undefined): url is string {
  return Boolean(url && isOAuthCallbackUrl(url));
}

/**
 * Android often delivers the launch deep link after the first getInitialURL() read.
 * Poll and listen briefly before treating cold start as missing_url / exit_to_home.
 */
export async function resolveOAuthColdStartUrl(
  options: ResolveOAuthColdStartUrlOptions = {},
): Promise<string | null> {
  const maxMs = options.maxMs ?? OAUTH_COLD_START_URL_MAX_MS;
  const pollDelaysMs = options.pollDelaysMs ?? OAUTH_COLD_START_URL_POLL_MS;

  const initial = await Linking.getInitialURL();
  if (isOAuthColdStartUrl(initial)) return initial;

  return new Promise<string | null>((resolve) => {
    let settled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const subscription = Linking.addEventListener('url', (event) => {
      if (!isOAuthColdStartUrl(event.url)) return;
      finish(event.url);
    });

    const finish = (url: string | null) => {
      if (settled) return;
      settled = true;
      subscription.remove();
      if (timer) clearTimeout(timer);
      resolve(url);
    };

    timer = setTimeout(() => finish(null), maxMs);

    void (async () => {
      for (const delayMs of pollDelaysMs) {
        if (settled) return;
        if (delayMs > 0) {
          await new Promise((r) => setTimeout(r, delayMs));
        }
        if (settled) return;
        const polled = await Linking.getInitialURL();
        if (isOAuthColdStartUrl(polled)) {
          finish(polled);
          return;
        }
      }
    })();
  });
}

/** Pick short vs full cold-start URL wait based on whether a launch URL is already present. */
export async function resolveOAuthColdStartUrlForLaunch(initialPeek: string | null): Promise<string | null> {
  if (isOAuthColdStartUrl(initialPeek)) {
    return resolveOAuthColdStartUrl();
  }
  return resolveOAuthColdStartUrl({
    maxMs: STALE_OAUTH_CALLBACK_MAX_MS,
    pollDelaysMs: STALE_OAUTH_CALLBACK_PROBE_MS,
  });
}
