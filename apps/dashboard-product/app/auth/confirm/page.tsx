'use client';

import { useContext, useEffect, useMemo, useState } from 'react';
import { AuthBrandHeader } from '@/components/brand/auth-brand-header';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LocaleContext } from '@/lib/locale-context';
import { getAuthCopy } from '@/lib/workflow-terminology-labels';

type ConfirmStatus = 'loading' | 'success' | 'sign_in_required' | 'error';

function parseHashParams(hash: string): Record<string, string> {
  const normalized = hash.startsWith('#') ? hash.slice(1) : hash;
  return Object.fromEntries(new URLSearchParams(normalized).entries());
}

export default function AuthConfirmPage() {
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const router = useRouter();
  const { hydrateSessionFromToken, isAuthenticated } = useAuth();
  const [status, setStatus] = useState<ConfirmStatus>('loading');
  const [providerError, setProviderError] = useState<string | null>(null);

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const hashParams = parseHashParams(window.location.hash);

    const error = search.get('error') ?? hashParams.error;
    const errorDescription = search.get('error_description') ?? hashParams.error_description;
    if (error) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional effect-driven state sync (async load / client hydration); React Compiler adoption tracked separately
      setStatus('error');
      setProviderError(errorDescription ?? error);
      window.history.replaceState(null, '', window.location.pathname);
      return;
    }

    const accessToken = hashParams.access_token;

    if (accessToken) {
      hydrateSessionFromToken(accessToken);
      setStatus('success');
      window.history.replaceState(null, '', window.location.pathname);
      return;
    }

    if (search.get('code')) {
      setStatus('sign_in_required');
      window.history.replaceState(null, '', window.location.pathname);
      return;
    }

    setStatus('error');
  }, [hydrateSessionFromToken]);

  const detail = useMemo(() => {
    if (status === 'loading') return getAuthCopy('confirm_loading_wait', t);
    if (providerError) return providerError;
    if (status === 'success') return getAuthCopy('confirm_success_session', t);
    if (status === 'sign_in_required') return getAuthCopy('confirm_sign_in_required_detail', t);
    return getAuthCopy('confirm_link_invalid', t);
  }, [status, providerError, t]);

  const title =
    status === 'loading'
      ? getAuthCopy('confirm_loading_title', t)
      : status === 'error'
        ? getAuthCopy('confirm_problem_title', t)
        : getAuthCopy('confirm_success_title', t);

  const Icon = status === 'loading' ? Loader2 : status === 'error' ? AlertCircle : CheckCircle2;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <AuthBrandHeader />

        <Card className="border-border bg-card">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Icon
                className={`h-5 w-5 ${status === 'loading' ? 'animate-spin text-muted-foreground' : status === 'error' ? 'text-destructive' : 'text-emerald-600'}`}
              />
              {title}
            </CardTitle>
            <CardDescription>{detail}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {status === 'success' && isAuthenticated ? (
              <>
                <Button className="w-full" onClick={() => router.push('/create-account')}>
                  {getAuthCopy('confirm_continue_setup', t)}
                </Button>
                <Button variant="outline" className="w-full" onClick={() => router.push('/')}>
                  {getAuthCopy('confirm_go_dashboard', t)}
                </Button>
              </>
            ) : null}
            {(status === 'sign_in_required' || status === 'error') && (
              <Button className="w-full" asChild>
                <Link href={status === 'sign_in_required' ? '/login?confirmed=1' : '/login'}>
                  {getAuthCopy('confirm_sign_in_cta', t)}
                </Link>
              </Button>
            )}
            {status === 'error' ? (
              <Button variant="outline" className="w-full" asChild>
                <Link href="/create-account">{getAuthCopy('confirm_create_workspace_cta', t)}</Link>
              </Button>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
