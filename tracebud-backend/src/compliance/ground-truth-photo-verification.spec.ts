import {
  buildGroundTruthPhotoVerification,
  countGeoTaggedGroundTruthPhotos,
  isPhotoTakenAfterCutoff,
  parsePhotoTakenAtMs,
  parsePhotoWgs84,
} from './ground-truth-photo-verification';

describe('ground-truth-photo-verification', () => {
  it('parses latitude/longitude and lat/lng aliases', () => {
    expect(parsePhotoWgs84({ latitude: 14.1, longitude: -86.2 })).toEqual({
      latitude: 14.1,
      longitude: -86.2,
    });
    expect(parsePhotoWgs84({ lat: 14.1, lng: -86.2 })).toEqual({
      latitude: 14.1,
      longitude: -86.2,
    });
    expect(parsePhotoWgs84({ latitude: 999, longitude: 0 })).toBeNull();
  });

  it('counts geo-tagged photos', () => {
    expect(
      countGeoTaggedGroundTruthPhotos([
        { latitude: 1, longitude: 2 },
        { uri: 'x' },
        { lat: 3, lng: 4 },
      ]),
    ).toBe(2);
  });

  it('parses takenAt timestamps from epoch and ISO strings', () => {
    expect(parsePhotoTakenAtMs({ takenAt: 1_704_067_200_000 })).toBe(1_704_067_200_000);
    expect(parsePhotoTakenAtMs({ takenAt: '2024-01-01T00:00:00.000Z' })).toBe(
      Date.parse('2024-01-01T00:00:00.000Z'),
    );
    expect(isPhotoTakenAfterCutoff({ takenAt: '2019-01-01T00:00:00.000Z' })).toBe(false);
    expect(isPhotoTakenAfterCutoff({ takenAt: '2024-01-01T00:00:00.000Z' })).toBe(true);
  });

  it('marks clearance eligible only when clearance-verified count meets threshold', () => {
    expect(
      buildGroundTruthPhotoVerification({
        totalCount: 4,
        geoTaggedCount: 4,
        geoVerifiedCount: 4,
        timestampVerifiedCount: 4,
        clearanceVerifiedCount: 3,
      }).clearanceEligible,
    ).toBe(false);
    expect(
      buildGroundTruthPhotoVerification({
        totalCount: 4,
        geoTaggedCount: 4,
        geoVerifiedCount: 4,
        timestampVerifiedCount: 4,
        clearanceVerifiedCount: 4,
      }).clearanceEligible,
    ).toBe(true);
  });
});
