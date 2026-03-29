import type { FarmerProfile, Plot } from '@/features/state/AppStateContext';
import { getCommodityDefinition } from '@/features/compliance/commodityCatalog';

const SCHEMA = 'tracebud.offline.declaration_bundle.v1' as const;

export type DeclarationBundleV1 = {
  schema: typeof SCHEMA;
  generatedAt: string;
  appVersion?: string;
  farmer: {
    id: string;
    name?: string;
    postalAddress?: string;
    commodityCode?: string;
    /** HS heading (4 digits), e.g. "0901" for coffee. */
    commodityHsCode?: string;
    selfDeclared: boolean;
    selfDeclaredAt?: number;
    fpicConsent?: boolean;
    laborNoChildLabor?: boolean;
    laborNoForcedLabor?: boolean;
    /** Optional simplified-declaration geolocation (WGS84, six decimals when from device). */
    declarationLatitude?: number;
    declarationLongitude?: number;
    declarationGeoCapturedAt?: string;
  };
  plotsSummary: {
    count: number;
    plotIds: string[];
    kinds: { point: number; polygon: number };
  };
};

export function buildDeclarationBundle(params: {
  farmer: FarmerProfile;
  plots: Plot[];
  appVersion?: string | null;
}): DeclarationBundleV1 {
  const { farmer, plots } = params;
  const commodityDef = getCommodityDefinition(farmer.commodityCode);
  const kinds = plots.reduce(
    (acc, p) => {
      acc[p.kind] += 1;
      return acc;
    },
    { point: 0, polygon: 0 },
  );

  return {
    schema: SCHEMA,
    generatedAt: new Date().toISOString(),
    appVersion: params.appVersion ?? undefined,
    farmer: {
      id: farmer.id,
      name: farmer.name,
      postalAddress: farmer.postalAddress,
      commodityCode: farmer.commodityCode,
      commodityHsCode: commodityDef?.hsCode,
      selfDeclared: farmer.selfDeclared,
      selfDeclaredAt: farmer.selfDeclaredAt,
      fpicConsent: farmer.fpicConsent,
      laborNoChildLabor: farmer.laborNoChildLabor,
      laborNoForcedLabor: farmer.laborNoForcedLabor,
      ...(farmer.declarationLatitude != null &&
      farmer.declarationLongitude != null &&
      Number.isFinite(farmer.declarationLatitude) &&
      Number.isFinite(farmer.declarationLongitude)
        ? {
            declarationLatitude: farmer.declarationLatitude,
            declarationLongitude: farmer.declarationLongitude,
            declarationGeoCapturedAt:
              farmer.declarationGeoCapturedAt != null
                ? new Date(farmer.declarationGeoCapturedAt).toISOString()
                : undefined,
          }
        : {}),
    },
    plotsSummary: {
      count: plots.length,
      plotIds: plots.map((p) => p.id),
      kinds,
    },
  };
}

export function declarationBundleToJson(bundle: DeclarationBundleV1): string {
  return `${JSON.stringify(bundle, null, 2)}\n`;
}
