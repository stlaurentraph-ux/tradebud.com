'use client';

import { useEffect, useState } from 'react';

import { AuthStatusCard } from '@/components/auth-status-card';
import {
  buildForwardedAuthUrl,
  parseHashParams,
  resolveAppRedirect,
} from '@/lib/forward-to-field-app';

/**
 * OAuth return URL for the field app (Expo Go bridge + universal links).
 * Forwards ?code= or #access_token= to tracebudoffline:// or exp:// via app_redirect.
 */
export default function AuthCallbackPage() {
  const [detail, setDetail] = useState('Returning to Tracebud…');
  const [error, setError] = useState(false);

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const hashParams = parseHashParams(window.location.hash);
    const appRedirect = resolveAppRedirect(search.get('app_redirect'));

    try {
      const target = buildForwardedAuthUrl({ appRedirect, searchParams: search, hashParams });
      window.location.replace(target);
      setDetail('Opening the Tracebud app…');
    } catch {
      setError(true);
      setDetail(
        'Sign-in did not complete. Close this tab and try again from the Tracebud app (Settings → Sign in).',
      );
    }
  }, []);

  return (
    <AuthStatusCard
      title={error ? 'Sign-in problem' : 'Finishing sign-in'}
      detail={detail}
      loading={!error}
      error={error}
      footer={error ? undefined : 'If the app does not open, switch back to Tracebud manually.'}
    />
  );
}
