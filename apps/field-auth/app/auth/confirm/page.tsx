'use client';

import { useEffect, useState } from 'react';

import { AuthStatusCard } from '@/components/auth-status-card';
import {
  buildForwardedAuthUrl,
  parseHashParams,
  resolveAppRedirect,
} from '@/lib/forward-to-field-app';

type ConfirmStatus = 'loading' | 'forwarding' | 'confirmed' | 'error';

/**
 * Email confirmation landing for field-app signups (emailRedirectTo).
 */
export default function AuthConfirmPage() {
  const [status, setStatus] = useState<ConfirmStatus>('loading');
  const [detail, setDetail] = useState('Confirming your email…');

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const hashParams = parseHashParams(window.location.hash);

    const authError = search.get('error') ?? hashParams.error;
    const authErrorDescription = search.get('error_description') ?? hashParams.error_description;
    if (authError) {
      setStatus('error');
      setDetail(authErrorDescription ?? authError);
      window.history.replaceState(null, '', window.location.pathname);
      return;
    }

    const accessToken = hashParams.access_token;
    const code = search.get('code');
    const appRedirect = resolveAppRedirect(search.get('app_redirect'));

    if (accessToken || code) {
      try {
        const target = buildForwardedAuthUrl({
          appRedirect,
          searchParams: search,
          hashParams,
        });
        setStatus('forwarding');
        setDetail('Email confirmed. Opening the Tracebud app…');
        window.location.replace(target);
        return;
      } catch {
        // PKCE code without a forwardable session — user signs in manually in app.
      }
    }

    if (code || accessToken) {
      setStatus('confirmed');
      setDetail(
        'Your email is confirmed. Open the Tracebud app and sign in from Settings with your email and password.',
      );
      window.history.replaceState(null, '', window.location.pathname);
      return;
    }

    setStatus('error');
    setDetail(
      'This confirmation link is invalid or has expired. Sign in from the app if you already confirmed your email.',
    );
  }, []);

  const title =
    status === 'loading'
      ? 'Confirming your email'
      : status === 'forwarding'
        ? 'Email confirmed'
        : status === 'confirmed'
          ? 'Email confirmed'
          : 'Confirmation problem';

  return (
    <AuthStatusCard
      title={title}
      detail={detail}
      loading={status === 'loading' || status === 'forwarding'}
      error={status === 'error'}
      footer={
        status === 'confirmed'
          ? 'Tracebud field app → Settings → Sign in'
          : status === 'forwarding'
            ? 'If the app does not open, switch back to Tracebud manually.'
            : undefined
      }
    />
  );
}
