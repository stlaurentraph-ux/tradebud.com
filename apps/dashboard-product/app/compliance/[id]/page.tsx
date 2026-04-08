'use client';

import { useParams } from 'next/navigation';
import { AppHeader } from '@/components/layout/app-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ComplianceIssueDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';

  return (
    <div className="flex flex-col">
      <AppHeader
        title="Compliance Issue"
        subtitle={`Issue identifier: ${id}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Compliance', href: '/compliance' },
          { label: id },
        ]}
      />
      <div className="flex-1 p-6">
        <Card>
          <CardHeader>
            <CardTitle>Issue Detail</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Route enabled and ready for issue detail wiring.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

