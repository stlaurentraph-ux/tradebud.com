import type { PlotReadinessChecklist } from '@/features/compliance/plotChecklist';

export type PlotDocumentChipVariant = 'success' | 'warning' | 'info' | 'default';

export type PlotDocumentOverviewStatus = {
  /** Lower sorts first (needs attention at top). */
  priority: number;
  chipKey: string;
  chipVariant: PlotDocumentChipVariant;
  chipParams?: Record<string, string | number>;
};

export function summarizePlotDocumentsForOverview(
  checklist: PlotReadinessChecklist,
  counts: { titlePhotos: number; evidenceCount: number },
): PlotDocumentOverviewStatus {
  const docCount = counts.titlePhotos + counts.evidenceCount;

  if (checklist.tenureParseGate === 'blocked') {
    return { priority: 0, chipKey: 'documents_plot_chip_blocked', chipVariant: 'warning' };
  }
  if (!checklist.landOk) {
    return { priority: 10, chipKey: 'documents_plot_chip_land_missing', chipVariant: 'warning' };
  }
  if (checklist.needsPermit && !checklist.permitOk) {
    return { priority: 20, chipKey: 'documents_plot_chip_permit', chipVariant: 'warning' };
  }
  if (checklist.needsFpic && !checklist.fpicOk) {
    return { priority: 25, chipKey: 'documents_plot_chip_fpic', chipVariant: 'warning' };
  }
  if (checklist.tenureParseGate === 'pending') {
    return { priority: 30, chipKey: 'documents_plot_chip_reviewing', chipVariant: 'info' };
  }
  if (!checklist.syncOk && docCount > 0) {
    return {
      priority: 40,
      chipKey: 'documents_plot_chip_backup_pending',
      chipVariant: 'info',
      chipParams: { n: docCount },
    };
  }
  if (
    checklist.landOk &&
    (!checklist.needsPermit || checklist.permitOk) &&
    (!checklist.needsFpic || checklist.fpicOk)
  ) {
    return {
      priority: 100,
      chipKey: 'documents_plot_chip_complete',
      chipVariant: 'success',
      chipParams: docCount > 0 ? { n: docCount } : undefined,
    };
  }
  return {
    priority: 50,
    chipKey: 'documents_plot_chip_partial',
    chipVariant: 'default',
    chipParams: { n: docCount },
  };
}

export function formatPlotDocumentsNavSubtitle(
  checklist: Pick<
    PlotReadinessChecklist,
    'landOk' | 'tenureParseGate' | 'needsFpic' | 'needsPermit' | 'fpicOk' | 'permitOk' | 'syncOk'
  >,
  counts: { titlePhotos: number; evidenceCount: number },
  t: (key: string, params?: Record<string, string | number>) => string,
): string {
  const docCount = counts.titlePhotos + counts.evidenceCount;

  if (checklist.tenureParseGate === 'blocked') {
    return t('plot_nav_documents_sub_blocked');
  }
  if (!checklist.landOk) {
    return t('plot_nav_documents_sub_add_land');
  }
  if (checklist.needsPermit && !checklist.permitOk) {
    return t('plot_nav_documents_sub_permit');
  }
  if (checklist.needsFpic && !checklist.fpicOk) {
    return t('plot_nav_documents_sub_fpic');
  }
  if (checklist.tenureParseGate === 'pending') {
    return t('plot_nav_documents_sub_reviewing');
  }
  if (!checklist.syncOk && docCount > 0) {
    return t('plot_nav_documents_sub_backup', { n: docCount });
  }
  if (docCount === 0) {
    return t('plot_nav_documents_sub_empty');
  }
  return t('plot_nav_documents_sub_done', { n: docCount });
}

export function countPlotsNeedingLandDocuments(
  readiness: { checklist: PlotReadinessChecklist }[],
): number {
  return readiness.filter((r) => !r.checklist.landOk).length;
}
