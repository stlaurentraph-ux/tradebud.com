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

/** Keep saved producer attestations when a partial farmer patch omits them. */
export function mergeFarmerProfileOnUpdate(
  previous: FarmerProfile | undefined,
  next: FarmerProfile,
): FarmerProfile {
  const merged: FarmerProfile = {
    ...next,
    profilePhotoUri: next.profilePhotoUri ?? previous?.profilePhotoUri,
  };
  if (!previous || !hasProducerAttestationsComplete(previous) || hasProducerAttestationsComplete(next)) {
    return merged;
  }
  return {
    ...merged,
    selfDeclared: previous.selfDeclared,
    selfDeclaredAt: previous.selfDeclaredAt,
    fpicConsent: previous.fpicConsent,
    laborNoChildLabor: previous.laborNoChildLabor,
    laborNoForcedLabor: previous.laborNoForcedLabor,
  };
}

/** Prefer the freshest complete attestation set when reloading SQLite into memory. */
export function mergeFarmerProfileFromDisk(
  inMemory: FarmerProfile | undefined,
  disk: FarmerProfile | undefined,
): FarmerProfile | undefined {
  if (!disk) return inMemory;
  if (!inMemory) return disk;

  const memoryComplete = hasProducerAttestationsComplete(inMemory);
  const diskComplete = hasProducerAttestationsComplete(disk);
  const memoryAt = inMemory.selfDeclaredAt ?? 0;
  const diskAt = disk.selfDeclaredAt ?? 0;
  const profilePhotoUri = inMemory.profilePhotoUri ?? disk.profilePhotoUri;

  if (memoryComplete && !diskComplete) {
    return {
      ...disk,
      selfDeclared: inMemory.selfDeclared,
      selfDeclaredAt: inMemory.selfDeclaredAt,
      fpicConsent: inMemory.fpicConsent,
      laborNoChildLabor: inMemory.laborNoChildLabor,
      laborNoForcedLabor: inMemory.laborNoForcedLabor,
      profilePhotoUri,
    };
  }

  if (diskComplete && memoryComplete) {
    const attestations = diskAt >= memoryAt ? disk : inMemory;
    return {
      ...disk,
      selfDeclared: attestations.selfDeclared,
      selfDeclaredAt: attestations.selfDeclaredAt,
      fpicConsent: attestations.fpicConsent,
      laborNoChildLabor: attestations.laborNoChildLabor,
      laborNoForcedLabor: attestations.laborNoForcedLabor,
      profilePhotoUri,
    };
  }

  return { ...disk, profilePhotoUri };
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
