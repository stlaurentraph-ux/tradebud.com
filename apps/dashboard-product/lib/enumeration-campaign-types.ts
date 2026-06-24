export type EnumerationMappingRegion = {
  label: string;
  bbox: {
    west: number;
    south: number;
    east: number;
    north: number;
  };
};

export type EnumerationCampaignProgressMember = {
  farmerId: string;
  fullName: string;
  village: string | null;
  phone: string | null;
  nationalId: string | null;
  email: string | null;
  producerContactId: string | null;
  assignmentId: string | null;
  plotCount: number;
  source: 'roster';
  isProvisional: boolean;
  geometryPendingApproval: number;
};

export type EnumerationCampaignProgress = {
  campaignId: string;
  campaignTitle: string;
  mappingRegionConfigured: boolean;
  mappingRegion: EnumerationMappingRegion | null;
  totals: {
    rosterMembers: number;
    membersWithPlots: number;
    plotsCaptured: number;
    provisionalPendingReview: number;
    plotsPendingGeometryApproval: number;
  };
  members: EnumerationCampaignProgressMember[];
};

export type MappingRegionFormState = {
  label: string;
  west: string;
  south: string;
  east: string;
  north: string;
};

export function mappingRegionToFormState(region: EnumerationMappingRegion | null): MappingRegionFormState {
  if (!region) {
    return { label: '', west: '', south: '', east: '', north: '' };
  }
  return {
    label: region.label,
    west: String(region.bbox.west),
    south: String(region.bbox.south),
    east: String(region.bbox.east),
    north: String(region.bbox.north),
  };
}

export function parseMappingRegionForm(form: MappingRegionFormState): EnumerationMappingRegion {
  const label = form.label.trim();
  const west = Number(form.west);
  const south = Number(form.south);
  const east = Number(form.east);
  const north = Number(form.north);
  if (!label) {
    throw new Error('Region label is required.');
  }
  if (![west, south, east, north].every(Number.isFinite)) {
    throw new Error('All bounding box coordinates must be valid numbers.');
  }
  if (west >= east || south >= north) {
    throw new Error('West must be less than east and south must be less than north.');
  }
  return { label, bbox: { west, south, east, north } };
}
