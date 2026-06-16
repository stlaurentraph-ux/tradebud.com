'use client';

import { useCallback, useContext } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Users, Package, ShieldCheck, Building2, ArrowRight, Clock } from 'lucide-react';
import { useOnboarding } from '@/lib/onboarding-context';
import type { OnboardingPersona } from '@/lib/onboarding-config';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { LocaleContext } from '@/lib/locale-context';
import {
  getOnboardingWelcomeCopy,
  getOnboardingWelcomeHighlights,
} from '@/lib/workflow-terminology-labels';

interface RoleCard {
  persona: OnboardingPersona;
  icon: React.ReactNode;
  accentClass: string;
  borderClass: string;
  badgeClass: string;
}

const ROLE_CARDS: RoleCard[] = [
  {
    persona: 'cooperative',
    icon: <Users className="h-5 w-5" />,
    accentClass: 'bg-teal-50',
    borderClass: 'border-teal-200 ring-teal-500',
    badgeClass: 'bg-teal-100 text-teal-800',
  },
  {
    persona: 'exporter',
    icon: <Package className="h-5 w-5" />,
    accentClass: 'bg-blue-50',
    borderClass: 'border-blue-200 ring-blue-500',
    badgeClass: 'bg-blue-100 text-blue-800',
  },
  {
    persona: 'importer',
    icon: <ShieldCheck className="h-5 w-5" />,
    accentClass: 'bg-violet-50',
    borderClass: 'border-violet-200 ring-violet-500',
    badgeClass: 'bg-violet-100 text-violet-800',
  },
  {
    persona: 'sponsor',
    icon: <Building2 className="h-5 w-5" />,
    accentClass: 'bg-emerald-50',
    borderClass: 'border-emerald-200 ring-emerald-500',
    badgeClass: 'bg-emerald-100 text-emerald-800',
  },
];

export function OnboardingWelcomeModal() {
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const { phase, persona, config, beginTour, dismissWelcome } = useOnboarding();
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
  const stepCount = config?.steps.length ?? 0;
  const highlights = persona ? getOnboardingWelcomeHighlights(persona, t) : [];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleSkip(); }}>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0" aria-describedby="welcome-description">
        <div className="flex items-start gap-4 bg-primary px-6 py-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold text-white">
                {getOnboardingWelcomeCopy('title', t, { name: firstName })}
              </DialogTitle>
              <DialogDescription id="welcome-description" className="mt-0.5 text-sm text-white/75">
                {config?.tagline ?? getOnboardingWelcomeCopy('tagline_fallback', t)}
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        <div className="space-y-5 px-6 pb-6 pt-5">
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
                    {getOnboardingWelcomeCopy('your_role', t)}
                  </Badge>
                </div>
                <ul className="space-y-1">
                  {highlights.map((highlight) => (
                    <li key={highlight} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-50" />
                      {highlight}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}

          <div className="rounded-xl border border-border bg-muted/40 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Clock className="h-4 w-4 text-muted-foreground" />
              {getOnboardingWelcomeCopy('tour_preview', t, { count: stepCount })}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {getOnboardingWelcomeCopy('tour_preview_hint', t)}
            </p>
          </div>

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

          <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="text-muted-foreground hover:text-foreground"
            >
              {getOnboardingWelcomeCopy('continue_later', t)}
            </Button>
            <Button size="sm" onClick={handleBeginTour} className="gap-1.5">
              {getOnboardingWelcomeCopy('start_tour', t)}
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
