import { fetchMyConsentGrants } from '@/features/api/consentGrants';
import { loadAllPlotReadinessStates } from '@/features/compliance/loadPlotReadiness';
import type { TranslateFn } from '@/features/i18n/translate';
import { listUnsyncedLocalPlots } from '@/features/sync/plotServerSync';
import { fetchServerPlotListForUi } from '@/features/sync/serverPlotListCache';
import type { Plot, FarmerProfile } from '@/features/state/AppStateContext';
import { loadPendingSyncActions, loadPlotServerLinks } from '@/features/state/persistence';

import {
  buildFarmerActivityFeed,
  countActivityActions,
} from './buildFarmerActivityFeed';
import { saveFarmerActivityCache } from './farmerActivityCache';
import type { FarmerActivityFeedSnapshot } from './farmerActivityTypes';

export type RefreshFarmerActivityFeedInput = {
  farmer: FarmerProfile | null;
  plots: Plot[];
  isSignedIn: boolean;
  t: TranslateFn;
  forcePlotFetch?: boolean;
};

export type RefreshFarmerActivityFeedResult = {
  snapshot: FarmerActivityFeedSnapshot;
  fromNetwork: boolean;
};

export async function refreshFarmerActivityFeed(
  input: RefreshFarmerActivityFeedInput,
): Promise<RefreshFarmerActivityFeedResult> {
  const empty: FarmerActivityFeedSnapshot = {
    fetchedAt: new Date().toISOString(),
    items: [],
    actionCount: 0,
  };

  if (!input.isSignedIn || !input.farmer?.id) {
    await saveFarmerActivityCache(empty);
    return { snapshot: empty, fromNetwork: false };
  }

  const [plotServerLinks, pendingRows, backendPlots, consentResult] = await Promise.all([
    loadPlotServerLinks().catch(() => ({} as Record<string, string>)),
    loadPendingSyncActions().catch(() => []),
    fetchServerPlotListForUi({
      profileFarmerId: input.farmer.id,
      localPlots: input.plots,
      force: input.forcePlotFetch ?? false,
    }).catch(() => []),
    fetchMyConsentGrants().catch(() => ({ ok: false as const, reason: 'network' as const })),
  ]);

  const readiness = await loadAllPlotReadinessStates(
    input.plots,
    backendPlots ?? [],
    input.farmer,
    plotServerLinks,
  ).catch(() => []);

  const readinessByPlotId = new Map(readiness.map((row) => [row.plotId, row]));
  const unsyncedCount = listUnsyncedLocalPlots(
    input.plots,
    backendPlots ?? [],
    plotServerLinks,
  ).length;
  const syncPendingCount = pendingRows.length + unsyncedCount;

  const pendingConsent =
    consentResult.ok === true
      ? consentResult.items.filter((grant) => grant.status === 'pending')
      : [];

  const items = buildFarmerActivityFeed({
    plots: input.plots,
    backendPlots: backendPlots ?? [],
    plotServerLinks,
    readinessByPlotId,
    pendingConsentGrants: pendingConsent,
    syncPendingCount,
    isSignedIn: input.isSignedIn,
    t: input.t,
  });

  const snapshot: FarmerActivityFeedSnapshot = {
    fetchedAt: new Date().toISOString(),
    items,
    actionCount: countActivityActions(items),
  };

  await saveFarmerActivityCache(snapshot);

  return {
    snapshot,
    fromNetwork: consentResult.ok === true || (backendPlots?.length ?? 0) > 0,
  };
}
