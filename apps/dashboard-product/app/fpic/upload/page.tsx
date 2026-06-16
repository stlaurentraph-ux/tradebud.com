'use client';

import { useContext } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { LocaleContext } from '@/lib/locale-context';
import { getDashboardBreadcrumbLabel } from '@/lib/terminology-labels';
import {
  getEvidencePageTitle,
  getEvidenceUploadBackLabel,
  getEvidenceUploadBreadcrumbLabel,
  getEvidenceUploadFormTitle,
  getEvidenceUploadPageSubtitle,
  getEvidenceUploadPageTitle,
  getEvidenceUploadPlaceholder,
} from '@/lib/workflow-terminology-labels';

export default function UploadFPICPage() {
  const { user } = useAuth();
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const role = user?.active_role;

  return (
    <div className="flex flex-col">
      <AppHeader
        title={getEvidenceUploadPageTitle(t)}
        subtitle={getEvidenceUploadPageSubtitle(t)}
        breadcrumbs={[
          { label: getDashboardBreadcrumbLabel(t), href: '/' },
          { label: getEvidencePageTitle(role, t), href: '/fpic' },
          { label: getEvidenceUploadBreadcrumbLabel(t) },
        ]}
      />
      <div className="flex-1 p-6">
        <Button variant="ghost" size="sm" className="mb-4" asChild>
          <Link href="/fpic">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {getEvidenceUploadBackLabel(t)}
          </Link>
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>{getEvidenceUploadFormTitle(t)}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {getEvidenceUploadPlaceholder(t)}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
