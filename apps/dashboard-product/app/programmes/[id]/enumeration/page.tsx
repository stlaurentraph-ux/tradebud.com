'use client';

import { use, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PermissionGate } from '@/components/common/permission-gate';
import { EnumerationCampaignProgressPanel } from '@/components/enumeration/enumeration-campaign-progress-panel';
import { EnumerationCampaignSetupPanel } from '@/components/enumeration/enumeration-campaign-setup-panel';
import { useAuth } from '@/lib/auth-context';
import { fetchEnumerationCampaignProgress } from '@/lib/enumeration-campaign-client';
import type {
  EnumerationCampaignProgress,
  EnumerationMappingRegion,
} from '@/lib/enumeration-campaign-types';
import { useRequestCampaigns } from '@/lib/use-requests';
import { LocaleContext } from '@/lib/locale-context';
import { buildAppBreadcrumbs } from '@/lib/nav-labels';
import { mapCampaignStatusToOutreachUi } from '@/lib/dashboardCrmOutreachRegistry';

export default function EnumerationCampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: campaignId } = use(params);
  return <EnumerationCampaignPageContent campaignId={campaignId} />;
}

function EnumerationCampaignPageContent({ campaignId }: { campaignId: string }) {
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const { user } = useAuth();
  const { campaigns, isLoading: campaignsLoading } = useRequestCampaigns(user?.tenant_id ?? null);
  const campaign = useMemo(
    () => campaigns.find((item) => item.id === campaignId) ?? null,
    [campaigns, campaignId],
  );

  const [progressError, setProgressError] = useState<string | null>(null);
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);
  const [mappingRegion, setMappingRegion] = useState<EnumerationMappingRegion | null>(null);
  const [progress, setProgress] = useState<EnumerationCampaignProgress | null>(null);

  const loadProgress = useCallback(async () => {
    setProgressError(null);
    setIsLoadingProgress(true);
    try {
      const nextProgress = await fetchEnumerationCampaignProgress(campaignId);
      setProgress(nextProgress);
      setMappingRegion(nextProgress.mappingRegion);
    } catch (nextError) {
      setProgressError(nextError instanceof Error ? nextError.message : 'Failed to load progress.');
    } finally {
      setIsLoadingProgress(false);
    }
  }, [campaignId]);

  useEffect(() => {
    if (!user?.tenant_id) return;
    void loadProgress();
  }, [user?.tenant_id, loadProgress]);

  const uiStatus = campaign ? mapCampaignStatusToOutreachUi(campaign.status) : null;
  const pageTitle = campaign?.title ?? progress?.campaignTitle ?? 'Field mapping campaign';

  return (
    <>
      <AppHeader
        breadcrumbs={buildAppBreadcrumbs(
          t,
          { name: 'Programmes', href: '/programmes' },
          { name: pageTitle },
        )}
        title="Field mapping ops"
        description="Publish the district region agents confirm offline and track roster collection progress."
      />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/programmes">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to programmes
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            {uiStatus ? <Badge variant="outline">{uiStatus}</Badge> : null}
            <Button variant="outline" size="sm" disabled={isLoadingProgress} onClick={() => void loadProgress()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {campaignsLoading && !campaign ? (
          <p className="text-sm text-muted-foreground">Loading campaign…</p>
        ) : null}

        <PermissionGate permission="requests:view">
          <EnumerationCampaignSetupPanel
            campaignId={campaignId}
            initialRegion={mappingRegion}
            onSaved={(region) => {
              setMappingRegion(region);
              void loadProgress();
            }}
          />

          {progressError ? <p className="text-sm text-destructive">{progressError}</p> : null}
          {isLoadingProgress && !progress ? (
            <p className="text-sm text-muted-foreground">Loading collection progress…</p>
          ) : null}
          {progress ? <EnumerationCampaignProgressPanel progress={progress} /> : null}
        </PermissionGate>
      </div>
    </>
  );
}
