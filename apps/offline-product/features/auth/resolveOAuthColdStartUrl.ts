import * as Linking from 'expo-linking';

import { isOAuthCallbackUrl } from '@/features/auth/oauthCallbackUrl';

const COLD_START_URL_POLL_MS = [0, 250, 500, 1000, 2000, 4000] as const;

function isOAuthColdStartUrl(url: string | null | undefined): url is string {
  return Boolean(url && isOAuthCallbackUrl(url));
}

/**
 * Android often delivers the launch deep link after the first getInitialURL() read.
 * Poll and listen briefly before treating cold start as missing_url / exit_to_home.
 */
export async function resolveOAuthColdStartUrl(maxMs = 8_000): Promise<string | null> {
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
      for (const delayMs of COLD_START_URL_POLL_MS) {
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
