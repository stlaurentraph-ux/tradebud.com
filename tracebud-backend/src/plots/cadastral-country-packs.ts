/**
 * Country-specific cadastral / parcel reference normalization for cross-check.
 * Honduras (HN) remains the primary pack; others use digit-aware normalization.
 */

export type CadastralCountryPack = {
  countryIso: string;
  label: string;
  /** Minimum digit count after stripping non-digits to attempt a match. */
  minDigits: number;
  normalize: (value: string) => string | null;
};

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

function normalizeHondurasClave(digits: string): string | null {
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 9)}-${digits.slice(9)}`;
  }
  if (digits.length >= 8 && digits.length <= 12) {
    return digits;
  }
  return null;
}

function normalizeGroupedDigits(digits: string, groups: number[]): string | null {
  if (digits.length !== groups.reduce((a, b) => a + b, 0)) {
    return digits.length >= 6 ? digits : null;
  }
  let offset = 0;
  return groups
    .map((size) => {
      const part = digits.slice(offset, offset + size);
      offset += size;
      return part;
    })
    .join('-');
}

/** Guatemala matrícula / folio — often 8–12 digits. */
function normalizeGuatemala(digits: string): string | null {
  if (digits.length === 10) {
    return normalizeGroupedDigits(digits, [3, 3, 4]);
  }
  return digits.length >= 7 ? digits : null;
}

/** Colombia matrícula catastral — variable length, often 15+ digits. */
function normalizeColombia(digits: string): string | null {
  if (digits.length >= 15) {
    return normalizeGroupedDigits(digits, [2, 3, 2, 2, 3, 3]) ?? digits;
  }
  return digits.length >= 10 ? digits : null;
}

/** Brazil CAR — 41 digits when complete; accept partial numeric refs. */
function normalizeBrazilCar(digits: string): string | null {
  if (digits.length === 41) {
    return digits;
  }
  return digits.length >= 20 ? digits : null;
}

/** Peru SUNARP / cuaderno — numeric blocks. */
function normalizePeru(digits: string): string | null {
  if (digits.length >= 12) {
    return normalizeGroupedDigits(digits.slice(0, 12), [3, 3, 3, 3]) ?? digits;
  }
  return digits.length >= 8 ? digits : null;
}

/** Nicaragua / El Salvador / generic Central America fallback. */
function normalizeGenericCadastral(digits: string): string | null {
  if (digits.length >= 8) {
    return digits;
  }
  return null;
}

export const CADASTRAL_COUNTRY_PACKS: Record<string, CadastralCountryPack> = {
  HN: {
    countryIso: 'HN',
    label: 'Clave Catastral',
    minDigits: 8,
    normalize: normalizeHondurasClave,
  },
  GT: {
    countryIso: 'GT',
    label: 'Matrícula / Folio',
    minDigits: 7,
    normalize: normalizeGuatemala,
  },
  CO: {
    countryIso: 'CO',
    label: 'Matrícula catastral',
    minDigits: 10,
    normalize: normalizeColombia,
  },
  BR: {
    countryIso: 'BR',
    label: 'CAR / cadastro reference',
    minDigits: 20,
    normalize: normalizeBrazilCar,
  },
  PE: {
    countryIso: 'PE',
    label: 'SUNARP reference',
    minDigits: 8,
    normalize: normalizePeru,
  },
  NI: {
    countryIso: 'NI',
    label: 'Cadastral reference',
    minDigits: 8,
    normalize: normalizeGenericCadastral,
  },
  SV: {
    countryIso: 'SV',
    label: 'Cadastral reference',
    minDigits: 8,
    normalize: normalizeGenericCadastral,
  },
  CR: {
    countryIso: 'CR',
    label: 'Cadastral reference',
    minDigits: 8,
    normalize: normalizeGenericCadastral,
  },
  PA: {
    countryIso: 'PA',
    label: 'Cadastral reference',
    minDigits: 8,
    normalize: normalizeGenericCadastral,
  },
};

export function resolveCadastralCountryPack(
  countryCode: string | null | undefined,
): CadastralCountryPack {
  const iso = (countryCode ?? 'HN').trim().toUpperCase();
  return CADASTRAL_COUNTRY_PACKS[iso] ?? {
    countryIso: iso,
    label: 'Parcel / cadastral reference',
    minDigits: 6,
    normalize: normalizeGenericCadastral,
  };
}

export function normalizeCadastralKeyForCountry(
  value: string | null | undefined,
  countryCode: string | null | undefined,
): string | null {
  if (!value?.trim()) return null;
  const digits = digitsOnly(value);
  if (digits.length === 0) return null;
  const pack = resolveCadastralCountryPack(countryCode);
  if (digits.length < pack.minDigits) {
    return digits.length >= 6 ? digits : null;
  }
  return pack.normalize(digits) ?? (digits.length >= 6 ? digits : null);
}
