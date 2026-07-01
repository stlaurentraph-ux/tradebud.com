import type { ConsentGrant } from '@/features/api/consentGrants';
import {
  deforestationUiStateFromBackendStatus,
  parseDeforestationScreening,
  resolveBackendPlotComplianceStatus,
} from '@/features/compliance/plotDeforestationStatus';
import type { PlotReadinessLoadResult } from '@/features/compliance/loadPlotReadiness';
import {
  resolveLandDocumentsUiStatus,
} from '@/features/compliance/plotChecklist';
import type { TranslateFn } from '@/features/i18n/translate';
import { resolveBackendPlotMetaForLocal, type PlotServerLinks } from '@/features/plots/plotServerLink';
import { getPlotUploadGeometryBlock } from '@/features/sync/plotSyncPending';
import type { Plot } from '@/features/state/AppStateContext';

import type { FarmerActivityItem } from './farmerActivityTypes';

function plotOccurredAt(plot: Plot): string | null {
  if (typeof plot.createdAt === 'number' && Number.isFinite(plot.createdAt)) {
    return new Date(plot.createdAt).toISOString();
  }
  return null;
}

export type BuildFarmerActivityFeedInput = {
  plots: Plot[];
  backendPlots: unknown[];
  plotServerLinks: PlotServerLinks;
  readinessByPlotId: Map<string, PlotReadinessLoadResult>;
  pendingConsentGrants: ConsentGrant[];
  syncPendingCount: number;
  isSignedIn: boolean;
  t: TranslateFn;
};

function pushItem(items: FarmerActivityItem[], seen: Set<string>, item: FarmerActivityItem): void {
  if (seen.has(item.id)) return;
  seen.add(item.id);
  items.push(item);
}

function plotNavigate(plotId: string, plotSub?: 'photos' | 'documents'): FarmerActivityItem['navigate'] {
  return plotSub ? { screen: 'plot', plotId, plotSub } : { screen: 'plot', plotId };
}

function appendDeforestationItems(
  items: FarmerActivityItem[],
  seen: Set<string>,
  plot: Plot,
  backendPlots: unknown[],
  plotServerLinks: PlotServerLinks,
): void {
  const meta = resolveBackendPlotMetaForLocal(plot, backendPlots, plotServerLinks);
  const plotName = plot.name?.trim() || plot.id;

  if (!meta.id) {
    pushItem(items, seen, {
      id: `deforestation:pending-sync:${plot.id}`,
      category: 'deforestation',
      severity: 'action',
      titleKey: 'activity_deforestation_pending_sync',
      titleParams: { plotName },
      occurredAt: plotOccurredAt(plot),
      navigate: plotNavigate(plot.id),
    });
    return;
  }

  const status = resolveBackendPlotComplianceStatus({
    status: meta.status,
    deforestation_screening: meta.deforestationScreening,
  });
  const uiState = deforestationUiStateFromBackendStatus(status);
  const screening = parseDeforestationScreening(meta.deforestationScreening);
  const occurredAt = screening?.screenedAt ?? null;

  switch (uiState) {
    case 'passed':
      pushItem(items, seen, {
        id: `deforestation:passed:${plot.id}`,
        category: 'deforestation',
        severity: 'info',
        titleKey: 'activity_deforestation_passed',
        titleParams: { plotName },
        occurredAt,
        navigate: plotNavigate(plot.id),
      });
      break;
    case 'under_review':
      pushItem(items, seen, {
        id: `deforestation:review:${plot.id}`,
        category: 'deforestation',
        severity: 'info',
        titleKey: 'activity_deforestation_under_review',
        titleParams: { plotName },
        occurredAt,
        navigate: plotNavigate(plot.id),
      });
      break;
    case 'at_risk':
      pushItem(items, seen, {
        id: `deforestation:risk:${plot.id}`,
        category: 'deforestation',
        severity: 'action',
        titleKey: 'activity_deforestation_at_risk',
        titleParams: { plotName },
        occurredAt,
        navigate: plotNavigate(plot.id),
      });
      break;
    case 'alert':
      pushItem(items, seen, {
        id: `deforestation:alert:${plot.id}`,
        category: 'deforestation',
        severity: 'action',
        titleKey: 'activity_deforestation_alert',
        titleParams: { plotName },
        occurredAt,
        navigate: plotNavigate(plot.id),
      });
      break;
    default:
      pushItem(items, seen, {
        id: `deforestation:pending:${plot.id}`,
        category: 'deforestation',
        severity: 'action',
        titleKey: 'activity_deforestation_pending_check',
        titleParams: { plotName },
        occurredAt: plotOccurredAt(plot),
        navigate: plotNavigate(plot.id),
      });
      break;
  }
}

function appendLandDocumentItems(
  items: FarmerActivityItem[],
  seen: Set<string>,
  plot: Plot,
  readiness: PlotReadinessLoadResult | undefined,
  backendPlots: unknown[],
  plotServerLinks: PlotServerLinks,
): void {
  if (!readiness) return;
  const plotName = plot.name?.trim() || plot.id;
  const meta = resolveBackendPlotMetaForLocal(plot, backendPlots, plotServerLinks);
  const landStatus = resolveLandDocumentsUiStatus({
    titlePhotoCount: readiness.titlePhotoCount,
    evidenceKinds:
      readiness.evidenceCount > 0 ? (['tenure_evidence'] as const) : [],
    tenureParseGate: readiness.checklist.tenureParseGate,
  });

  switch (landStatus) {
    case 'blocked':
      pushItem(items, seen, {
        id: `land:blocked:${plot.id}`,
        category: 'land_documents',
        severity: 'action',
        titleKey: 'activity_land_docs_blocked',
        titleParams: { plotName },
        occurredAt: plotOccurredAt(plot),
        navigate: plotNavigate(plot.id, 'documents'),
      });
      break;
    case 'reviewing':
      pushItem(items, seen, {
        id: `land:reviewing:${plot.id}`,
        category: 'land_documents',
        severity: 'info',
        titleKey: 'activity_land_docs_reviewing',
        titleParams: { plotName },
        occurredAt: plotOccurredAt(plot),
        navigate: plotNavigate(plot.id, 'documents'),
      });
      break;
    case 'awaiting_upload':
    case 'local_only':
      if (readiness.titlePhotoCount > 0 || readiness.evidenceCount > 0) {
        pushItem(items, seen, {
          id: `land:upload:${plot.id}`,
          category: 'land_documents',
          severity: 'action',
          titleKey: 'activity_land_docs_upload',
          titleParams: { plotName },
          occurredAt: plotOccurredAt(plot),
          navigate: plotNavigate(plot.id, 'documents'),
        });
      }
      break;
    case 'verified':
      if (meta.id) {
        pushItem(items, seen, {
          id: `land:verified:${plot.id}`,
          category: 'land_documents',
          severity: 'info',
          titleKey: 'activity_land_docs_verified',
          titleParams: { plotName },
          occurredAt: plotOccurredAt(plot),
          navigate: plotNavigate(plot.id, 'documents'),
        });
      }
      break;
    default:
      break;
  }
}

function appendPlotSetupItems(
  items: FarmerActivityItem[],
  seen: Set<string>,
  plot: Plot,
  readiness: PlotReadinessLoadResult | undefined,
): void {
  if (!readiness || readiness.checklist.groundOk) return;
  const plotName = plot.name?.trim() || plot.id;
  pushItem(items, seen, {
    id: `setup:photos:${plot.id}`,
    category: 'plot_setup',
    severity: 'action',
    titleKey: 'activity_plot_photos_needed',
    titleParams: { plotName },
    occurredAt: plotOccurredAt(plot),
    navigate: plotNavigate(plot.id, 'photos'),
  });
}

function appendBoundaryItems(
  items: FarmerActivityItem[],
  seen: Set<string>,
  plot: Plot,
  plots: Plot[],
  t: TranslateFn,
): void {
  const block = getPlotUploadGeometryBlock(plot, plots, t);
  if (!block) return;
  const plotName = plot.name?.trim() || plot.id;
  pushItem(items, seen, {
    id: `boundary:${plot.id}`,
    category: 'boundary',
    severity: 'action',
    titleKey: 'activity_boundary_fix',
    titleParams: { plotName },
    occurredAt: plotOccurredAt(plot),
    navigate: plotNavigate(plot.id),
  });
}

function appendConsentItems(
  items: FarmerActivityItem[],
  seen: Set<string>,
  grants: ConsentGrant[],
): void {
  for (const grant of grants) {
    if (grant.status !== 'pending') continue;
    const orgName = grant.grantee_org_name?.trim() || grant.grantee_tenant_id;
    pushItem(items, seen, {
      id: `consent:${grant.id}`,
      category: 'consent',
      severity: 'action',
      titleKey: 'activity_consent_request',
      titleParams: { orgName },
      occurredAt: grant.created_at ?? null,
      navigate: { screen: 'data-sharing' },
    });
  }
}

function sortActivityItems(items: FarmerActivityItem[]): FarmerActivityItem[] {
  return [...items].sort((a, b) => {
    if (a.severity !== b.severity) {
      return a.severity === 'action' ? -1 : 1;
    }
    const aTime = a.occurredAt ? Date.parse(a.occurredAt) : 0;
    const bTime = b.occurredAt ? Date.parse(b.occurredAt) : 0;
    if (aTime !== bTime) return bTime - aTime;
    return a.id.localeCompare(b.id);
  });
}

export function buildFarmerActivityFeed(input: BuildFarmerActivityFeedInput): FarmerActivityItem[] {
  if (!input.isSignedIn) return [];

  const items: FarmerActivityItem[] = [];
  const seen = new Set<string>();

  for (const plot of input.plots) {
    const readiness = input.readinessByPlotId.get(plot.id);
    appendBoundaryItems(items, seen, plot, input.plots, input.t);
    appendDeforestationItems(items, seen, plot, input.backendPlots, input.plotServerLinks);
    appendLandDocumentItems(
      items,
      seen,
      plot,
      readiness,
      input.backendPlots,
      input.plotServerLinks,
    );
    appendPlotSetupItems(items, seen, plot, readiness);
  }

  appendConsentItems(items, seen, input.pendingConsentGrants);

  if (input.syncPendingCount > 0) {
    pushItem(items, seen, {
      id: 'sync:pending',
      category: 'sync',
      severity: 'action',
      titleKey: 'activity_sync_pending',
      titleParams: { n: input.syncPendingCount },
      occurredAt: new Date().toISOString(),
      navigate: { screen: 'backup' },
    });
  }

  return sortActivityItems(items);
}

export function countActivityActions(items: FarmerActivityItem[]): number {
  return items.filter((item) => item.severity === 'action').length;
}
