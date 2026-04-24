'use client';

import { Sparkles, ArrowRight, Compass, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface WelcomeCardProps {
  userName?: string;
  onDismiss: () => void;
  onStartOnboarding: () => void;
  onExploreWorkspace: () => void;
}

export function WelcomeCard({ userName, onDismiss, onStartOnboarding, onExploreWorkspace }: WelcomeCardProps) {
  const firstName = userName?.split(' ')[0] ?? 'there';

  return (
    <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-secondary to-background shadow-sm">
      {/* Dismiss button */}
      <button
        type="button"
        onClick={onDismiss}
        className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Dismiss welcome message"
      >
        <X className="h-4 w-4" />
      </button>

      <CardContent className="p-6 pr-10">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>

          <div className="flex-1 space-y-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground text-balance">
                Welcome to Tracebud, {firstName}!
              </h2>
              <p className="mt-1 text-sm text-muted-foreground text-pretty">
                Your workspace is ready. You can start managing EUDR compliance right away or take a
                moment to explore the platform first.
              </p>
            </div>

            {/* Feature highlights */}
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              {[
                'Submit Due Diligence Statements to TRACES NT',
                'Manage plots, farmers, and supply chain data',
                'Track compliance status across your supply chain',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {item}
                </li>
              ))}
            </ul>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3 pt-1">
              <Button
                size="sm"
                onClick={onStartOnboarding}
                className="gap-1.5"
              >
                Start onboarding
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onExploreWorkspace}
                className="gap-1.5"
              >
                <Compass className="h-3.5 w-3.5" />
                Explore workspace first
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
