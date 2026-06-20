'use client';

import { useEffect, useState } from 'react';

import { AuthStatusCard } from '@/components/auth-status-card';
import {
  buildForwardedAuthUrl,
  parseHashParams,
  resolveAppRedirect,
} from '@/lib/forward-to-field-app';

type CallbackState = {
  detail: string;
  error: boolean;
  target: string | null;
};

function readCallbackState(): CallbackState {
  const search = new URLSearchParams(window.location.search);
  const hashParams = parseHashParams(window.location.hash);
  const appRedirect = resolveAppRedirect(search.get('app_redirect'));

  try {
    const target = buildForwardedAuthUrl({ appRedirect, searchParams: search, hashParams });
    return {
      detail: 'Opening the Tracebud app…',
      error: false,
      target,
    };
  } catch {
    return {
      detail:
        'Sign-in did not complete. Close this tab and try again from the Tracebud app (Settings → Sign in).',
      error: true,
      target: null,
    };
  }
}

/**
 * OAuth return URL for the field app (Expo Go bridge + universal links).
 * Forwards ?code= or #access_token= to tracebudoffline:// or exp:// via app_redirect.
 */
export default function AuthCallbackPage() {
  const [state] = useState<CallbackState>(() =>
    typeof window === 'undefined'
      ? { detail: 'Returning to Tracebud…', error: false, target: null }
      : readCallbackState(),
  );

  useEffect(() => {
    if (state.target) {
      window.location.replace(state.target);
    }
  }, [state.target]);

  return (
    <AuthStatusCard
      title={state.error ? 'Sign-in problem' : 'Finishing sign-in'}
      detail={state.detail}
      loading={!state.error}
      error={state.error}
      footer={state.error ? undefined : 'If the app does not open, switch back to Tracebud manually.'}
    />
  );
}
