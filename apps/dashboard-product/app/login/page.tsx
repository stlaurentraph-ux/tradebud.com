'use client';

import { useContext, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AuthBrandHeader } from '@/components/brand/auth-brand-header';
import { useAuth } from '@/lib/auth-context';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LocaleContext } from '@/lib/locale-context';
import { getAuthCopy } from '@/lib/workflow-terminology-labels';
import { buildCreateAccountHrefFromSearchParams } from '@/lib/supplier-campaign-redirect';
import { SearchParamsPageBoundary } from '@/components/routing/search-params-page-boundary';

export default function LoginPage() {
  return (
    <SearchParamsPageBoundary>
      <LoginPageContent />
    </SearchParamsPageBoundary>
  );
}

function LoginPageContent() {
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const intent = searchParams.get('intent');
  const recorded = searchParams.get('recorded') === '1';
  const emailConfirmed = searchParams.get('confirmed') === '1';
  const intentLabel =
    intent === 'accept'
      ? getAuthCopy('intent_accept', t)
      : intent === 'refuse'
        ? getAuthCopy('intent_refuse', t)
        : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setIsLoading(true);

    try {
      await login(email, password);
      const nextPath = searchParams.get('next');
      const safeNext = nextPath && nextPath.startsWith('/') ? nextPath : '/';
      router.push(safeNext);
    } catch (err: unknown) {
      setIsLoading(false);
      const message = err instanceof Error ? err.message : 'Login failed';
      if (message.toLowerCase().includes('invalid login credentials')) {
        setError(getAuthCopy('error_invalid_credentials', t));
      } else if (message.toLowerCase().includes('email not confirmed')) {
        setError(getAuthCopy('error_email_not_confirmed', t));
      } else {
        setError(message);
      }
    }
  };

  const handleForgotPassword = async () => {
    setError(null);
    setNotice(null);
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError(getAuthCopy('error_forgot_password_email', t));
      return;
    }

    const client = getSupabaseBrowserClient();
    if (!client) {
      setError(getAuthCopy('error_reset_unavailable', t));
      return;
    }

    setIsResettingPassword(true);
    try {
      const redirectTo =
        typeof window !== 'undefined'
          ? `${window.location.origin}/auth/confirm`
          : 'https://dashboard.tracebud.com/auth/confirm';
      const { error: resetError } = await client.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo,
      });
      if (resetError) {
        throw resetError;
      }
      setNotice(getAuthCopy('reset_notice', t, { email: trimmedEmail }));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : getAuthCopy('error_reset_send', t));
    } finally {
      setIsResettingPassword(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <AuthBrandHeader />

        <Card className="border-border bg-card">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl">{getAuthCopy('login_title', t)}</CardTitle>
            <CardDescription>{getAuthCopy('login_subtitle', t)}</CardDescription>
            {emailConfirmed ? (
              <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                {getAuthCopy('email_confirmed', t)}
              </div>
            ) : null}
            {intentLabel ? (
              <div className="mt-3 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
                {recorded
                  ? getAuthCopy('intent_recorded', t, { intent: intentLabel })
                  : getAuthCopy('intent_pending', t, { intent: intentLabel })}
              </div>
            ) : null}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  {getAuthCopy('field_email', t)}
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder={getAuthCopy('placeholder_email', t)}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-secondary"
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-medium text-foreground">
                    {getAuthCopy('field_password', t)}
                  </label>
                  <button
                    type="button"
                    className="text-xs font-medium text-primary hover:underline disabled:opacity-50"
                    onClick={() => void handleForgotPassword()}
                    disabled={isLoading || isResettingPassword}
                  >
                    {isResettingPassword
                      ? getAuthCopy('forgot_password_sending', t)
                      : getAuthCopy('forgot_password', t)}
                  </button>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder={getAuthCopy('placeholder_password', t)}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-secondary"
                  required
                />
              </div>

              {notice ? (
                <div className="rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-800">{notice}</div>
              ) : null}

              {error ? (
                <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
              ) : null}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? getAuthCopy('signing_in', t) : getAuthCopy('sign_in', t)}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                {getAuthCopy('new_to_tracebud', t)}{' '}
                <Link href={buildCreateAccountHrefFromSearchParams(searchParams)} className="font-medium text-primary hover:underline">
                  {getAuthCopy('create_workspace', t)}
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
