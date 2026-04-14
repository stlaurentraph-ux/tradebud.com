'use client';

import { AppHeader } from '@/components/layout/app-header';
import { AsyncState } from '@/components/common/async-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useProspects } from '@/lib/use-crm';

export default function CrmProspectsPage() {
  const { prospects, isLoading, error, reload } = useProspects();

  return (
    <div className="flex flex-col">
      <AppHeader
        title="CRM Prospects"
        subtitle="Unified founder pipeline from website, referrals, and manual outreach."
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'CRM Prospects' }]}
      />
      <div className="flex-1 p-6">
        {isLoading ? (
          <AsyncState mode="loading" title="Loading prospects..." />
        ) : error ? (
          <AsyncState mode="error" title="Failed to load prospects" description={error} onRetry={reload} />
        ) : prospects.length === 0 ? (
          <AsyncState mode="empty" title="No prospects yet" description="Add leads from website forms or manual research." />
        ) : (
          <div className="grid gap-4">
            {prospects.map((prospect) => (
              <Card key={prospect.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-base">
                    <span>{prospect.name}</span>
                    <Badge variant="outline">{prospect.stage}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2 text-sm text-muted-foreground md:grid-cols-3">
                  <div><span className="font-medium text-foreground">Company:</span> {prospect.company}</div>
                  <div><span className="font-medium text-foreground">Email:</span> {prospect.email ?? 'n/a'}</div>
                  <div><span className="font-medium text-foreground">Source:</span> {prospect.source ?? 'n/a'}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
