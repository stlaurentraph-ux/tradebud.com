import { useLayoutEffect } from 'react';
import * as Linking from 'expo-linking';
import { router, usePathname } from 'expo-router';

import { isOAuthCallbackUrl } from '@/features/auth/oauthCallbackUrl';
import { clearOAuthLaunchExpected, isOAuthLaunchExpected } from '@/features/auth/oauthLaunchExpectation';
import { hasActiveOAuthCallbackWaiter } from '@/features/auth/oauthCallbackWaiter';

/**
 * Android restores the last route (/auth/callback) after OAuth attempts.
 * On a normal launcher open, bounce to home immediately — don't mount the callback flow.
 */
export function LauncherRouteReset() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    if (pathname !== '/auth/callback') return;

    let cancelled = false;
    void (async () => {
      if (hasActiveOAuthCallbackWaiter()) return;

      const initial = await Linking.getInitialURL();
      if (cancelled) return;
      if (initial && isOAuthCallbackUrl(initial)) return;
      if (await isOAuthLaunchExpected()) {
        if (hasActiveOAuthCallbackWaiter()) return;
        await clearOAuthLaunchExpected();
      }

      router.replace('/(tabs)');
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return null;
}
