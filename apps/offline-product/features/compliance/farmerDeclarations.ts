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

/** Prefer disk/next name when present; otherwise keep the last in-memory name. */
export function mergeFarmerDisplayFields(
  previous: FarmerProfile | undefined,
  next: FarmerProfile,
): Pick<FarmerProfile, 'name' | 'profilePhotoUri'> {
  const nextName = next.name?.trim();
  const memoryName = previous?.name?.trim();
  return {
    name: nextName || memoryName || undefined,
    profilePhotoUri: next.profilePhotoUri ?? previous?.profilePhotoUri,
  };
}

export function farmerProfilesEqual(a: FarmerProfile, b: FarmerProfile): boolean {
  return (
    a.id === b.id &&
    (a.name?.trim() ?? '') === (b.name?.trim() ?? '') &&
    a.profilePhotoUri === b.profilePhotoUri &&
    a.role === b.role &&
    a.selfDeclared === b.selfDeclared &&
    a.selfDeclaredAt === b.selfDeclaredAt &&
    a.fpicConsent === b.fpicConsent &&
    a.laborNoChildLabor === b.laborNoChildLabor &&
    a.laborNoForcedLabor === b.laborNoForcedLabor &&
    a.postalAddress === b.postalAddress &&
    a.commodityCode === b.commodityCode &&
    a.declarationLatitude === b.declarationLatitude &&
    a.declarationLongitude === b.declarationLongitude &&
    a.declarationGeoCapturedAt === b.declarationGeoCapturedAt
  );
}

/** Keep saved producer attestations when a partial farmer patch omits them. */
export function mergeFarmerProfileOnUpdate(
  previous: FarmerProfile | undefined,
  next: FarmerProfile,
): FarmerProfile {
  const merged: FarmerProfile = {
    ...next,
    ...mergeFarmerDisplayFields(previous, next),
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
  const displayFields = mergeFarmerDisplayFields(inMemory, disk);

  if (memoryComplete && !diskComplete) {
    return {
      ...disk,
      selfDeclared: inMemory.selfDeclared,
      selfDeclaredAt: inMemory.selfDeclaredAt,
      fpicConsent: inMemory.fpicConsent,
      laborNoChildLabor: inMemory.laborNoChildLabor,
      laborNoForcedLabor: inMemory.laborNoForcedLabor,
      ...displayFields,
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
      ...displayFields,
    };
  }

  return { ...disk, ...displayFields };
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
