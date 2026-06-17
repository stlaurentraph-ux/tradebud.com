import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createExpoSqliteMemoryMock } from '@/features/testing/expoSqliteMemoryMock';

const sqliteMock = createExpoSqliteMemoryMock();

vi.mock('expo-sqlite', () => ({
  openDatabaseAsync: sqliteMock.openDatabaseAsync,
}));

vi.mock('expo-constants', () => ({
  default: { deviceName: 'vitest' },
}));

describe('persistence.native sqlite integration', () => {
  beforeEach(async () => {
    sqliteMock.reset();
    const { resetPersistenceDatabaseForTests, initDatabase } = await import('./persistence.native');
    resetPersistenceDatabaseForTests();
    await initDatabase();
  });

  it('persistPlotTitlePhoto then loadTitlePhotosForPlot returns saved row', async () => {
    const { persistPlotTitlePhoto, loadTitlePhotosForPlot } = await import('./persistence.native');
    const plotId = 'plot-test-1';
    const takenAt = Date.now();

    await persistPlotTitlePhoto({ plotId, uri: 'file:///title.jpg', takenAt });
    const loaded = await loadTitlePhotosForPlot(plotId);

    expect(loaded).toHaveLength(1);
    expect(loaded[0]?.uri).toBe('file:///title.jpg');
    expect(loaded[0]?.takenAt).toBe(takenAt);
  });

  it('persistPlotTitlePhoto supports multiple photos per plot', async () => {
    const { persistPlotTitlePhoto, loadTitlePhotosForPlot } = await import('./persistence.native');
    const plotId = 'plot-test-multi';

    await persistPlotTitlePhoto({ plotId, uri: 'file:///a.jpg', takenAt: 1000 });
    await persistPlotTitlePhoto({ plotId, uri: 'file:///b.jpg', takenAt: 2000 });
    const loaded = await loadTitlePhotosForPlot(plotId);

    expect(loaded).toHaveLength(2);
    expect(loaded[0]?.uri).toBe('file:///b.jpg');
  });

  it('persistPlotEvidenceItem then loadEvidenceForPlot returns saved item', async () => {
    const { persistPlotEvidenceItem, loadEvidenceForPlot } = await import('./persistence.native');
    const plotId = 'plot-test-2';

    await persistPlotEvidenceItem({
      plotId,
      kind: 'tenure_evidence',
      uri: 'file:///tenure.pdf',
      mimeType: 'application/pdf',
      label: 'Land title scan',
      takenAt: Date.now(),
    });

    const loaded = await loadEvidenceForPlot(plotId, 'tenure_evidence');
    expect(loaded).toHaveLength(1);
    expect(loaded[0]?.label).toBe('Land title scan');
    expect(loaded[0]?.mimeType).toBe('application/pdf');
  });
});
