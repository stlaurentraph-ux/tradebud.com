'use client';

import { useContext } from 'react';
import { AppHeader } from '@/components/layout/app-header';
import { AsyncState } from '@/components/common/async-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useProspects } from '@/lib/use-crm';
import { LocaleContext } from '@/lib/locale-context';
import { buildAppBreadcrumbs, translatePageHeader } from '@/lib/nav-labels';
import { getWorkflowAsyncStateCopy } from '@/lib/workflow-terminology-labels';

export default function CrmProspectsPage() {
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const pageHeader = translatePageHeader(t, 'crm_prospects', { title: "CRM Prospects", subtitle: "Unified founder pipeline from website, referrals, and manual outreach." });
  const { prospects, isLoading, error, reload } = useProspects();

  return (
    <div className="flex flex-col">
      <AppHeader
        title={pageHeader.title}
        subtitle={pageHeader.subtitle}
        breadcrumbs={buildAppBreadcrumbs(t, { name: 'CRM Prospects' })}
      />
      <div className="flex-1 p-6">
        {isLoading ? (
          <AsyncState mode="loading" title={getWorkflowAsyncStateCopy('crm.prospects', 'loading', t).title} />
        ) : error ? (
          <AsyncState mode="error" title={getWorkflowAsyncStateCopy('crm.prospects', 'error', t).title} description={error} onRetry={reload} />
        ) : prospects.length === 0 ? (
          <AsyncState mode="empty" title={getWorkflowAsyncStateCopy('crm.prospects', 'empty', t).title} description={getWorkflowAsyncStateCopy('crm.prospects', 'empty', t).description} />
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
