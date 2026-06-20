import type { TenureParseGateStatus } from '@/features/compliance/plotChecklist';

export type PlotTenurePath = 'formal' | 'producer_in_possession' | 'undeclared';

export type PlotTenureStatusBadge =
  | 'formal_documented'
  | 'producer_in_possession'
  | 'attestation_only'
  | 'missing'
  | 'documentation_reviewing'
  | 'documentation_blocked'
  | 'documentation_local_only';

export type PlotTenureStatus = {
  path: PlotTenurePath;
  badge: PlotTenureStatusBadge;
  hasDocumentation: boolean;
  attestationsComplete: boolean;
};

export function computePlotTenureStatus(params: {
  informalTenure: boolean;
  cadastralKey: string | null;
  titlePhotoCount: number;
  tenureEvidenceCount: number;
  landTenureDeclared?: boolean;
  noDeforestationDeclared?: boolean;
  /** When land papers are uploaded — gates the success badge until review clears. */
  tenureParseGate?: TenureParseGateStatus;
}): PlotTenureStatus {
  const cadastral = params.cadastralKey?.trim() ?? '';
  const hasCadastral = cadastral.length > 0;
  const hasTitlePhotos = params.titlePhotoCount > 0;
  const hasTenureFiles = params.tenureEvidenceCount > 0;
  const hasDocumentation = hasCadastral || hasTitlePhotos || hasTenureFiles;
  const attestationsComplete =
    params.landTenureDeclared === true && params.noDeforestationDeclared === true;

  let path: PlotTenurePath = 'undeclared';
  if (params.informalTenure) {
    path = 'producer_in_possession';
  } else if (hasCadastral || hasTitlePhotos) {
    path = 'formal';
  } else if (hasTenureFiles) {
    path = 'formal';
  }

  let badge: PlotTenureStatusBadge = 'missing';
  if (hasDocumentation && params.informalTenure) {
    badge = 'producer_in_possession';
  } else if (hasDocumentation) {
    badge = 'formal_documented';
  } else if (attestationsComplete) {
    badge = 'attestation_only';
  }

  if (hasDocumentation && params.tenureParseGate) {
    switch (params.tenureParseGate) {
      case 'blocked':
        badge = 'documentation_blocked';
        break;
      case 'pending':
        badge = 'documentation_reviewing';
        break;
      case 'documents_local_only':
        badge = 'documentation_local_only';
        break;
      case 'not_synced':
        badge = 'documentation_local_only';
        break;
      case 'cleared':
        if (params.informalTenure) {
          badge = 'producer_in_possession';
        } else if (hasDocumentation) {
          badge = 'formal_documented';
        }
        break;
      case 'not_applicable':
        break;
    }
  }

  return {
    path,
    badge,
    hasDocumentation,
    attestationsComplete,
  };
}
