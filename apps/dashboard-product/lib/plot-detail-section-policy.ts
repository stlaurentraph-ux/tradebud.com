import type { TenantRole } from '@/types';
import { canViewPlotFieldOperations } from '@/lib/plot-detail-field-ops';
import { normalizeComplianceStatus } from '@/lib/plot-inventory';

export type PlotDetailSectionId = 'documents' | 'screening' | 'field_ops';

export function isPlotScreeningClear(status: string | null | undefined): boolean {
  const normalized = normalizeComplianceStatus(status ?? '');
  return normalized === 'compliant';
}

export function getDefaultPlotDetailSectionOpen(input: {
  role: TenantRole | null | undefined;
  hasGaps: boolean;
  screeningClear: boolean;
}): Record<PlotDetailSectionId, boolean> {
  const { role, hasGaps, screeningClear } = input;

  if (role === 'cooperative') {
    return {
      documents: hasGaps,
      screening: !screeningClear,
      field_ops: false,
    };
  }

  if (role === 'importer' || role === 'country_reviewer') {
    return {
      documents: hasGaps,
      screening: !screeningClear,
      field_ops: false,
    };
  }

  return {
    documents: hasGaps,
    screening: !screeningClear,
    field_ops: false,
  };
}

export function canRunPlotDeforestationScreening(role: TenantRole | null | undefined): boolean {
  return role === 'exporter' || role === 'cooperative' || role === 'admin';
}

export function shouldShowPlotDetailSection(
  section: PlotDetailSectionId,
  role: TenantRole | null | undefined,
): boolean {
  if (section === 'field_ops') {
    return canViewPlotFieldOperations(role);
  }
  return true;
}
