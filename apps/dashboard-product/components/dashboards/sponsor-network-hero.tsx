'use client';

import Link from 'next/link';
import { Globe2, Leaf, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { SponsorView } from '@/lib/sponsor-view';

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
  const subtitle =
    sponsorView === 'country'
      ? 'Coordinate government or development programmes across origins, classify supply chain actors, and track EUDR-ready transparency by country and commodity.'
      : 'Give brands and buyers a governed view of supplier networks, sustainable sourcing readiness, and compliance signals across commodities.';

  return (
    <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-cyan-50">
      <CardContent className="flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Sponsor oversight</p>
          <h2 className="text-xl font-semibold text-emerald-950">Network transparency for sustainable markets</h2>
          <p className="max-w-2xl text-sm text-emerald-900/80">{subtitle}</p>
          <div className="flex flex-wrap gap-3 pt-1 text-xs text-emerald-800">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1">
              <Globe2 className="h-3.5 w-3.5" aria-hidden="true" />
              {countriesCovered} countries
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1">
              <Leaf className="h-3.5 w-3.5" aria-hidden="true" />
              {commoditiesTracked} commodities
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild>
            <Link href={withSponsorView('/contacts/add?mode=contact')}>
              <UserPlus className="mr-2 h-4 w-4" aria-hidden="true" />
              Invite contact
            </Link>
          </Button>
          <Button asChild variant="outline" className="bg-white/80">
            <Link href={withSponsorView('/organisations')}>Classify organisations</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
