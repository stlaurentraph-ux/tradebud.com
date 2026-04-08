'use client';

import { useParams } from 'next/navigation';
import { AppHeader } from '@/components/layout/app-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PlotDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';

  return (
    <div className="flex flex-col">
      <AppHeader
        title="Plot Detail"
        subtitle={`Plot identifier: ${id}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Plots', href: '/plots' },
          { label: id },
        ]}
      />
      <div className="flex-1 p-6">
        <Card>
          <CardHeader>
            <CardTitle>Plot Record</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Route enabled and ready for detailed plot data wiring.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

