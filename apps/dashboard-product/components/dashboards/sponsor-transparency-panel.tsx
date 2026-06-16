'use client';

import Link from 'next/link';
import { ShieldCheck, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { TransparencyMetrics } from '@/lib/sponsor-network-aggregates';

interface SponsorTransparencyPanelProps {
  metrics: TransparencyMetrics;
  complianceHealthHref: string;
}

export function SponsorTransparencyPanel({ metrics, complianceHealthHref }: SponsorTransparencyPanelProps) {
  const scorecards = [
    {
      label: 'Transparency index',
      value: metrics.transparencyIndex !== null ? `${metrics.transparencyIndex}%` : '--',
      hint: 'Blends plot compliance and organisation readiness',
      icon: TrendingUp,
    },
    {
      label: 'Compliance health',
      value: metrics.complianceHealthPercent !== null ? `${metrics.complianceHealthPercent}%` : '--',
      hint: 'Mapped plots meeting compliance signals',
      icon: ShieldCheck,
    },
    {
      label: 'At-risk organisations',
      value: String(metrics.atRiskOrganisations),
      hint: 'Below readiness threshold across your network',
      icon: ShieldCheck,
    },
    {
      label: 'Active contacts',
      value: String(metrics.activeContacts),
      hint: 'Invited or engaged supply chain contacts',
      icon: TrendingUp,
    },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle>Transparency & sustainable market readiness</CardTitle>
          <CardDescription>
            Cross-network signals for EUDR-aligned transparency, deforestation-risk visibility, and programme accountability.
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={complianceHealthHref}>Open compliance health</Link>
        </Button>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {scorecards.map((card) => (
          <div key={card.label} className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{card.label}</p>
              <card.icon className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            </div>
            <p className="mt-2 text-2xl font-bold">{card.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{card.hint}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
