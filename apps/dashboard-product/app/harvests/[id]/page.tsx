'use client';

import { useContext, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  HarvestBatchDetailView,
  HarvestBatchNotFound,
} from '@/components/harvests/harvest-batch-detail-view';
import { useAuth } from '@/lib/auth-context';
import { getBatchIntakeById } from '@/lib/batch-intake-service';
import { useDemoData } from '@/lib/demo-data-context';
import type { ExporterBatchRecord } from '@/lib/exporter-batch-store';
import { getMockBatchById } from '@/lib/mocks/batches';
import { LocaleContext } from '@/lib/locale-context';
import { getDashboardBreadcrumbLabel } from '@/lib/terminology-labels';
import {
  getBatchPageTitle,
  getHarvestDetailCardTitle,
  getHarvestDetailLoadingMessage,
  getHarvestDetailPageSubtitle,
  getHarvestDetailPageTitle,
} from '@/lib/workflow-terminology-labels';

export default function HarvestDetailPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const { demoDataEnabled } = useDemoData();
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const role = user?.active_role;
  const id = params?.id ?? '';
  const batchPageTitle = useMemo(() => getBatchPageTitle(role, t), [role, t]);
  const [batch, setBatch] = useState<ExporterBatchRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    if (!id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional effect-driven state sync (async load / client hydration); React Compiler adoption tracked separately
      setBatch(null);
      setIsLoading(false);
      setResolved(true);
      return;
    }

    if (demoDataEnabled) {
      setBatch(getMockBatchById(id));
      setIsLoading(false);
      setResolved(true);
      return;
    }

    if (!user?.tenant_id) {
      setBatch(null);
      setIsLoading(false);
      setResolved(true);
      return;
    }

    setIsLoading(true);
    void getBatchIntakeById(user.tenant_id, id)
      .then((record) => {
        const mockFallback =
          process.env.NODE_ENV !== 'production' ? getMockBatchById(id) : null;
        setBatch(record ?? mockFallback);
      })
      .finally(() => {
        setIsLoading(false);
        setResolved(true);
      });
  }, [id, user?.tenant_id, demoDataEnabled]);

  const headerSubtitle = batch
    ? getHarvestDetailPageSubtitle(batch.batch_id, t)
    : getHarvestDetailPageSubtitle(id, t);

  return (
    <div className="flex flex-col">
      <AppHeader
        title={batch?.batch_id ?? getHarvestDetailPageTitle(role, t)}
        subtitle={headerSubtitle}
        breadcrumbs={[
          { label: getDashboardBreadcrumbLabel(t), href: '/' },
          { label: batchPageTitle, href: '/harvests' },
          { label: batch?.batch_id ?? id },
        ]}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/harvests">
              <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
              {batchPageTitle}
            </Link>
          </Button>
        }
      />
      <div className="flex-1 p-6">
        {isLoading ? (
          <Card>
            <CardContent className="py-8 text-sm text-muted-foreground">
              {getHarvestDetailLoadingMessage(t)}
            </CardContent>
          </Card>
        ) : batch ? (
          <Card>
            <CardHeader>
              <CardTitle>{getHarvestDetailCardTitle(role, t)}</CardTitle>
            </CardHeader>
            <CardContent>
              <HarvestBatchDetailView batch={batch} role={role} t={t} />
            </CardContent>
          </Card>
        ) : resolved ? (
          <HarvestBatchNotFound t={t} />
        ) : null}
      </div>
    </div>
  );
}
