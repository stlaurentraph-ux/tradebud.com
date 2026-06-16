'use client';

import { useContext, useMemo } from 'react';
import { AppHeader } from '@/components/layout/app-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSponsorView } from '@/lib/sponsor-view';
import { LocaleContext } from '@/lib/locale-context';
import { buildAppBreadcrumbs, translatePageHeader } from '@/lib/nav-labels';
import {
  getComplianceHealthEmphasisLabel,
  getComplianceHealthKpiLabel,
  getComplianceHealthPageSubtitle,
  getComplianceHealthPriorityTitle,
  getComplianceHealthWarningLabel,
} from '@/lib/workflow-terminology-labels';

const warningRowIds = [
  'missing_geometry',
  'shipment_holds',
  'stale_risk',
  'manual_classifications',
] as const;

const warningCounts = [
  { count: 147, trend: '+12%' },
  { count: 24, trend: '+4%' },
  { count: 31, trend: '-8%' },
  { count: 9, trend: '+1%' },
];

export default function ComplianceHealthPage() {
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const pageHeader = translatePageHeader(t, 'compliance_health', { title: 'Compliance Health' });
  const sponsorView = useSponsorView();
  const isCountryView = sponsorView === 'country';

  const kpis = useMemo(
    () =>
      isCountryView
        ? [
            { value: '91%', label: getComplianceHealthKpiLabel('mapped_plot_ratio', t) },
            { value: '6.2%', label: getComplianceHealthKpiLabel('yield_warning_rate', t) },
            { value: '3.4%', label: getComplianceHealthKpiLabel('blocked_batch_rate', t) },
            { value: '87%', label: getComplianceHealthKpiLabel('dds_acceptance', t) },
          ]
        : [
            { value: '3.4%', label: getComplianceHealthKpiLabel('shipment_hold_rate', t) },
            { value: '87%', label: getComplianceHealthKpiLabel('dds_acceptance', t) },
            { value: '91%', label: getComplianceHealthKpiLabel('mapped_supplier_coverage', t) },
            { value: '6.2%', label: getComplianceHealthKpiLabel('yield_warning_rate', t) },
          ],
    [isCountryView, t],
  );

  return (
    <div className="flex flex-col">
      <AppHeader
        title={pageHeader.title}
        subtitle={getComplianceHealthPageSubtitle(isCountryView, t)}
        breadcrumbs={buildAppBreadcrumbs(t, { name: 'Compliance Health' })}
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
            <CardTitle>{getComplianceHealthPriorityTitle(t)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="mb-2">
              <Badge variant="outline">{getComplianceHealthEmphasisLabel(isCountryView, t)}</Badge>
            </div>
            {warningRowIds.map((warningId, index) => (
              <div key={warningId} className="flex items-center justify-between rounded-lg border p-3">
                <p className="text-sm">{getComplianceHealthWarningLabel(warningId, t)}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{warningCounts[index].count}</Badge>
                  <Badge variant="secondary">{warningCounts[index].trend}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
