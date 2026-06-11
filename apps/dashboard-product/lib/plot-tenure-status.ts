export type PlotTenurePath = 'formal' | 'producer_in_possession' | 'undeclared';

export type PlotTenureStatusBadge =
  | 'formal_documented'
  | 'producer_in_possession'
  | 'attestation_only'
  | 'missing';

export type PlotTenureStatus = {
  path: PlotTenurePath;
  badge: PlotTenureStatusBadge;
  hasDocumentation: boolean;
};

export function computePlotTenureStatus(params: {
  informalTenure: boolean | null;
  cadastralKey: string | null;
  tenureEvidenceCount: number;
  landTenureDeclared?: boolean | null;
}): PlotTenureStatus {
  const cadastral = params.cadastralKey?.trim() ?? '';
  const hasCadastral = cadastral.length > 0;
  const hasTenureFiles = params.tenureEvidenceCount > 0;
  const hasDocumentation = hasCadastral || hasTenureFiles;
  const informal = params.informalTenure === true;
  const attestationsComplete = params.landTenureDeclared === true;

  let path: PlotTenurePath = 'undeclared';
  if (informal) {
    path = 'producer_in_possession';
  } else if (hasCadastral || hasTenureFiles) {
    path = 'formal';
  }

  let badge: PlotTenureStatusBadge = 'missing';
  if (hasDocumentation && informal) {
    badge = 'producer_in_possession';
  } else if (hasDocumentation) {
    badge = 'formal_documented';
  } else if (attestationsComplete) {
    badge = 'attestation_only';
  }

  return {
    path,
    badge,
    hasDocumentation,
  };
}

export function tenureBadgeLabel(badge: PlotTenureStatusBadge): string {
  switch (badge) {
    case 'formal_documented':
      return 'Documented';
    case 'producer_in_possession':
      return 'Producer in possession';
    case 'attestation_only':
      return 'Attestation only';
    default:
      return 'Missing documentation';
  }
}

export function tenurePathLabel(path: PlotTenurePath): string {
  switch (path) {
    case 'producer_in_possession':
      return 'Producer in possession';
    case 'formal':
      return 'Formal title / cadastral';
    default:
      return 'Not declared yet';
  }
}
