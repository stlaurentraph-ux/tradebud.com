/**
 * Supply-chain activity classification for CRM contacts / supplier network.
 * Stored in `crm_contacts.contact_type` (see backend migration tb_v16_041).
 */
export const CONTACT_ACTIVITY_TYPES = [
  'farmer',
  'cooperative',
  'washing_station',
  'processing_facility',
  'trader',
  'exporter',
  'other',
] as const;

export type ContactActivityType = (typeof CONTACT_ACTIVITY_TYPES)[number];

/** @deprecated Use ContactActivityType — kept for existing imports */
export type ContactType = ContactActivityType;

const ACTIVITY_ALIASES: Record<string, ContactActivityType> = {
  producer: 'farmer',
  producers: 'farmer',
  farm: 'farmer',
  smallholder: 'farmer',
  member: 'farmer',
  coop: 'cooperative',
  co_op: 'cooperative',
  union: 'cooperative',
  washing: 'washing_station',
  washing_station: 'washing_station',
  washing_facility: 'washing_station',
  washing_plant: 'washing_station',
  wet_mill: 'washing_station',
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

export function normalizeContactActivityType(raw: string | null | undefined): ContactActivityType {
  const normalized = (raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
  if (!normalized) return 'other';
  if ((CONTACT_ACTIVITY_TYPES as readonly string[]).includes(normalized)) {
    return normalized as ContactActivityType;
  }
  return ACTIVITY_ALIASES[normalized] ?? 'other';
}

export function listContactActivityTypesForRole(
  role: 'cooperative' | 'exporter' | 'importer' | 'other' | undefined,
): ContactActivityType[] {
  if (role === 'cooperative') {
    return ['farmer', 'cooperative', 'other'];
  }
  if (role === 'importer') {
    return ['exporter', 'cooperative', 'trader', 'processing_facility', 'other'];
  }
  if (role === 'exporter') {
    return [
      'cooperative',
      'farmer',
      'washing_station',
      'processing_facility',
      'trader',
      'exporter',
      'other',
    ];
  }
  return [...CONTACT_ACTIVITY_TYPES];
}
