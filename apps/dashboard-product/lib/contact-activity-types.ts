/**
 * Supply-chain activity classification for CRM contacts / supplier network.
 * Top-level `contact_type` plus optional `processing_subtype` when type is processing_facility.
 */
export const CONTACT_ACTIVITY_TYPES = [
  'farmer',
  'cooperative',
  'processing_facility',
  'trader',
  'exporter',
  'other',
] as const;

export const PROCESSING_FACILITY_SUBTYPES = [
  'washing_station',
  'dry_mill',
  'hulling_sorting',
  'transformation_plant',
  'other',
] as const;

export type ContactActivityType = (typeof CONTACT_ACTIVITY_TYPES)[number];
export type ProcessingFacilitySubtype = (typeof PROCESSING_FACILITY_SUBTYPES)[number];

/** @deprecated Use ContactActivityType — kept for existing imports */
export type ContactType = ContactActivityType;

export interface ContactActivityClassification {
  contact_type: ContactActivityType;
  processing_subtype: ProcessingFacilitySubtype | null;
}

function normalizeKey(raw: string | null | undefined): string {
  return (raw ?? '').trim().toLowerCase().replace(/[\s-]+/g, '_');
}

const TOP_LEVEL_ALIASES: Record<string, ContactActivityType> = {
  producer: 'farmer',
  producers: 'farmer',
  farm: 'farmer',
  smallholder: 'farmer',
  member: 'farmer',
  coop: 'cooperative',
  co_op: 'cooperative',
  union: 'cooperative',
  mill: 'processing_facility',
  factory: 'processing_facility',
  processing: 'processing_facility',
  processing_facility: 'processing_facility',
  processing_plant: 'processing_facility',
  transformation_plant: 'processing_facility',
  transformative_plant: 'processing_facility',
  transform: 'processing_facility',
  trader: 'trader',
  broker: 'trader',
  intermediary: 'trader',
  supplier: 'other',
  suppliers: 'other',
};

const PROCESSING_SUBTYPE_ALIASES: Record<string, ProcessingFacilitySubtype> = {
  washing_station: 'washing_station',
  washing: 'washing_station',
  washing_facility: 'washing_station',
  washing_plant: 'washing_station',
  wet_mill: 'washing_station',
  dry_mill: 'dry_mill',
  drymill: 'dry_mill',
  hulling: 'hulling_sorting',
  hulling_sorting: 'hulling_sorting',
  sorting: 'hulling_sorting',
  transformation_plant: 'transformation_plant',
  processing_plant: 'transformation_plant',
  transform: 'transformation_plant',
};

export function normalizeProcessingSubtype(
  raw: string | null | undefined,
): ProcessingFacilitySubtype | null {
  const normalized = normalizeKey(raw);
  if (!normalized) return null;
  if ((PROCESSING_FACILITY_SUBTYPES as readonly string[]).includes(normalized)) {
    return normalized as ProcessingFacilitySubtype;
  }
  return PROCESSING_SUBTYPE_ALIASES[normalized] ?? null;
}

export function normalizeContactActivityType(raw: string | null | undefined): ContactActivityType {
  const normalized = normalizeKey(raw);
  if (!normalized) return 'other';
  if (PROCESSING_SUBTYPE_ALIASES[normalized]) {
    return 'processing_facility';
  }
  if ((CONTACT_ACTIVITY_TYPES as readonly string[]).includes(normalized)) {
    return normalized as ContactActivityType;
  }
  return TOP_LEVEL_ALIASES[normalized] ?? 'other';
}

export function parseContactActivityClassification(
  activityRaw: string | null | undefined,
  subtypeRaw?: string | null | undefined,
): ContactActivityClassification {
  const normalizedActivity = normalizeKey(activityRaw);
  const explicitSubtype = normalizeProcessingSubtype(subtypeRaw);
  const subtypeFromActivity = PROCESSING_SUBTYPE_ALIASES[normalizedActivity];

  if (subtypeFromActivity) {
    return {
      contact_type: 'processing_facility',
      processing_subtype: explicitSubtype ?? subtypeFromActivity,
    };
  }

  const contact_type = normalizeContactActivityType(activityRaw);
  if (contact_type === 'processing_facility') {
    return { contact_type, processing_subtype: explicitSubtype };
  }
  if (explicitSubtype) {
    return { contact_type: 'processing_facility', processing_subtype: explicitSubtype };
  }
  return { contact_type, processing_subtype: null };
}

export function listProcessingFacilitySubtypes(): ProcessingFacilitySubtype[] {
  return [...PROCESSING_FACILITY_SUBTYPES];
}

export function listContactActivityTypesForRole(
  role: ContactDirectoryRole | undefined,
): ContactActivityType[] {
  if (role === 'cooperative') {
    return ['farmer', 'cooperative', 'other'];
  }
  if (role === 'importer') {
    return ['exporter', 'cooperative', 'trader', 'processing_facility', 'other'];
  }
  if (role === 'exporter') {
    return ['cooperative', 'farmer', 'processing_facility', 'trader', 'exporter', 'other'];
  }
  return [...CONTACT_ACTIVITY_TYPES];
}

/** CRM contact UI roles — maps full TenantRole (e.g. country_reviewer) to directory behavior. */
export type ContactDirectoryRole = 'cooperative' | 'exporter' | 'importer' | 'other';

export function resolveContactDirectoryRole(role: string | undefined): ContactDirectoryRole {
  if (role === 'cooperative' || role === 'exporter' || role === 'importer') {
    return role;
  }
  return 'other';
}
