'use client';

import Link from 'next/link';
import { useContext } from 'react';
import { useParams } from 'next/navigation';
import { AppHeader } from '@/components/layout/app-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { LocaleContext } from '@/lib/locale-context';
import {
  buildPackageBreadcrumbs,
  getPackageComplianceDetailLinkLabel,
  getPackageSubmitBreadcrumbLabel,
  getPackageSubmitCardTitle,
  getPackageSubmitPageSubtitle,
  getPackageSubmitPageTitle,
  getPackageSubmitRoutePrefix,
  getPackageSubmitRouteSuffix,
} from '@/lib/workflow-terminology-labels';

export default function SubmitPackagePage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const role = user?.active_role;
  const id = params?.id ?? '';

  return (
    <div className="flex flex-col">
      <AppHeader
        title={getPackageSubmitPageTitle(role, t)}
        subtitle={getPackageSubmitPageSubtitle(role, id, t)}
        breadcrumbs={buildPackageBreadcrumbs(role, id, id, { label: getPackageSubmitBreadcrumbLabel(role, t) }, t)}
      />
      <div className="flex-1 p-6">
        <Card>
          <CardHeader>
            <CardTitle>{getPackageSubmitCardTitle(role, t)}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {getPackageSubmitRoutePrefix(t)}{' '}
            <Link className="underline" href={`/packages/${id}`}>
              {getPackageComplianceDetailLinkLabel(role, t)}
            </Link>{' '}
            {getPackageSubmitRouteSuffix(t)}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
