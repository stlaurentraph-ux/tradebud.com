'use client';

import Link from 'next/link';
import { useContext } from 'react';
import { FileText, MapPin, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTenureReviewQueue } from '@/lib/use-tenure-review-queue';
import { usePlotReviewQueue } from '@/lib/use-plot-review-queue';
import { LocaleContext } from '@/lib/locale-context';
import {
  getComplianceReviewHubPlotCta,
  getComplianceReviewHubPlotDescription,
  getComplianceReviewHubTenureAwaitingBadge,
  getComplianceReviewHubTenureCta,
  getComplianceReviewHubTenureDescription,
  getPlotReviewPageTitle,
  getTenureReviewPageTitle,
} from '@/lib/workflow-terminology-labels';

export function ComplianceReviewHub() {
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const { items: tenureItems, isLoading: tenureLoading } = useTenureReviewQueue();
  const { items: plotItems, isLoading: plotLoading } = usePlotReviewQueue();

  const tenureManual = tenureItems.filter((item) => item.parse_status === 'MANUAL_REQUIRED').length;
  const plotReviewCount = plotItems.length;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              {getPlotReviewPageTitle(t)}
            </CardTitle>
            {!plotLoading && plotReviewCount > 0 ? (
              <Badge variant="secondary">{plotReviewCount}</Badge>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>{getComplianceReviewHubPlotDescription(t)}</p>
          <Button asChild variant="outline" size="sm">
            <Link href="/compliance/plot-review">{getComplianceReviewHubPlotCta(t)}</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              {getTenureReviewPageTitle(t)}
            </CardTitle>
            {!tenureLoading && tenureManual > 0 ? (
              <Badge variant="destructive">{getComplianceReviewHubTenureAwaitingBadge(tenureManual, t)}</Badge>
            ) : !tenureLoading && tenureItems.length > 0 ? (
              <Badge variant="secondary">{tenureItems.length}</Badge>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p className="flex items-start gap-2">
            <FileText className="h-4 w-4 mt-0.5 shrink-0" />
            {getComplianceReviewHubTenureDescription(t)}
          </p>
          <Button asChild variant="outline" size="sm">
            <Link href="/compliance/tenure-review">{getComplianceReviewHubTenureCta(t)}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
