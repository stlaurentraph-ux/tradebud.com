/** Phase-1 pilot: coffee commodity screening in African production regions. */
export const FDP_PILOT_COMMODITY = 'coffee' as const;

/** ISO 3166-1 alpha-2 country codes enabled for FDP coffee screening. */
export const FDP_COFFEE_AFRICA_COUNTRIES = new Set(['NG', 'RW', 'TZ']);

export type FdpCommodityThresholds = {
  /** Minimum mean declared-commodity probability at baseline year (2020). */
  declaredProbMin: number;
  /** Competing commodity must exceed declared by this margin to flag mismatch. */
  mismatchDelta: number;
  /** Pre-cutoff year mean must be at least this for "established" legitimacy. */
  preCutoffStableMin: number;
  /** Post-cutoff year jump above baseline that signals emerging conversion. */
  emergingPostCutoffDelta: number;
};

export type FdpCountryCoffeeProfile = {
  countryCode: string;
  label: string;
  thresholds: FdpCommodityThresholds;
};

const DEFAULT_COFFEE_THRESHOLDS: FdpCommodityThresholds = {
  declaredProbMin: 0.35,
  mismatchDelta: 0.25,
  preCutoffStableMin: 0.3,
  emergingPostCutoffDelta: 0.15,
};

/**
 * Country-specific thresholds for FDP coffee model_2025b.
 * Nigeria has sparser reference data in FDP training; thresholds are slightly looser.
 */
export const FDP_COFFEE_AFRICA_PROFILES: Record<string, FdpCountryCoffeeProfile> = {
  NG: {
    countryCode: 'NG',
    label: 'Nigeria',
    thresholds: {
      declaredProbMin: 0.3,
      mismatchDelta: 0.2,
      preCutoffStableMin: 0.25,
      emergingPostCutoffDelta: 0.15,
    },
  },
  RW: {
    countryCode: 'RW',
    label: 'Rwanda',
    thresholds: { ...DEFAULT_COFFEE_THRESHOLDS },
  },
  TZ: {
    countryCode: 'TZ',
    label: 'Tanzania',
    thresholds: { ...DEFAULT_COFFEE_THRESHOLDS },
  },
};

export function normalizeCountryCode(value: string | null | undefined): string | null {
  if (!value || typeof value !== 'string') return null;
  const normalized = value.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(normalized) ? normalized : null;
}

export function resolveFdpCoffeeProfile(countryCode: string | null | undefined): FdpCountryCoffeeProfile | null {
  const code = normalizeCountryCode(countryCode);
  if (!code || !FDP_COFFEE_AFRICA_COUNTRIES.has(code)) return null;
  return FDP_COFFEE_AFRICA_PROFILES[code] ?? null;
}

export function canonicalizeFdpCommodity(value: string | null | undefined): string | null {
  if (!value || typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (normalized.includes('coffee')) return FDP_PILOT_COMMODITY;
  return normalized || null;
}

export function isFdpPilotCommodity(commodity: string | null | undefined): boolean {
  return canonicalizeFdpCommodity(commodity) === FDP_PILOT_COMMODITY;
}
