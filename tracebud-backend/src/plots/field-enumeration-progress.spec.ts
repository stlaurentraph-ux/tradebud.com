import {
  summarizeEnumerationProgress,
  validateMappingRegionInput,
} from './field-enumeration-progress';

describe('field-enumeration-progress', () => {
  it('summarizes roster progress totals', () => {
    const progress = summarizeEnumerationProgress({
      campaignId: 'camp_1',
      campaignTitle: 'Copán mapping',
      mappingRegionConfigured: true,
      mappingRegion: null,
      provisionalPendingReview: 2,
      members: [
        {
          farmerId: 'f1',
          fullName: 'Ana',
          village: 'La Esperanza',
          phone: null,
          nationalId: null,
          email: null,
          producerContactId: 'c1',
          assignmentId: null,
          plotCount: 2,
          source: 'roster',
          geometryPendingApproval: 1,
        },
        {
          farmerId: 'f2',
          fullName: 'Ben',
          village: 'La Esperanza',
          phone: null,
          nationalId: null,
          email: null,
          producerContactId: 'c2',
          assignmentId: null,
          plotCount: 0,
          source: 'roster',
          isProvisional: true,
        },
      ],
    });

    expect(progress.totals).toEqual({
      rosterMembers: 2,
      membersWithPlots: 1,
      plotsCaptured: 2,
      provisionalPendingReview: 2,
      plotsPendingGeometryApproval: 1,
    });
  });

  it('validates mapping region bbox', () => {
    expect(
      validateMappingRegionInput({
        label: 'Copán, Honduras',
        west: -89.1,
        south: 14.5,
        east: -88.7,
        north: 15.0,
      }),
    ).toEqual({
      label: 'Copán, Honduras',
      west: -89.1,
      south: 14.5,
      east: -88.7,
      north: 15.0,
    });
  });

  it('rejects invalid bbox', () => {
    expect(() =>
      validateMappingRegionInput({
        label: 'Bad',
        west: 1,
        south: 2,
        east: 0,
        north: 3,
      }),
    ).toThrow(/west < east/);
  });
});
