'use client';

import { useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Users,
  Package,
  ShieldCheck,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { useOnboarding } from '@/lib/onboarding-context';
import { ONBOARDING_CONFIGS, type OnboardingPersona } from '@/lib/onboarding-config';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';

// ─────────────────────────────────────────────────────────────
// Role card content
// ─────────────────────────────────────────────────────────────

interface RoleCard {
  persona: OnboardingPersona;
  icon: React.ReactNode;
  highlights: string[];
  accentClass: string;
  borderClass: string;
  badgeClass: string;
}

const ROLE_CARDS: RoleCard[] = [
  {
    persona: 'cooperative',
    icon: <Users className="h-5 w-5" />,
    highlights: [
      'Register producers & plots',
      'Respond to exporter requests',
      'Upload harvest evidence',
    ],
    accentClass: 'bg-teal-50',
    borderClass: 'border-teal-200 ring-teal-500',
    badgeClass: 'bg-teal-100 text-teal-800',
  },
  {
    persona: 'exporter',
    icon: <Package className="h-5 w-5" />,
    highlights: [
      'Run producer and plot completion campaigns',
      'Build lineage-safe lots and batches',
      'Prepare and seal shipment packages',
    ],
    accentClass: 'bg-blue-50',
    borderClass: 'border-blue-200 ring-blue-500',
    badgeClass: 'bg-blue-100 text-blue-800',
  },
  {
    persona: 'importer',
    icon: <ShieldCheck className="h-5 w-5" />,
    highlights: [
      'Validate shipment and evidence readiness',
      'Run campaigns and fulfill inbound requests',
      'Generate declaration and reporting snapshots',
    ],
    accentClass: 'bg-violet-50',
    borderClass: 'border-violet-200 ring-violet-500',
    badgeClass: 'bg-violet-100 text-violet-800',
  },
];

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export function OnboardingWelcomeModal() {
  const { phase, persona, beginTour, dismissWelcome } = useOnboarding();
  const { user } = useAuth();
  const firstName = user?.name?.split(' ')[0] ?? 'there';

  const isOpen = phase === 'welcome';

  const handleBeginTour = useCallback(() => {
    beginTour();
  }, [beginTour]);

  const handleSkip = useCallback(() => {
    dismissWelcome();
  }, [dismissWelcome]);

  const matchedCard = ROLE_CARDS.find((c) => c.persona === persona);
  const config = persona ? ONBOARDING_CONFIGS[persona] : null;
  const stepCount = config?.steps.length ?? 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleSkip(); }}>
      <DialogContent
        className="max-w-2xl gap-0 overflow-hidden p-0"
        aria-describedby="welcome-description"
      >
        {/* Header band */}
        <div className="flex items-start gap-4 bg-primary px-6 py-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold text-white">
                Welcome to Tracebud, {firstName}
              </DialogTitle>
              <DialogDescription id="welcome-description" className="mt-0.5 text-sm text-white/75">
                {config?.tagline ?? 'Your workspace is ready. Take a quick guided tour to get up to speed.'}
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        {/* Body */}
        <div className="space-y-5 px-6 pb-6 pt-5">
          {/* Role confirmation */}
          {matchedCard && config ? (
            <div
              className={cn(
                'flex items-start gap-4 rounded-xl border p-4',
                matchedCard.accentClass,
                matchedCard.borderClass,
              )}
            >
              <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', 'bg-white/70')}>
                {matchedCard.icon}
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">{config.displayName}</span>
                  <Badge variant="secondary" className={cn('text-xs', matchedCard.badgeClass)}>
                    Your role
                  </Badge>
                </div>
                <ul className="space-y-1">
                  {matchedCard.highlights.map((h) => (
                    <li key={h} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-50" />
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}

          {/* Tour preview */}
          <div className="rounded-xl border border-border bg-muted/40 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Clock className="h-4 w-4 text-muted-foreground" />
              {stepCount}-step guided tour &mdash; takes about 3 minutes
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Each step highlights the exact area to click. You can skip at any time and resume later from your dashboard.
            </p>
          </div>

          {/* Step pills */}
          {config ? (
            <div className="flex flex-wrap gap-2">
              {config.steps.map((step, i) => (
                <span
                  key={step.key}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground"
                >
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                    {i + 1}
                  </span>
                  {step.label}
                </span>
              ))}
            </div>
          ) : null}

          {/* Actions */}
          <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="text-muted-foreground hover:text-foreground"
            >
              Continue later
            </Button>
            <Button size="sm" onClick={handleBeginTour} className="gap-1.5">
              Start guided tour
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
