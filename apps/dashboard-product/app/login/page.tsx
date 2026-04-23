'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ShieldCheck, Leaf, Globe, Users, Heart } from 'lucide-react';

const DEMO_ACCOUNTS = [
  {
    email: 'exporter@tracebud.com',
    role: 'Exporter',
    description: 'Full access to packages, plots, farmers',
    icon: Leaf,
  },
  {
    email: 'importer@tracebud.com',
    role: 'Importer',
    description: 'View assigned packages and compliance',
    icon: Globe,
  },
  {
    email: 'cooperative@tracebud.com',
    role: 'Cooperative',
    description: 'Manage member farmers and plots',
    icon: Users,
  },
  {
    email: 'reviewer@tracebud.com',
    role: 'Country Reviewer',
    description: 'Review and approve submissions',
    icon: ShieldCheck,
  },
  {
    email: 'sponsor@tracebud.com',
    role: 'Network Sponsor',
    description: 'Monitor sponsored producer network',
    icon: Heart,
  },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password);
      router.push('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('demo');
    setError(null);
    setIsLoading(true);

    try {
      await login(demoEmail, 'demo');
      router.push('/');
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
              Enter your credentials or select a demo account
            </CardDescription>
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
            </form>

            <div className="relative my-6">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                or use demo account
              </span>
            </div>

            <div className="space-y-2">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => handleDemoLogin(account.email)}
                  disabled={isLoading}
                  className="flex w-full items-center gap-3 rounded-lg border border-border bg-secondary/50 p-3 text-left transition-colors hover:bg-secondary disabled:opacity-50"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <account.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-foreground">{account.role}</div>
                    <div className="text-xs text-muted-foreground">{account.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link
            href="/create-account"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Create one
          </Link>
        </p>

        <p className="mt-2 text-center text-xs text-muted-foreground">
          Demo mode uses mock data. No real authentication required.
        </p>
      </div>
    </div>
  );
}
