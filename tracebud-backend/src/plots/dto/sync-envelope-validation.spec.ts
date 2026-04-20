import { validate } from 'class-validator';
import { SyncPlotPhotosDto } from './sync-plot-photos.dto';
import { SyncPlotLegalDto } from './sync-plot-legal.dto';
import { SyncPlotEvidenceDto } from './sync-plot-evidence.dto';

describe('Sync envelope HLC validation', () => {
  it('rejects malformed hlcTimestamp for photos/legal/evidence DTOs', async () => {
    const photosDto = Object.assign(new SyncPlotPhotosDto(), {
      kind: 'ground_truth',
      photos: [],
      hlcTimestamp: 'not-hlc',
      clientEventId: 'evt-photo-1',
    });
    const legalDto = Object.assign(new SyncPlotLegalDto(), {
      reason: 'legal update',
      hlcTimestamp: 'bad-hlc-value',
      clientEventId: 'evt-legal-1',
    });
    const evidenceDto = Object.assign(new SyncPlotEvidenceDto(), {
      kind: 'tenure_evidence',
      items: [],
      reason: 'evidence update',
      hlcTimestamp: '1234',
      clientEventId: 'evt-evidence-1',
    });

    const [photoErrors, legalErrors, evidenceErrors] = await Promise.all([
      validate(photosDto),
      validate(legalDto),
      validate(evidenceDto),
    ]);

    expect(photoErrors.some((error) => error.property === 'hlcTimestamp')).toBe(true);
    expect(legalErrors.some((error) => error.property === 'hlcTimestamp')).toBe(true);
    expect(evidenceErrors.some((error) => error.property === 'hlcTimestamp')).toBe(true);
  });

  it('accepts valid hlcTimestamp envelope for photos/legal/evidence DTOs', async () => {
    const photosDto = Object.assign(new SyncPlotPhotosDto(), {
      kind: 'ground_truth',
      photos: [],
      hlcTimestamp: '1712524800000:000001',
      clientEventId: 'evt-photo-2',
    });
    const legalDto = Object.assign(new SyncPlotLegalDto(), {
      reason: 'legal update',
      hlcTimestamp: '1712524800001:000002',
      clientEventId: 'evt-legal-2',
    });
    const evidenceDto = Object.assign(new SyncPlotEvidenceDto(), {
      kind: 'tenure_evidence',
      items: [],
      reason: 'evidence update',
      hlcTimestamp: '1712524800002:000003',
      clientEventId: 'evt-evidence-2',
    });

    const [photoErrors, legalErrors, evidenceErrors] = await Promise.all([
      validate(photosDto),
      validate(legalDto),
      validate(evidenceDto),
    ]);

    expect(photoErrors).toHaveLength(0);
    expect(legalErrors).toHaveLength(0);
    expect(evidenceErrors).toHaveLength(0);
  });
});
