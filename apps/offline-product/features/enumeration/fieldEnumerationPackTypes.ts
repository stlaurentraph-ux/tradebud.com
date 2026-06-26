export type FieldEnumerationMappingRegion = {
  label: string;
  bbox: {
    west: number;
    south: number;
    east: number;
    north: number;
  };
};

export type FieldEnumerationPackMember = {
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
};

export type FieldEnumerationPackResponse = {
  campaignId: string | null;
  campaignTitle: string | null;
  mappingRegion: FieldEnumerationMappingRegion | null;
  prefetchedAt: string;
  members: FieldEnumerationPackMember[];
};

export type SyncEnumerationProvisionalResult = {
  ok: true;
  farmerId: string;
  producerContactId: string | null;
  duplicateWarnings: Array<{ reason: string; producerContactId?: string | null }>;
};
