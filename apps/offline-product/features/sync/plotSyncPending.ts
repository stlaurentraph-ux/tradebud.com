import type { Plot } from '@/features/state/AppStateContext';
import {
  assessPlotGeometryQuality,
  buildPlotOverlapSupportMailto,
  localPlotRefsForGeometry,
  resolvePlotUploadBlockMessage,
  type PlotUploadBlockDetails,
} from '@/features/compliance/plotGeometryQuality';
import type { TranslateFn } from '@/features/i18n/translate';
import {
  canTrustPersistedPlotServerLink,
  type BackendPlotRow,
} from '@/features/plots/backendPlotMatch';
import { resolveConfirmedServerPlotIdForLocal } from '@/features/plots/plotServerLink';

export type PlotSyncBlockInfo = PlotUploadBlockDetails & {
  plotId: string;
  plotName: string;
  supportMailto: string;
};

export type PlotSyncPendingRow = {
  plot: Plot;
  state: 'synced' | 'needs_upload' | 'blocked_geometry';
  block?: PlotSyncBlockInfo;
};

function findBackendRowById(backendPlots: unknown[], serverPlotId: string): BackendPlotRow | null {
  const row = (backendPlots as BackendPlotRow[]).find(
    (entry) => String(entry?.id ?? '').trim() === serverPlotId,
  );
  return row ?? null;
}

/** Confirmed on server via client id match, or a persisted device link still on the server. */
export function isLocalPlotConfirmedOnServer(
  localPlot: Plot,
  backendPlots: unknown[],
  plotServerLinks?: Record<string, string> | null,
  localPlotIds?: ReadonlySet<string>,
): boolean {
  if (
    resolveConfirmedServerPlotIdForLocal(
      {
        id: localPlot.id,
        name: localPlot.name,
        areaHectares: localPlot.areaHectares,
        kind: localPlot.kind,
      },
      backendPlots,
      plotServerLinks,
      { localPlotIds },
    ) != null
  ) {
    return true;
  }

  const ids = localPlotIds ?? new Set([localPlot.id]);
  const persisted = plotServerLinks?.[localPlot.id]?.trim();
  if (!persisted || backendPlots.length === 0) {
    return false;
  }

  const row = findBackendRowById(backendPlots, persisted);
  if (!row) return false;
  return canTrustPersistedPlotServerLink(row, localPlot.id, persisted, ids);
}

/** Local geometry that would block Backup → Sync upload (overlap, self-cross, micro/sliver). */
export function getPlotUploadGeometryBlock(
  plot: Plot,
  localPlots: Plot[],
  t: TranslateFn,
): PlotSyncBlockInfo | null {
  if (plot.points.length === 0) return null;

  const quality = assessPlotGeometryQuality({
    kind: plot.kind,
    points: plot.points,
    areaHa: plot.areaHectares,
    otherPlots: localPlotRefsForGeometry(localPlots, plot.id),
    excludePlotId: plot.id,
    phase: 'upload',
  });
  if (quality.blockingIssues.length === 0) return null;

  const details = resolvePlotUploadBlockMessage({
    plotName: plot.name?.trim() || plot.id,
    issues: quality.blockingIssues,
    t,
  });
  if (!details) return null;

  return {
    plotId: plot.id,
    plotName: plot.name?.trim() || plot.id,
    ...details,
    supportMailto: buildPlotOverlapSupportMailto({
      plotName: plot.name?.trim() || plot.id,
      otherPlotName: details.overlapPlotName ?? 'another plot',
      plotId: plot.id,
    }),
  };
}

export function classifyLocalPlotSyncPending(params: {
  localPlots: Plot[];
  backendPlots: unknown[];
  plotServerLinks?: Record<string, string> | null;
  t: TranslateFn;
  /** When server list is unavailable, trust saved links instead of marking everything unsynced. */
  trustPersistedLinksWithoutServer?: boolean;
}): PlotSyncPendingRow[] {
  const links = params.plotServerLinks ?? {};
  const backendPlots = params.backendPlots ?? [];
  const localPlotIds = new Set(params.localPlots.map((plot) => plot.id));

  return params.localPlots.map((plot) => {
    const persisted = links[plot.id]?.trim();
    if (params.trustPersistedLinksWithoutServer && persisted && backendPlots.length === 0) {
      return { plot, state: 'synced' as const };
    }

    if (isLocalPlotConfirmedOnServer(plot, backendPlots, links, localPlotIds)) {
      return { plot, state: 'synced' as const };
    }

    const block = getPlotUploadGeometryBlock(plot, params.localPlots, params.t);
    if (block) {
      return { plot, state: 'blocked_geometry' as const, block };
    }

    return { plot, state: 'needs_upload' as const };
  });
}

export function summarizePlotSyncPending(rows: PlotSyncPendingRow[]): {
  syncedCount: number;
  needsUploadPlots: Plot[];
  blockedPlots: PlotSyncBlockInfo[];
  unsyncedPlotNames: string[];
  totalPlotAttention: number;
} {
  const needsUploadPlots: Plot[] = [];
  const blockedPlots: PlotSyncBlockInfo[] = [];

  for (const row of rows) {
    if (row.state === 'needs_upload') {
      needsUploadPlots.push(row.plot);
    } else if (row.state === 'blocked_geometry' && row.block) {
      blockedPlots.push(row.block);
    }
  }

  return {
    syncedCount: rows.filter((row) => row.state === 'synced').length,
    needsUploadPlots,
    blockedPlots,
    unsyncedPlotNames: needsUploadPlots.map((plot) => plot.name?.trim() || plot.id).filter(Boolean),
    totalPlotAttention: needsUploadPlots.length + blockedPlots.length,
  };
}

/** Legacy helper — plots missing on server excluding geometry-blocked ones. */
export function listPlotsNeedingServerUpload(
  localPlots: Plot[],
  backendPlots: unknown[],
  plotServerLinks?: Record<string, string> | null,
): Plot[] {
  const localPlotIds = new Set(localPlots.map((plot) => plot.id));
  return localPlots.filter(
    (plot) => !isLocalPlotConfirmedOnServer(plot, backendPlots, plotServerLinks, localPlotIds),
  );
}

export function listUnsyncedLocalPlots(
  localPlots: Plot[],
  backendPlots: unknown[],
  plotServerLinks?: Record<string, string> | null,
): Plot[] {
  return listPlotsNeedingServerUpload(localPlots, backendPlots, plotServerLinks);
}

/** Settings/home chip before server list settles — honour saved device links offline. */
export function estimatePlotSyncAttention(params: {
  localPlots: Plot[];
  backendPlots: unknown[];
  plotServerLinks?: Record<string, string> | null;
  t: TranslateFn;
}) {
  const backendPlots = params.backendPlots ?? [];
  return summarizePlotSyncPending(
    classifyLocalPlotSyncPending({
      localPlots: params.localPlots,
      backendPlots,
      plotServerLinks: params.plotServerLinks,
      t: params.t,
      trustPersistedLinksWithoutServer: backendPlots.length === 0,
    }),
  );
}
