'use client';

import { useContext } from 'react';
import { Sparkles, ArrowRight, Compass, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LocaleContext } from '@/lib/locale-context';
import { getWelcomeCardCopy, getWelcomeCardHighlights } from '@/lib/workflow-terminology-labels';

interface WelcomeCardProps {
  userName?: string;
  onDismiss: () => void;
  onStartOnboarding: () => void;
  onExploreWorkspace: () => void;
}

export function WelcomeCard({ userName, onDismiss, onStartOnboarding, onExploreWorkspace }: WelcomeCardProps) {
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const firstName = userName?.split(' ')[0] ?? getWelcomeCardCopy('name_fallback', t);
  const highlights = getWelcomeCardHighlights(t);

  return (
    <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-secondary to-background shadow-sm">
      <button
        type="button"
        onClick={onDismiss}
        className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={getWelcomeCardCopy('dismiss_aria', t)}
      >
        <X className="h-4 w-4" />
      </button>

      <CardContent className="p-6 pr-10">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>

          <div className="flex-1 space-y-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground text-balance">
                {getWelcomeCardCopy('title', t, { name: firstName })}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground text-pretty">
                {getWelcomeCardCopy('description', t)}
              </p>
            </div>

            <ul className="space-y-1.5 text-sm text-muted-foreground">
              {highlights.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {item}
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-3 pt-1">
              <Button size="sm" onClick={onStartOnboarding} className="gap-1.5">
                {getWelcomeCardCopy('start_onboarding', t)}
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
              <Button size="sm" variant="outline" onClick={onExploreWorkspace} className="gap-1.5">
                <Compass className="h-3.5 w-3.5" />
                {getWelcomeCardCopy('explore_workspace', t)}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
