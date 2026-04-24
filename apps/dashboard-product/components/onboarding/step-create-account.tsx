'use client';

import { useState } from 'react';
import { Eye, EyeOff, Loader2, AlertCircle, ShieldCheck, Zap, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface CreateAccountData {
  email: string;
  password: string;
  fullName: string;
}

interface StepCreateAccountProps {
  data: CreateAccountData;
  onChange: (data: CreateAccountData) => void;
  onNext: () => Promise<void>;
  isSubmitting: boolean;
  error: string | null;
}

const TRUST_SIGNALS = [
  { icon: ShieldCheck, label: 'No credit card required' },
  { icon: Zap, label: 'Set up in under 1 minute' },
  { icon: Globe, label: 'EUDR-compliant from day one' },
];

export function StepCreateAccount({
  data,
  onChange,
  onNext,
  isSubmitting,
  error,
}: StepCreateAccountProps) {
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onNext();
  };

  return (
    <div className="space-y-6">
      {/* Value reinforcement */}
      <div className="rounded-xl border border-border bg-secondary/50 p-4">
        <p className="text-sm font-medium text-foreground mb-3">
          Join 200+ supply chain teams already managing EUDR compliance on Tracebud.
        </p>
        <div className="flex flex-wrap gap-4">
          {TRUST_SIGNALS.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Icon className="h-3.5 w-3.5 text-primary" />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full name</Label>
          <Input
            id="fullName"
            type="text"
            placeholder="Maria Santos"
            value={data.fullName}
            onChange={(e) => onChange({ ...data, fullName: e.target.value })}
            autoComplete="name"
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Work email</Label>
          <Input
            id="email"
            type="email"
            placeholder="maria@company.com"
            value={data.email}
            onChange={(e) => onChange({ ...data, email: e.target.value })}
            autoComplete="email"
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="At least 8 characters"
              value={data.password}
              onChange={(e) => onChange({ ...data, password: e.target.value })}
              autoComplete="new-password"
              minLength={8}
              required
              disabled={isSubmitting}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive" role="alert">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating account…
            </>
          ) : (
            'Create account'
          )}
        </Button>
      </form>

      <p className="text-center text-xs text-muted-foreground">
        By continuing, you agree to Tracebud&apos;s{' '}
        <a href="#" className="underline underline-offset-4 hover:text-foreground">Terms of Service</a>{' '}
        and{' '}
        <a href="#" className="underline underline-offset-4 hover:text-foreground">Privacy Policy</a>.
      </p>
    </div>
  );
}
