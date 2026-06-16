'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type ConfirmStatus = 'loading' | 'success' | 'sign_in_required' | 'error';

function parseHashParams(hash: string): Record<string, string> {
  const normalized = hash.startsWith('#') ? hash.slice(1) : hash;
  return Object.fromEntries(new URLSearchParams(normalized).entries());
}

export default function AuthConfirmPage() {
  const router = useRouter();
  const { hydrateSessionFromToken, isAuthenticated } = useAuth();
  const [status, setStatus] = useState<ConfirmStatus>('loading');
  const [detail, setDetail] = useState<string | null>(null);

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const hashParams = parseHashParams(window.location.hash);

    const error = search.get('error') ?? hashParams.error;
    const errorDescription = search.get('error_description') ?? hashParams.error_description;
    if (error) {
      setStatus('error');
      setDetail(errorDescription ?? error);
      window.history.replaceState(null, '', window.location.pathname);
      return;
    }

    const accessToken = hashParams.access_token;

    if (accessToken) {
      hydrateSessionFromToken(accessToken);
      setStatus('success');
      setDetail('Your email is confirmed. Continue setup or open your dashboard.');
      window.history.replaceState(null, '', window.location.pathname);
      return;
    }

    // PKCE / code-based redirects confirm the email but need password sign-in here.
    if (search.get('code')) {
      setStatus('sign_in_required');
      setDetail('Your email is confirmed. Sign in with the password you chose during signup.');
      window.history.replaceState(null, '', window.location.pathname);
      return;
    }

    setStatus('error');
    setDetail(
      'This confirmation link is invalid or has expired. Sign in if you already confirmed, or create a new workspace.',
    );
  }, [hydrateSessionFromToken]);

  const title =
    status === 'loading'
      ? 'Confirming your email'
      : status === 'success'
        ? 'Email confirmed'
        : status === 'sign_in_required'
          ? 'Email confirmed'
          : 'Confirmation problem';

  const Icon =
    status === 'loading' ? Loader2 : status === 'error' ? AlertCircle : CheckCircle2;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <Image
            src="/tracebud-logo-v6.png"
            alt="Tracebud"
            width={64}
            height={64}
            className="mb-4 rounded-xl"
          />
          <h1 className="text-2xl font-bold text-[#064E3B]">Tracebud</h1>
          <p className="text-sm text-muted-foreground">EUDR Compliance Platform</p>
        </div>

        <Card className="border-border bg-card">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Icon
                className={`h-5 w-5 ${status === 'loading' ? 'animate-spin text-muted-foreground' : status === 'error' ? 'text-destructive' : 'text-emerald-600'}`}
              />
              {title}
            </CardTitle>
            <CardDescription>
              {status === 'loading' ? 'Please wait while we verify your link.' : detail}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {status === 'success' && isAuthenticated ? (
              <>
                <Button className="w-full" onClick={() => router.push('/create-account')}>
                  Continue workspace setup
                </Button>
                <Button variant="outline" className="w-full" onClick={() => router.push('/')}>
                  Go to dashboard
                </Button>
              </>
            ) : null}
            {(status === 'sign_in_required' || status === 'error') && (
              <Button className="w-full" asChild>
                <Link href={status === 'sign_in_required' ? '/login?confirmed=1' : '/login'}>Sign in</Link>
              </Button>
            )}
            {status === 'error' ? (
              <Button variant="outline" className="w-full" asChild>
                <Link href="/create-account">Create workspace</Link>
              </Button>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
