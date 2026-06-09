import { describe, expect, it } from 'vitest';

// Mirrors normalization contract used by useEvidenceFeed.
function normalizeEvidenceFeed(payload: unknown) {
  const rows = Array.isArray(payload) ? payload : [];
  return rows
    .map((row) => {
      if (!row || typeof row !== 'object') return null;
      const doc = row as Record<string, unknown>;
      const id = typeof doc.id === 'string' ? doc.id : '';
      if (!id) return null;
      return {
        id,
        plot_id: typeof doc.plot_id === 'string' && doc.plot_id.trim() ? doc.plot_id : null,
      };
    })
    .filter((doc): doc is { id: string; plot_id: string | null } => doc !== null);
}

describe('evidence feed normalization', () => {
  it('keeps plot_id when backend provides plot linkage', () => {
    const normalized = normalizeEvidenceFeed([
      { id: 'evidence_1', name: 'Consent form', plot_id: 'plot_117' },
    ]);
    expect(normalized).toEqual([{ id: 'evidence_1', plot_id: 'plot_117' }]);
  });
});
