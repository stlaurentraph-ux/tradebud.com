'use client';

import { useContext, useMemo } from 'react';
import Link from 'next/link';
import { ShieldCheck, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { TransparencyMetrics } from '@/lib/sponsor-network-aggregates';
import { LocaleContext } from '@/lib/locale-context';
import { getSponsorPanelCopy } from '@/lib/workflow-terminology-labels';

interface SponsorTransparencyPanelProps {
  metrics: TransparencyMetrics;
  complianceHealthHref: string;
}

export function SponsorTransparencyPanel({ metrics, complianceHealthHref }: SponsorTransparencyPanelProps) {
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;

  const scorecards = useMemo(
    () => [
      {
        label: getSponsorPanelCopy('transparency_index', t),
        value: metrics.transparencyIndex !== null ? `${metrics.transparencyIndex}%` : '--',
        hint: getSponsorPanelCopy('transparency_index_hint', t),
        icon: TrendingUp,
      },
      {
        label: getSponsorPanelCopy('transparency_compliance', t),
        value: metrics.complianceHealthPercent !== null ? `${metrics.complianceHealthPercent}%` : '--',
        hint: getSponsorPanelCopy('transparency_compliance_hint', t),
        icon: ShieldCheck,
      },
      {
        label: getSponsorPanelCopy('transparency_at_risk', t),
        value: String(metrics.atRiskOrganisations),
        hint: getSponsorPanelCopy('transparency_at_risk_hint', t),
        icon: ShieldCheck,
      },
      {
        label: getSponsorPanelCopy('transparency_contacts', t),
        value: String(metrics.activeContacts),
        hint: getSponsorPanelCopy('transparency_contacts_hint', t),
        icon: TrendingUp,
      },
    ],
    [metrics, t],
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle>{getSponsorPanelCopy('transparency_title', t)}</CardTitle>
          <CardDescription>{getSponsorPanelCopy('transparency_description', t)}</CardDescription>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={complianceHealthHref}>{getSponsorPanelCopy('transparency_cta', t)}</Link>
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
