import { describe, expect, it } from 'vitest';

import type { PlotTenureVerificationRecord } from '@/features/api/postPlot';
import { filterTenureVerificationsForLocalLandDocs } from './filterTenureVerificationsForLocalDocs';

function verification(
  overrides: Partial<PlotTenureVerificationRecord> & { id: string },
): PlotTenureVerificationRecord {
  return {
    plot_id: 'plot-1',
    storage_path: 'tenant/farmer/plot-1/land_title/photo.jpg',
    mime_type: 'image/jpeg',
    evidence_label: 'land_title_photo',
    parse_status: 'MANUAL_REQUIRED',
    parse_result: { document_source: 'land_title' },
    parse_confidence: 0.2,
    parse_reviewed_by: null,
    parse_reviewed_at: null,
    created_at: '2026-06-16T00:00:00.000Z',
    updated_at: '2026-06-16T00:00:00.000Z',
    ...overrides,
  };
}

describe('filterTenureVerificationsForLocalLandDocs', () => {
  it('returns empty when no local land files remain', () => {
    expect(
      filterTenureVerificationsForLocalLandDocs(
        [verification({ id: 'v1' })],
        [],
        [],
      ),
    ).toEqual([]);
  });

  it('keeps only as many land-title checks as local title photos', () => {
    const rows = filterTenureVerificationsForLocalLandDocs(
      [
        verification({ id: 'v-new', created_at: '2026-06-16T00:00:00.000Z' }),
        verification({ id: 'v-old', created_at: '2026-06-15T00:00:00.000Z' }),
      ],
      [{ id: 1, plotId: 'plot-1', uri: 'file:///a.jpg', takenAt: 1 }],
      [],
    );
    expect(rows.map((row) => row.id)).toEqual(['v-new']);
  });
});
