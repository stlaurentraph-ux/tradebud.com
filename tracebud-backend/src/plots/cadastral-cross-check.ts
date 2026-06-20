import {
  normalizeCadastralKeyForCountry,
  resolveCadastralCountryPack,
} from './cadastral-country-packs';
import type { CadastralCrossCheck, TenureParseResultV1, TenureType } from './tenure-parse.types';

export type PlotCadastralContext = {
  declaredCadastralKey: string | null;
  informalTenure: boolean;
  farmerName: string | null;
  countryCode?: string | null;
  /** Farmer postal / mailing address for exporter admin-region hints only. */
  postalAddress?: string | null;
};

/** Normalize cadastral / parcel reference using the plot country pack (HN default). */
export function normalizeCadastralKey(
  value: string | null | undefined,
  countryCode?: string | null,
): string | null {
  return normalizeCadastralKeyForCountry(value, countryCode ?? 'HN');
}

export function cadastralKeysMatch(
  declared: string | null | undefined,
  extracted: string | null | undefined,
  countryCode?: string | null,
): boolean | null {
  const iso =
    countryCode?.trim().toUpperCase() ||
    resolveCadastralCountryPack(null).countryIso;
  const left = normalizeCadastralKeyForCountry(declared, iso);
  const right = normalizeCadastralKeyForCountry(extracted, iso);
  if (!left || !right) return null;
  if (left === right) return true;
  const leftDigits = left.replace(/\D/g, '');
  const rightDigits = right.replace(/\D/g, '');
  if (leftDigits.length >= 6 && leftDigits === rightDigits) return true;
  return false;
}

function normalizeName(value: string | null | undefined): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function holderNameMatchesFarmer(
  holderName: string | null | undefined,
  farmerName: string | null | undefined,
): boolean | null {
  const holder = normalizeName(holderName);
  const farmer = normalizeName(farmerName);
  if (!holder || !farmer) return null;
  if (holder === farmer) return true;
  if (holder.includes(farmer) || farmer.includes(holder)) return true;
  const holderTokens = holder.split(' ').filter((t) => t.length > 2);
  const farmerTokens = farmer.split(' ').filter((t) => t.length > 2);
  if (holderTokens.length === 0 || farmerTokens.length === 0) return null;
  const overlap = holderTokens.filter((t) => farmerTokens.includes(t)).length;
  return overlap >= Math.min(2, holderTokens.length, farmerTokens.length);
}

export function isFormalTenureDocument(
  tenureType: TenureType,
  documentSource?: 'tenure_evidence' | 'land_title' | null,
): boolean {
  if (documentSource === 'land_title') return true;
  return tenureType === 'FORMAL';
}

export function buildCadastralCrossCheck(params: {
  parseResult: TenureParseResultV1;
  context: PlotCadastralContext;
  documentSource?: 'tenure_evidence' | 'land_title' | null;
}): CadastralCrossCheck {
  const extracted =
    params.parseResult.parcel_reference?.trim() ||
    params.parseResult.title_number?.trim() ||
    null;
  const declared = params.context.declaredCadastralKey?.trim() || null;
  const countryCode =
    params.context.countryCode?.trim().toUpperCase() ||
    params.parseResult.country_iso?.trim().toUpperCase() ||
    null;
  const keysMatch = cadastralKeysMatch(declared, extracted, countryCode);
  const holderMatch = holderNameMatchesFarmer(
    params.parseResult.holder_name,
    params.context.farmerName,
  );
  const informalConflict =
    params.context.informalTenure &&
    isFormalTenureDocument(params.parseResult.tenure_type, params.documentSource);

  const issues: string[] = [];
  if (keysMatch === false) issues.push('cadastral_key_mismatch');
  if (holderMatch === false) issues.push('holder_name_mismatch');
  if (informalConflict) issues.push('informal_tenure_formal_document_conflict');
  if (
    params.documentSource === 'land_title' &&
    !declared &&
    extracted
  ) {
    issues.push('declared_cadastral_key_missing');
  }

  return {
    declared_cadastral_key: declared,
    extracted_parcel_reference: extracted,
    normalized_declared: normalizeCadastralKey(declared, countryCode),
    normalized_extracted: normalizeCadastralKey(extracted, countryCode),
    country_pack: resolveCadastralCountryPack(countryCode).countryIso,
    country_label: resolveCadastralCountryPack(countryCode).label,
    keys_match: keysMatch,
    holder_name_match: holderMatch,
    informal_tenure_conflict: informalConflict,
    issues,
    requires_manual_review: issues.length > 0,
  };
}

export function applyCadastralCrossCheck(
  parseResult: TenureParseResultV1,
  context: PlotCadastralContext,
  documentSource?: 'tenure_evidence' | 'land_title' | null,
): TenureParseResultV1 {
  const shouldCheck =
    documentSource === 'land_title' ||
    isFormalTenureDocument(parseResult.tenure_type, documentSource);
  if (!shouldCheck) {
    return parseResult;
  }

  const cadastral_cross_check = buildCadastralCrossCheck({
    parseResult,
    context,
    documentSource,
  });

  return {
    ...parseResult,
    document_source: documentSource ?? parseResult.document_source ?? null,
    cadastral_cross_check,
  };
}
