'use client';

import { useContext } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { CommodityCoverageRow, CountryCoverageRow } from '@/lib/sponsor-network-aggregates';
import { LocaleContext } from '@/lib/locale-context';
import { getSponsorPanelCopy } from '@/lib/workflow-terminology-labels';

interface SponsorNetworkCoverageProps {
  countries: CountryCoverageRow[];
  commodities: CommodityCoverageRow[];
  organisationsHref: string;
}

export function SponsorNetworkCoverage({
  countries,
  commodities,
  organisationsHref,
}: SponsorNetworkCoverageProps) {
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{getSponsorPanelCopy('coverage_countries_title', t)}</CardTitle>
            <CardDescription>{getSponsorPanelCopy('coverage_countries_description', t)}</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href={organisationsHref}>
              {getSponsorPanelCopy('coverage_manage', t)}
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {countries.length === 0 ? (
            <p className="text-sm text-muted-foreground">{getSponsorPanelCopy('coverage_countries_empty', t)}</p>
          ) : (
            countries.slice(0, 6).map((row) => (
              <div key={row.country} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium">{row.country}</p>
                  <p className="text-xs text-muted-foreground">
                    {getSponsorPanelCopy('coverage_country_row', t, {
                      orgs: row.organisationCount,
                      contacts: row.contactCount,
                    })}
                  </p>
                </div>
                <Badge variant="secondary">
                  {getSponsorPanelCopy('coverage_nodes', t, {
                    count: row.organisationCount + row.contactCount,
                  })}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{getSponsorPanelCopy('coverage_commodities_title', t)}</CardTitle>
          <CardDescription>{getSponsorPanelCopy('coverage_commodities_description', t)}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {commodities.length === 0 ? (
            <p className="text-sm text-muted-foreground">{getSponsorPanelCopy('coverage_commodities_empty', t)}</p>
          ) : (
            commodities.slice(0, 6).map((row) => (
              <div key={row.commodity} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium">{row.commodity}</p>
                  <p className="text-xs text-muted-foreground">
                    {getSponsorPanelCopy('coverage_commodity_row', t, {
                      active: row.activeProgrammeCount,
                      total: row.programmeCount,
                    })}
                  </p>
                </div>
                <Badge variant={row.activeProgrammeCount > 0 ? 'default' : 'outline'}>
                  {row.activeProgrammeCount > 0
                    ? getSponsorPanelCopy('coverage_status_active', t)
                    : getSponsorPanelCopy('coverage_status_planned', t)}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
