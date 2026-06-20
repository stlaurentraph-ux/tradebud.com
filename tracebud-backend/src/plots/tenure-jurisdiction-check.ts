import { resolveCadastralCountryPack } from './cadastral-country-packs';
import type { PlotCadastralContext } from './cadastral-cross-check';
import type { TenureJurisdictionCrossCheck, TenureParseResultV1 } from './tenure-parse.types';

/** Common country names / admin tokens → ISO alpha-2 (extend via cadastral packs). */
const COUNTRY_TEXT_TO_ISO: Record<string, string> = {
  india: 'IN',
  indian: 'IN',
  bharat: 'IN',
  karnataka: 'IN',
  tamil: 'IN',
  maharashtra: 'IN',
  norway: 'NO',
  norge: 'NO',
  norsk: 'NO',
  honduras: 'HN',
  guatemala: 'GT',
  colombia: 'CO',
  brazil: 'BR',
  brasil: 'BR',
  peru: 'PE',
  nicaragua: 'NI',
  salvador: 'SV',
  'el salvador': 'SV',
  'costa rica': 'CR',
  panama: 'PA',
  'panamá': 'PA',
  tanzania: 'TZ',
  kenya: 'KE',
  uganda: 'UG',
  ethiopia: 'ET',
  indonesia: 'ID',
  vietnam: 'VN',
  'viet nam': 'VN',
  thailand: 'TH',
  ghana: 'GH',
  "côte d'ivoire": 'CI',
  "cote d'ivoire": 'CI',
  ivory: 'CI',
};

const ISO_IN_TEXT = /\b([A-Z]{2})\b/g;

function normalizeText(value: string | null | undefined): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(value: string): string[] {
  return normalizeText(value)
    .split(/\s+/)
    .filter((token) => token.length >= 3);
}

/** Infer ISO country from issuer stamps, headers, or admin place names. */
export function inferCountryIsoFromText(text: string | null | undefined): string | null {
  const normalized = normalizeText(text);
  if (!normalized) return null;

  for (const [phrase, iso] of Object.entries(COUNTRY_TEXT_TO_ISO)) {
    if (normalized.includes(phrase)) return iso;
  }

  for (const pack of ['HN', 'GT', 'CO', 'BR', 'PE', 'NI', 'SV', 'CR', 'PA', 'NO', 'IN', 'TZ', 'KE']) {
    const label = resolveCadastralCountryPack(pack).label.toLowerCase();
    if (label.length >= 4 && normalized.includes(label)) return pack;
  }

  const upper = text?.toUpperCase() ?? '';
  for (const match of upper.matchAll(ISO_IN_TEXT)) {
    const candidate = match[1];
    if (resolveCadastralCountryPack(candidate).countryIso === candidate) {
      return candidate;
    }
  }

  return null;
}

export function resolveDocumentCountryIso(parseResult: TenureParseResultV1): string | null {
  const explicit = parseResult.country_iso?.trim().toUpperCase();
  if (explicit && explicit.length === 2) return explicit;

  const issuer = inferCountryIsoFromText(parseResult.community_or_issuer);
  if (issuer) return issuer;

  return inferCountryIsoFromText(parseResult.summary);
}

/** Admin region tokens for exporter hints — not geocoded street addresses. */
export function extractAdminRegionTokens(
  text: string | null | undefined,
  countryIso?: string | null,
): string[] {
  const normalized = normalizeText(text);
  if (!normalized) return [];

  const tokens = new Set<string>();
  for (const [phrase] of Object.entries(COUNTRY_TEXT_TO_ISO)) {
    if (phrase.includes(' ') && normalized.includes(phrase)) {
      tokens.add(phrase);
    }
  }

  for (const token of tokenize(text ?? '')) {
    if (COUNTRY_TEXT_TO_ISO[token]) continue;
    if (token.length >= 5) tokens.add(token);
  }

  if (countryIso === 'IN') {
    for (const state of ['karnataka', 'tamilnadu', 'maharashtra', 'kerala', 'assam', 'odisha']) {
      if (normalized.includes(state.replace('nadu', ' nadu'))) tokens.add(state);
    }
  }

  return [...tokens].slice(0, 6);
}


function adminRegionsOverlap(documentRegions: string[], plotRegions: string[]): boolean | null {
  if (documentRegions.length === 0 || plotRegions.length === 0) return null;
  const plotSet = new Set(plotRegions.map(normalizeText));
  return documentRegions.some((region) => {
    const norm = normalizeText(region);
    return [...plotSet].some((plotRegion) => plotRegion.includes(norm) || norm.includes(plotRegion));
  });
}

export function buildTenureJurisdictionCrossCheck(params: {
  parseResult: TenureParseResultV1;
  context: PlotCadastralContext;
}): TenureJurisdictionCrossCheck {
  const plotCountry = params.context.countryCode?.trim().toUpperCase() || null;
  const documentCountry = resolveDocumentCountryIso(params.parseResult);
  const documentCountryMatch =
    plotCountry && documentCountry ? plotCountry === documentCountry : null;

  const issuerText = params.parseResult.community_or_issuer?.trim() || null;
  const issuerInferred = inferCountryIsoFromText(issuerText);
  const issuerJurisdictionMatch =
    plotCountry && issuerInferred ? plotCountry === issuerInferred : null;

  const documentAdminRegions = extractAdminRegionTokens(
    [issuerText, params.parseResult.summary].filter(Boolean).join(' '),
    documentCountry ?? plotCountry,
  );
  const plotAdminRegions = extractAdminRegionTokens(
    params.context.postalAddress ?? null,
    plotCountry,
  );
  const adminRegionMatch = adminRegionsOverlap(documentAdminRegions, plotAdminRegions);

  const issues: string[] = [];
  const exporter_hints: string[] = [];

  if (documentCountryMatch === false) {
    issues.push('document_country_mismatch');
  } else if (issuerJurisdictionMatch === false && issuerInferred) {
    issues.push('issuer_jurisdiction_mismatch');
  }

  if (adminRegionMatch === false) {
    exporter_hints.push(
      `admin_region_hint:document=${documentAdminRegions.join(',')};plot=${plotAdminRegions.join(',')}`,
    );
  } else if (documentAdminRegions.length > 0 && plotAdminRegions.length === 0) {
    exporter_hints.push(`document_admin_regions:${documentAdminRegions.join(',')}`);
  }

  if (plotCountry && documentCountry && documentCountryMatch === true && issuerText) {
    exporter_hints.push(`issuer_plot_country_aligned:${plotCountry}`);
  }

  return {
    plot_country_iso: plotCountry,
    document_country_iso: documentCountry,
    document_country_match: documentCountryMatch,
    issuer_text: issuerText,
    issuer_inferred_country_iso: issuerInferred,
    issuer_jurisdiction_match: issuerJurisdictionMatch,
    document_admin_regions: documentAdminRegions,
    plot_admin_regions: plotAdminRegions,
    admin_region_match: adminRegionMatch,
    issues,
    exporter_hints,
    requires_manual_review: issues.includes('issuer_jurisdiction_mismatch'),
    auto_fail: issues.includes('document_country_mismatch'),
  };
}

export function applyTenureJurisdictionCrossCheck(
  parseResult: TenureParseResultV1,
  context: PlotCadastralContext,
): TenureParseResultV1 {
  return {
    ...parseResult,
    jurisdiction_cross_check: buildTenureJurisdictionCrossCheck({ parseResult, context }),
  };
}
