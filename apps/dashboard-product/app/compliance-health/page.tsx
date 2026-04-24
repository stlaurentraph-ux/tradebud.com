'use client';

import { AppHeader } from '@/components/layout/app-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSponsorView } from '@/lib/sponsor-view';

const warningRows = [
  { area: 'Missing geometry evidence', count: 147, trend: '+12%' },
  { area: 'Shipment holds', count: 24, trend: '+4%' },
  { area: 'Stale risk screening', count: 31, trend: '-8%' },
  { area: 'Unresolved manual classifications', count: 9, trend: '+1%' },
];

export default function ComplianceHealthPage() {
  const sponsorView = useSponsorView();
  const kpis =
    sponsorView === 'country'
      ? [
          { value: '91%', label: 'Mapped plot ratio' },
          { value: '6.2%', label: 'Yield warning rate' },
          { value: '3.4%', label: 'Blocked batch rate' },
          { value: '87%', label: 'DDS acceptance proxy' },
        ]
      : [
          { value: '3.4%', label: 'Shipment hold rate' },
          { value: '87%', label: 'DDS acceptance proxy' },
          { value: '91%', label: 'Mapped supplier coverage' },
          { value: '6.2%', label: 'Yield warning rate' },
        ];

  return (
    <div className="flex flex-col">
      <AppHeader
        title="Compliance Health"
        subtitle={
          sponsorView === 'country'
            ? 'Cross-network board for origin-level readiness, deterioration signals, and escalation pressure'
            : 'Cross-network board for supplier compliance posture and buyer-impacting risk indicators'
        }
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Compliance Health' }]}
      />
      <div className="flex-1 space-y-6 p-6">
        <div className="grid gap-4 md:grid-cols-4">
          {kpis.map((kpi) => (
            <Card key={kpi.label}>
              <CardContent className="pt-6">
                <p className="text-2xl font-bold">{kpi.value}</p>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Priority Risk Patterns</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="mb-2">
              <Badge variant="outline">
                Emphasis: {sponsorView === 'country' ? 'Country programme' : 'Brand sponsor'}
              </Badge>
            </div>
            {warningRows.map((row) => (
              <div key={row.area} className="flex items-center justify-between rounded-lg border p-3">
                <p className="text-sm">{row.area}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{row.count}</Badge>
                  <Badge variant="secondary">{row.trend}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
