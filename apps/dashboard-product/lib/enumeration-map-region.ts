import type { LatLng } from '@/lib/plot-map-preview-geometry';
import type { PlotMapOverlayPolygon } from '@/components/plots/plot-satellite-map';
import type { EnumerationMappingRegion } from '@/lib/enumeration-campaign-types';

export function mappingRegionToOverlayPolygon(region: EnumerationMappingRegion): PlotMapOverlayPolygon {
  const { west, south, east, north } = region.bbox;
  const ring: LatLng[] = [
    { lat: south, lng: west },
    { lat: south, lng: east },
    { lat: north, lng: east },
    { lat: north, lng: west },
    { lat: south, lng: west },
  ];
  return { coordinates: ring, variant: 'current' };
}

export function mappingRegionCenter(region: EnumerationMappingRegion): LatLng {
  const { west, south, east, north } = region.bbox;
  return {
    lat: (south + north) / 2,
    lng: (west + east) / 2,
  };
}
