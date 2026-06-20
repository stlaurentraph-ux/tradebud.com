'use client';

import { useEffect, useMemo, useSyncExternalStore } from 'react';

import { AuthStatusCard } from '@/components/auth-status-card';
import {
  buildForwardedAuthUrl,
  parseHashParams,
  resolveAppRedirect,
} from '@/lib/forward-to-field-app';

type ConfirmStatus = 'loading' | 'forwarding' | 'confirmed' | 'error';

function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

type ConfirmOutcome = {
  status: ConfirmStatus;
  detail: string;
  target: string | null;
  clearUrl: boolean;
};

function resolveConfirmOutcome(isClient: boolean): ConfirmOutcome {
  if (!isClient) {
    return { status: 'loading', detail: 'Confirming your email…', target: null, clearUrl: false };
  }

  const search = new URLSearchParams(window.location.search);
  const hashParams = parseHashParams(window.location.hash);

  const authError = search.get('error') ?? hashParams.error;
  const authErrorDescription = search.get('error_description') ?? hashParams.error_description;
  if (authError) {
    return {
      status: 'error',
      detail: authErrorDescription ?? authError,
      target: null,
      clearUrl: true,
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
        clearUrl: false,
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
      clearUrl: true,
    };
  }

  return {
    status: 'error',
    detail:
      'This confirmation link is invalid or has expired. Sign in from the app if you already confirmed your email.',
    target: null,
    clearUrl: false,
  };
}

/**
 * Email confirmation landing for field-app signups (emailRedirectTo).
 */
export default function AuthConfirmPage() {
  const isClient = useIsClient();
  const outcome = useMemo(() => resolveConfirmOutcome(isClient), [isClient]);

  useEffect(() => {
    if (outcome.target) {
      window.location.replace(outcome.target);
      return;
    }
    if (outcome.clearUrl) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [outcome.clearUrl, outcome.target]);

  const title =
    outcome.status === 'loading'
      ? 'Confirming your email'
      : outcome.status === 'forwarding'
        ? 'Email confirmed'
        : outcome.status === 'confirmed'
          ? 'Email confirmed'
          : 'Confirmation problem';

  return (
    <AuthStatusCard
      title={title}
      detail={outcome.detail}
      loading={outcome.status === 'loading' || outcome.status === 'forwarding'}
      error={outcome.status === 'error'}
      footer={
        outcome.status === 'confirmed'
          ? 'Tracebud field app → Settings → Sign in'
          : outcome.status === 'forwarding'
            ? 'If the app does not open, switch back to Tracebud manually.'
            : undefined
      }
    />
  );
}
