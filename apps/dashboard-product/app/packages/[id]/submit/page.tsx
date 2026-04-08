'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AppHeader } from '@/components/layout/app-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SubmitPackagePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';

  return (
    <div className="flex flex-col">
      <AppHeader
        title="Submit Package"
        subtitle={`Submission workflow for package ${id}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Packages', href: '/packages' },
          { label: id, href: `/packages/${id}` },
          { label: 'Submit' },
        ]}
      />
      <div className="flex-1 p-6">
        <Card>
          <CardHeader>
            <CardTitle>Submission Wizard</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Route enabled. Return to <Link className="underline" href={`/packages/${id}`}>package detail</Link> to continue.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

