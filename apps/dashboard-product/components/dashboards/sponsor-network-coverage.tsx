'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { CommodityCoverageRow, CountryCoverageRow } from '@/lib/sponsor-network-aggregates';

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
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Countries in scope</CardTitle>
            <CardDescription>Governed organisations and invited contacts by origin market</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href={organisationsHref}>
              Manage
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {countries.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Add organisations or invite contacts to start mapping your multi-country network.
            </p>
          ) : (
            countries.slice(0, 6).map((row) => (
              <div key={row.country} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium">{row.country}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.organisationCount} orgs · {row.contactCount} contacts
                  </p>
                </div>
                <Badge variant="secondary">{row.organisationCount + row.contactCount} nodes</Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Commodities tracked</CardTitle>
          <CardDescription>Programme coverage across sustainable market supply chains</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {commodities.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Launch a programme to classify commodity scope and collect transparency evidence.
            </p>
          ) : (
            commodities.slice(0, 6).map((row) => (
              <div key={row.commodity} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium">{row.commodity}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.activeProgrammeCount} active · {row.programmeCount} total programmes
                  </p>
                </div>
                <Badge variant={row.activeProgrammeCount > 0 ? 'default' : 'outline'}>
                  {row.activeProgrammeCount > 0 ? 'Active' : 'Planned'}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
