'use client';

import { AppHeader } from '@/components/layout/app-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSponsorView } from '@/lib/sponsor-view';

const billingRows = [
  { item: 'Covered organisations', value: '29', note: '13 pass-through' },
  { item: 'Covered seats', value: '438', note: '92 pending activation' },
  { item: 'Sponsor-covered shipment fees', value: '$43,280', note: 'This quarter' },
  { item: 'Policy overrides', value: '5', note: '2 require approval' },
];

export default function BillingCoveragePage() {
  const sponsorView = useSponsorView();
  const orderedRows =
    sponsorView === 'country'
      ? billingRows
      : [...billingRows].sort((a, b) => (a.item.includes('shipment') ? 1 : 0) - (b.item.includes('shipment') ? 1 : 0));

  return (
    <div className="flex flex-col">
      <AppHeader
        title="Billing & Coverage"
        subtitle={
          sponsorView === 'country'
            ? 'Manage sponsor-funded coverage and budget exposure across country network operations'
            : 'Manage sponsor-funded compliance outcomes, supplier support, and pass-through exceptions'
        }
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Billing & Coverage' }]}
      />
      <div className="flex-1 space-y-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle>Sponsorship Coverage Monitor</CardTitle>
            <CardDescription>
              {sponsorView === 'country'
                ? 'Track funded organisations, coverage policies, and regional budget pressures.'
                : 'Track sponsored supplier coverage, fee support, and intervention-critical exceptions.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="mb-2">
              <Badge variant="outline">
                Emphasis: {sponsorView === 'country' ? 'Country programme' : 'Brand sponsor'}
              </Badge>
            </div>
            {orderedRows.map((row) => (
              <div key={row.item} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">{row.item}</p>
                  <p className="text-xs text-muted-foreground">{row.note}</p>
                </div>
                <Badge variant="secondary">{row.value}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
