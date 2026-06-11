export const PRODUCTION_SYSTEM_OPTIONS = [
  { id: 'monoculture', labelKey: 'production_system_monoculture' },
  { id: 'agroforestry', labelKey: 'production_system_agroforestry' },
  { id: 'shade_grown', labelKey: 'production_system_shade_grown' },
  { id: 'silvopasture', labelKey: 'production_system_silvopasture' },
] as const;

export type ProductionSystemId = (typeof PRODUCTION_SYSTEM_OPTIONS)[number]['id'];

export function isProductionSystemId(value: unknown): value is ProductionSystemId {
  return PRODUCTION_SYSTEM_OPTIONS.some((opt) => opt.id === value);
}

export function productionSystemLabelKey(id: ProductionSystemId | string | undefined): string {
  const match = PRODUCTION_SYSTEM_OPTIONS.find((opt) => opt.id === id);
  return match?.labelKey ?? 'production_system_unknown';
}
