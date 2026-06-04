'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const intent = searchParams.get('intent');
  const recorded = searchParams.get('recorded') === '1';
  const emailConfirmed = searchParams.get('confirmed') === '1';
  const intentLabel =
    intent === 'accept'
      ? 'accept this request'
      : intent === 'refuse'
        ? 'refuse this request'
        : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password);
      const nextPath = searchParams.get('next');
      const safeNext = nextPath && nextPath.startsWith('/') ? nextPath : '/';
      const profileRes = await fetch('/api/launch/commercial-profile', {
        cache: 'no-store',
        headers: { Authorization: `Bearer ${sessionStorage.getItem('tracebud_token') ?? ''}` },
      });
      const profilePayload = (await profileRes.json().catch(() => ({}))) as {
        profile?: { organization_name?: string | null; country?: string | null; primary_role?: string | null };
      };
      const profile = profilePayload.profile;
      const workspaceComplete =
        Boolean(profile?.organization_name?.trim()) &&
        Boolean(profile?.country?.trim()) &&
        Boolean(profile?.primary_role?.trim());
      if (!workspaceComplete) {
        router.push('/create-account?resume=workspace');
        return;
      }
      router.push(safeNext);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <Image
            src="/tracebud-logo-v6.png"
            alt="Tracebud"
            width={64}
            height={64}
            className="rounded-xl mb-4"
          />
          <h1 className="text-2xl font-bold text-[#064E3B]">Tracebud</h1>
          <p className="text-sm text-muted-foreground">EUDR Compliance Platform</p>
        </div>

        <Card className="border-border bg-card">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl">Sign in to your account</CardTitle>
            <CardDescription>
              Enter your credentials to access your Tracebud workspace
            </CardDescription>
            {emailConfirmed ? (
              <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                Your email is confirmed. Sign in with your password to continue.
              </div>
            ) : null}
            {intentLabel ? (
              <div className="mt-3 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
                {recorded
                  ? (
                    <>
                      Your email action to <strong>{intentLabel}</strong> was recorded. Sign in to continue your
                      compliance workflow.
                    </>
                  )
                  : (
                    <>
                      You clicked an email action to <strong>{intentLabel}</strong>. Sign in to confirm and continue
                      your compliance workflow.
                    </>
                  )}
              </div>
            ) : null}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-secondary"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-secondary"
                  required
                />
              </div>

              {error && (
                <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                New to Tracebud?{' '}
                <Link href="/create-account" className="font-medium text-primary hover:underline">
                  Create workspace
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
