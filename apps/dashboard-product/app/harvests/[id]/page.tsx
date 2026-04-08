'use client';

import { useParams } from 'next/navigation';
import { AppHeader } from '@/components/layout/app-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function HarvestDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';

  return (
    <div className="flex flex-col">
      <AppHeader
        title="Harvest Detail"
        subtitle={`Harvest identifier: ${id}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Harvests', href: '/harvests' },
          { label: id },
        ]}
      />
      <div className="flex-1 p-6">
        <Card>
          <CardHeader>
            <CardTitle>Harvest Record</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Route enabled and ready for detailed harvest data wiring.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

