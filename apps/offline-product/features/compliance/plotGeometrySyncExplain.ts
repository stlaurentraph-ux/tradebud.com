import type { TranslateFn } from '@/features/i18n/translate';
import type { PlotSyncBlockInfo } from '@/features/sync/plotSyncPending';

export type GeometrySyncWhyExplain = {
  title: string;
  body: string;
};

function isMicroAreaBlock(block: PlotSyncBlockInfo): boolean {
  const message = block.message.toLowerCase();
  return message.includes('very small') || message.includes('too small');
}

/** Farmer-facing “why + next step” for a single geometry upload block. */
export function resolveGeometrySyncWhyExplain(
  block: PlotSyncBlockInfo,
  t: TranslateFn,
): GeometrySyncWhyExplain | null {
  const plotName = block.plotName?.trim() || t('geo_quality_overlap_unknown');

  switch (block.code) {
    case 'GEO-105':
      return {
        title: t('geo_sync_why_overlap_title'),
        body: t('geo_sync_why_overlap_body', {
          plotName,
          otherPlotName: block.overlapPlotName?.trim() || t('geo_quality_overlap_unknown'),
        }),
      };
    case 'GEO-104':
      return {
        title: t('geo_sync_why_self_intersect_title'),
        body: t('geo_sync_why_self_intersect_body', { plotName }),
      };
    case 'GEO-106':
      if (isMicroAreaBlock(block)) {
        return {
          title: t('geo_sync_why_micro_title'),
          body: t('geo_sync_why_micro_body', { plotName }),
        };
      }
      return {
        title: t('geo_sync_why_sliver_title'),
        body: t('geo_sync_why_sliver_body', { plotName }),
      };
    default:
      return null;
  }
}

/** Show “Why?” when exactly one plot is blocked for a known geometry rule. */
export function primaryGeometryBlockForWhy(
  blockedPlots: PlotSyncBlockInfo[] | undefined,
): PlotSyncBlockInfo | null {
  if (!blockedPlots || blockedPlots.length !== 1) return null;
  const block = blockedPlots[0];
  if (!block?.code) return null;
  if (block.code === 'GEO-104' || block.code === 'GEO-105' || block.code === 'GEO-106') {
    return block;
  }
  return null;
}
