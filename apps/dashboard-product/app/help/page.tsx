'use client';

import { useContext } from 'react';
import { AppHeader } from '@/components/layout/app-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { Badge } from '@/components/ui/badge';
import { LocaleContext } from '@/lib/locale-context';
import { buildAppBreadcrumbs, translatePageHeader } from '@/lib/nav-labels';
import {
  getHelpCenterIntro,
  getHelpCenterTitle,
  getHelpCenterWorkflowHint,
  getHelpGuideBadgeLabel,
  getHelpGuideItemLabel,
  getHelpGuidesSectionTitle,
  getHelpPageSubtitle,
} from '@/lib/workflow-terminology-labels';

const cooperativeGuideIds = [
  'coop.onboarding',
  'coop.portability',
  'coop.geometry',
  'coop.yield',
  'coop.premium',
  'coop.sync',
] as const;

const defaultGuideIds = [
  'default.shipments',
  'default.evidence',
  'default.issues',
  'default.reporting',
] as const;

export default function HelpPage() {
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const pageHeader = translatePageHeader(t, 'help', { title: 'Help' });
  const { user } = useAuth();
  const isCooperative = user?.active_role === 'cooperative';
  const guideIds = isCooperative ? cooperativeGuideIds : defaultGuideIds;

  return (
    <div className="flex flex-col">
      <AppHeader
        title={pageHeader.title}
        subtitle={getHelpPageSubtitle(isCooperative, t)}
        breadcrumbs={buildAppBreadcrumbs(t, { name: 'Help' })}
      />
      <div className="flex-1 space-y-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle>{getHelpCenterTitle(t)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>{getHelpCenterIntro(t)}</p>
            <p>{getHelpCenterWorkflowHint(isCooperative, t)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{getHelpGuidesSectionTitle(isCooperative, t)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {guideIds.map((guideId) => (
              <div key={guideId} className="flex items-center justify-between rounded-md border px-3 py-2">
                <span className="text-sm">{getHelpGuideItemLabel(guideId, t)}</span>
                <Badge variant="outline">{getHelpGuideBadgeLabel(t)}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
