'use client';

import { useEffect, useMemo, useSyncExternalStore } from 'react';

import { AuthStatusCard } from '@/components/auth-status-card';
import {
  buildForwardedAuthUrl,
  parseHashParams,
  resolveAppRedirect,
} from '@/lib/forward-to-field-app';

function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

/**
 * OAuth return URL for the field app (Expo Go bridge + universal links).
 * Forwards ?code= or #access_token= to tracebudoffline:// or exp:// via app_redirect.
 */
export default function AuthCallbackPage() {
  const isClient = useIsClient();

  const outcome = useMemo(() => {
    if (!isClient) {
      return { detail: 'Returning to Tracebud…', error: false, target: null as string | null };
    }

    const search = new URLSearchParams(window.location.search);
    const hashParams = parseHashParams(window.location.hash);
    const appRedirect = resolveAppRedirect(search.get('app_redirect'));

    try {
      const target = buildForwardedAuthUrl({ appRedirect, searchParams: search, hashParams });
      return { detail: 'Opening the Tracebud app…', error: false, target };
    } catch {
      return {
        detail:
          'Sign-in did not complete. Close this tab and try again from the Tracebud app (Settings → Sign in).',
        error: true,
        target: null,
      };
    }
  }, [isClient]);

  useEffect(() => {
    if (outcome.target) {
      window.location.replace(outcome.target);
    }
  }, [outcome.target]);

  return (
    <AuthStatusCard
      title={outcome.error ? 'Sign-in problem' : 'Finishing sign-in'}
      detail={outcome.detail}
      loading={!outcome.error}
      error={outcome.error}
      footer={outcome.error ? undefined : 'If the app does not open, switch back to Tracebud manually.'}
    />
  );
}
