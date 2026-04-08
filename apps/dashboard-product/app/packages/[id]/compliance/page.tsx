'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AppHeader } from '@/components/layout/app-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PackageCompliancePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';

  return (
    <div className="flex flex-col">
      <AppHeader
        title="Package Compliance"
        subtitle={`Compliance review for package ${id}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Packages', href: '/packages' },
          { label: id, href: `/packages/${id}` },
          { label: 'Compliance' },
        ]}
      />
      <div className="flex-1 p-6">
        <Card>
          <CardHeader>
            <CardTitle>Compliance Detail</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Route enabled. You can navigate back to <Link className="underline" href={`/packages/${id}`}>package detail</Link>.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

