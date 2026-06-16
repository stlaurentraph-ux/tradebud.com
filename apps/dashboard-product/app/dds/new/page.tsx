'use client';

import { useContext } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LocaleContext } from '@/lib/locale-context';
import { getDashboardBreadcrumbLabel } from '@/lib/terminology-labels';
import {
  getDdsNewBackLabel,
  getDdsNewBreadcrumbLabel,
  getDdsNewFormTitle,
  getDdsNewPageSubtitle,
  getDdsNewPageTitle,
  getDdsNewPlaceholder,
  getDdsWorkspaceTitle,
} from '@/lib/workflow-terminology-labels';

export default function NewDDSPage() {
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;

  return (
    <div className="flex flex-col">
      <AppHeader
        title={getDdsNewPageTitle(t)}
        subtitle={getDdsNewPageSubtitle(t)}
        breadcrumbs={[
          { label: getDashboardBreadcrumbLabel(t), href: '/' },
          { label: getDdsWorkspaceTitle(t), href: '/dds' },
          { label: getDdsNewBreadcrumbLabel(t) },
        ]}
      />
      <div className="flex-1 p-6">
        <Button variant="ghost" size="sm" className="mb-4" asChild>
          <Link href="/dds">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {getDdsNewBackLabel(t)}
          </Link>
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>{getDdsNewFormTitle(t)}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {getDdsNewPlaceholder(t)}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
