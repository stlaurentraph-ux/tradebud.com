'use client';

import { useEffect, useState } from 'react';

import { AuthStatusCard } from '@/components/auth-status-card';
import {
  buildForwardedAuthUrl,
  parseHashParams,
  resolveAppRedirect,
} from '@/lib/forward-to-field-app';

type ConfirmStatus = 'loading' | 'forwarding' | 'confirmed' | 'error';

type ConfirmState = {
  status: ConfirmStatus;
  detail: string;
  target: string | null;
  scrubUrl: boolean;
};

function readConfirmState(): ConfirmState {
  const search = new URLSearchParams(window.location.search);
  const hashParams = parseHashParams(window.location.hash);

  const authError = search.get('error') ?? hashParams.error;
  const authErrorDescription = search.get('error_description') ?? hashParams.error_description;
  if (authError) {
    return {
      status: 'error',
      detail: authErrorDescription ?? authError,
      target: null,
      scrubUrl: true,
    };
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
      return {
        status: 'forwarding',
        detail: 'Email confirmed. Opening the Tracebud app…',
        target,
        scrubUrl: false,
      };
    } catch {
      // PKCE code without a forwardable session — user signs in manually in app.
    }
  }

  if (code || accessToken) {
    return {
      status: 'confirmed',
      detail:
        'Your email is confirmed. Open the Tracebud app and sign in from Settings with your email and password.',
      target: null,
      scrubUrl: true,
    };
  }

  return {
    status: 'error',
    detail:
      'This confirmation link is invalid or has expired. Sign in from the app if you already confirmed your email.',
    target: null,
    scrubUrl: false,
  };
}

/**
 * Email confirmation landing for field-app signups (emailRedirectTo).
 */
export default function AuthConfirmPage() {
  const [state] = useState<ConfirmState>(() =>
    typeof window === 'undefined'
      ? { status: 'loading', detail: 'Confirming your email…', target: null, scrubUrl: false }
      : readConfirmState(),
  );

  useEffect(() => {
    if (state.scrubUrl) {
      window.history.replaceState(null, '', window.location.pathname);
    }
    if (state.target) {
      window.location.replace(state.target);
    }
  }, [state.scrubUrl, state.target]);

  const title =
    state.status === 'loading'
      ? 'Confirming your email'
      : state.status === 'forwarding'
        ? 'Email confirmed'
        : state.status === 'confirmed'
          ? 'Email confirmed'
          : 'Confirmation problem';

  return (
    <AuthStatusCard
      title={title}
      detail={state.detail}
      loading={state.status === 'loading' || state.status === 'forwarding'}
      error={state.status === 'error'}
      footer={
        state.status === 'confirmed'
          ? 'Tracebud field app → Settings → Sign in'
          : state.status === 'forwarding'
            ? 'If the app does not open, switch back to Tracebud manually.'
            : undefined
      }
    />
  );
}
