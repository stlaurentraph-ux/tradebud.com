import type {
  FieldEnumerationMappingRegion,
  FieldEnumerationPackMember,
} from './field-enumeration-pack.types';

export type EnumerationProgressMemberRow = FieldEnumerationPackMember & {
  isProvisional: boolean;
  geometryPendingApproval: number;
};

export type EnumerationCampaignProgress = {
  campaignId: string;
  campaignTitle: string;
  mappingRegionConfigured: boolean;
  mappingRegion: FieldEnumerationMappingRegion | null;
  totals: {
    rosterMembers: number;
    membersWithPlots: number;
    plotsCaptured: number;
    provisionalPendingReview: number;
    plotsPendingGeometryApproval: number;
  };
  members: EnumerationProgressMemberRow[];
};

export function summarizeEnumerationProgress(input: {
  members: Array<FieldEnumerationPackMember & { isProvisional?: boolean; geometryPendingApproval?: number }>;
  provisionalPendingReview: number;
  mappingRegionConfigured: boolean;
  mappingRegion: FieldEnumerationMappingRegion | null;
  campaignId: string;
  campaignTitle: string;
}): EnumerationCampaignProgress {
  const members: EnumerationProgressMemberRow[] = input.members.map((member) => ({
    ...member,
    isProvisional: member.isProvisional ?? false,
    geometryPendingApproval: member.geometryPendingApproval ?? 0,
  }));

  const rosterMembers = members.length;
  const membersWithPlots = members.filter((member) => member.plotCount > 0).length;
  const plotsCaptured = members.reduce((sum, member) => sum + member.plotCount, 0);
  const plotsPendingGeometryApproval = members.reduce(
    (sum, member) => sum + member.geometryPendingApproval,
    0,
  );

  return {
    campaignId: input.campaignId,
    campaignTitle: input.campaignTitle,
    mappingRegionConfigured: input.mappingRegionConfigured,
    mappingRegion: input.mappingRegion,
    totals: {
      rosterMembers,
      membersWithPlots,
      plotsCaptured,
      provisionalPendingReview: input.provisionalPendingReview,
      plotsPendingGeometryApproval,
    },
    members,
  };
}

export function validateMappingRegionInput(input: {
  label?: string | null;
  west?: number | null;
  south?: number | null;
  east?: number | null;
  north?: number | null;
}): { label: string; west: number; south: number; east: number; north: number } {
  const label = input.label?.trim();
  if (!label) {
    throw new Error('mapping_region_label is required');
  }
  const west = Number(input.west);
  const south = Number(input.south);
  const east = Number(input.east);
  const north = Number(input.north);
  if (![west, south, east, north].every(Number.isFinite)) {
    throw new Error('mapping region bbox coordinates must be finite numbers');
  }
  if (west >= east || south >= north) {
    throw new Error('mapping region bbox must have west < east and south < north');
  }
  if (west < -180 || east > 180 || south < -90 || north > 90) {
    throw new Error('mapping region bbox is out of valid lat/lng bounds');
  }
  return { label, west, south, east, north };
}
