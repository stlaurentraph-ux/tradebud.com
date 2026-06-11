import type { FarmerProfile, Plot } from '@/features/state/AppStateContext';

export type ProducerAttestations = {
  fpicConsent: boolean;
  laborNoChildLabor: boolean;
  laborNoForcedLabor: boolean;
};

export type PlotAttestations = {
  landTenure: boolean;
  noDeforestation: boolean;
};

/** Business-level attestations (FPIC + labor + self-declaration) — once per producer. */
export function hasProducerAttestationsComplete(farmer: FarmerProfile | undefined): boolean {
  if (!farmer) return false;
  return (
    farmer.selfDeclared === true &&
    farmer.fpicConsent === true &&
    farmer.laborNoChildLabor === true &&
    farmer.laborNoForcedLabor === true
  );
}

export function applyProducerAttestationsToFarmer(
  farmer: FarmerProfile,
  attestations: ProducerAttestations,
  at: number = Date.now(),
): FarmerProfile {
  return {
    ...farmer,
    selfDeclared: true,
    selfDeclaredAt: farmer.selfDeclaredAt ?? at,
    fpicConsent: attestations.fpicConsent,
    laborNoChildLabor: attestations.laborNoChildLabor,
    laborNoForcedLabor: attestations.laborNoForcedLabor,
  };
}

export function buildPlotAttestationFields(
  attestations: PlotAttestations,
  at: number = Date.now(),
): Pick<
  Plot,
  | 'landTenureDeclared'
  | 'landTenureDeclaredAt'
  | 'noDeforestationDeclared'
  | 'noDeforestationDeclaredAt'
> {
  return {
    landTenureDeclared: attestations.landTenure,
    landTenureDeclaredAt: attestations.landTenure ? at : undefined,
    noDeforestationDeclared: attestations.noDeforestation,
    noDeforestationDeclaredAt: attestations.noDeforestation ? at : undefined,
  };
}

/** @deprecated Use applyProducerAttestationsToFarmer + buildPlotAttestationFields */
export type PlotRegistrationDeclarations = ProducerAttestations & PlotAttestations;

/** @deprecated Use applyProducerAttestationsToFarmer + buildPlotAttestationFields */
export function applyPlotDeclarationsToFarmer(
  farmer: FarmerProfile,
  declarations: PlotRegistrationDeclarations,
  at: number = Date.now(),
): FarmerProfile {
  return applyProducerAttestationsToFarmer(
    farmer,
    {
      fpicConsent: declarations.fpicConsent,
      laborNoChildLabor: declarations.laborNoChildLabor,
      laborNoForcedLabor: declarations.laborNoForcedLabor,
    },
    at,
  );
}
