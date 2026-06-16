'use client';

import { useContext, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { AppHeader } from '@/components/layout/app-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { LocaleContext } from '@/lib/locale-context';
import { getDashboardBreadcrumbLabel } from '@/lib/terminology-labels';
import {
  getBatchPageTitle,
  getHarvestDetailCardTitle,
  getHarvestDetailPageSubtitle,
  getHarvestDetailPageTitle,
  getHarvestDetailPlaceholder,
} from '@/lib/workflow-terminology-labels';

export default function HarvestDetailPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const role = user?.active_role;
  const id = params?.id ?? '';
  const batchPageTitle = useMemo(() => getBatchPageTitle(role, t), [role, t]);

  return (
    <div className="flex flex-col">
      <AppHeader
        title={getHarvestDetailPageTitle(role, t)}
        subtitle={getHarvestDetailPageSubtitle(id, t)}
        breadcrumbs={[
          { label: getDashboardBreadcrumbLabel(t), href: '/' },
          { label: batchPageTitle, href: '/harvests' },
          { label: id },
        ]}
      />
      <div className="flex-1 p-6">
        <Card>
          <CardHeader>
            <CardTitle>{getHarvestDetailCardTitle(role, t)}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {getHarvestDetailPlaceholder(role, t)}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
