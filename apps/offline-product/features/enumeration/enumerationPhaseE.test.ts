import { describe, expect, it } from 'vitest';
import { buildDistrictPackId, estimateDistrictPackSizeMb, requiresWifiAckForPack } from '@/features/enumeration/enumerationTileBootstrap';
const bbox = { west: -89.1, south: 14.5, east: -88.7, north: 15.0 };
describe('enumerationPhaseE', () => {
  it('estimates pack size', () => { expect(estimateDistrictPackSizeMb(bbox)).toBeGreaterThan(0); });
  it('wifi ack threshold', () => { expect(requiresWifiAckForPack(51)).toBe(true); });
  it('pack id slug', () => { expect(buildDistrictPackId({ label: 'X', bbox, campaignId: 'camp_1' })).toBe('enum-district-camp-1'); });
});
