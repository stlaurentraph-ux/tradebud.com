/**
 * HS-style codes and indicative yield caps for EUDR-aligned field checks.
 * Caps are sanity hints for the offline app; authoritative validation remains on the backend.
 */

export type CommodityCode = 'coffee' | 'cocoa' | 'rubber' | 'soy' | 'timber';

export type CommodityDefinition = {
  code: CommodityCode;
  /** Harmonized System heading (4 digits), no dot — e.g. "0901". */
  hsCode: string;
  /**
   * Indicative max kg/ha per harvest year for mass-balance checks; null when not meaningful (e.g. timber volume).
   */
  defaultYieldKgPerHa: number | null;
};

const COMMODITIES: Record<CommodityCode, CommodityDefinition> = {
  coffee: { code: 'coffee', hsCode: '0901', defaultYieldKgPerHa: 1500 },
  cocoa: { code: 'cocoa', hsCode: '1801', defaultYieldKgPerHa: 1200 },
  rubber: { code: 'rubber', hsCode: '4001', defaultYieldKgPerHa: 1800 },
  soy: { code: 'soy', hsCode: '1201', defaultYieldKgPerHa: 3500 },
  timber: { code: 'timber', hsCode: '4407', defaultYieldKgPerHa: null },
};

export function parseCommodityCode(raw: string | undefined | null): CommodityCode | undefined {
  if (!raw) return undefined;
  const k = raw.trim().toLowerCase();
  if (k in COMMODITIES) return k as CommodityCode;
  return undefined;
}

export function getCommodityDefinition(
  raw: string | undefined | null,
): CommodityDefinition | undefined {
  const code = parseCommodityCode(raw);
  return code ? COMMODITIES[code] : undefined;
}

/** Display as "09.01" for a 4-digit HS heading. */
export function formatHsHeading(hsCode: string): string {
  if (hsCode.length === 4) return `${hsCode.slice(0, 2)}.${hsCode.slice(2)}`;
  return hsCode;
}

export function indicativeMaxKgForPlot(params: {
  commodityCode: string | undefined | null;
  areaHectares: number;
}): { maxKg: number; kgPerHa: number; hsCode: string } | null {
  const def = getCommodityDefinition(params.commodityCode);
  if (!def || def.defaultYieldKgPerHa == null) return null;
  const ha = params.areaHectares;
  if (!Number.isFinite(ha) || ha <= 0) return null;
  const maxKg = Math.round(def.defaultYieldKgPerHa * ha);
  return { maxKg, kgPerHa: def.defaultYieldKgPerHa, hsCode: def.hsCode };
}
