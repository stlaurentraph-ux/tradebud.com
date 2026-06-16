'use client';

import { useContext } from 'react';
import Link from 'next/link';
import { Globe2, Leaf, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { SponsorView } from '@/lib/sponsor-view';
import { LocaleContext } from '@/lib/locale-context';
import { getSponsorPanelCopy } from '@/lib/workflow-terminology-labels';

interface SponsorNetworkHeroProps {
  sponsorView: SponsorView;
  countriesCovered: number;
  commoditiesTracked: number;
  withSponsorView: (href: string) => string;
}

export function SponsorNetworkHero({
  sponsorView,
  countriesCovered,
  commoditiesTracked,
  withSponsorView,
}: SponsorNetworkHeroProps) {
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;

  return (
    <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-cyan-50">
      <CardContent className="flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            {getSponsorPanelCopy('hero_eyebrow', t)}
          </p>
          <h2 className="text-xl font-semibold text-emerald-950">
            {getSponsorPanelCopy('hero_title', t)}
          </h2>
          <p className="max-w-2xl text-sm text-emerald-900/80">
            {getSponsorPanelCopy(sponsorView === 'country' ? 'hero_subtitle_country' : 'hero_subtitle_brand', t)}
          </p>
          <div className="flex flex-wrap gap-3 pt-1 text-xs text-emerald-800">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1">
              <Globe2 className="h-3.5 w-3.5" aria-hidden="true" />
              {getSponsorPanelCopy('hero_countries', t, { count: countriesCovered })}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1">
              <Leaf className="h-3.5 w-3.5" aria-hidden="true" />
              {getSponsorPanelCopy('hero_commodities', t, { count: commoditiesTracked })}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild>
            <Link href={withSponsorView('/contacts/add?mode=contact')}>
              <UserPlus className="mr-2 h-4 w-4" aria-hidden="true" />
              {getSponsorPanelCopy('hero_invite_contact', t)}
            </Link>
          </Button>
          <Button asChild variant="outline" className="bg-white/80">
            <Link href={withSponsorView('/organisations')}>
              {getSponsorPanelCopy('hero_classify_orgs', t)}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
