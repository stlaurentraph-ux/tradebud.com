import type { FarmerProfile } from '@/features/state/AppStateContext';

/** EUDR simplified path: commodity plus postal address or declaration GPS. */
export function isProducerProfileComplete(farmer: FarmerProfile | undefined): boolean {
  if (!farmer?.id) return false;
  if (!farmer.commodityCode) return false;
  const hasPostal = Boolean(farmer.postalAddress?.trim());
  const hasGeo =
    farmer.declarationLatitude != null &&
    farmer.declarationLongitude != null &&
    Number.isFinite(farmer.declarationLatitude) &&
    Number.isFinite(farmer.declarationLongitude);
  return hasPostal || hasGeo;
}
