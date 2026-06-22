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

  it('deletePlotTitlePhoto removes a saved title photo', async () => {
    const { persistPlotTitlePhoto, loadTitlePhotosForPlot, deletePlotTitlePhoto } = await import(
      './persistence.native'
    );
    const plotId = 'plot-test-delete-title';
    await persistPlotTitlePhoto({ plotId, uri: 'file:///title.jpg', takenAt: 1 });
    const [photo] = await loadTitlePhotosForPlot(plotId);
    expect(photo?.id).toBeDefined();
    await deletePlotTitlePhoto(photo!.id);
    expect(await loadTitlePhotosForPlot(plotId)).toHaveLength(0);
  });

  it('deletePlotLocalData removes delivery receipts for the deleted plot', async () => {
    const { persistLocalDeliveryReceipt, deletePlotLocalData, loadLocalDeliveryReceiptsForFarmer } =
      await import('./persistence.native');
    const plotId = 'plot-delete-receipts';
    const farmerId = '11111111-1111-4111-8111-111111111111';
    const otherPlotId = 'plot-keep-receipts';

    await persistLocalDeliveryReceipt({
      id: 'harvest-delete-me',
      farmerId,
      localPlotId: plotId,
      serverPlotId: null,
      plotName: 'Old plot',
      kg: 40,
      recordedAt: Date.now(),
      qrCodeRef: null,
      pendingSync: true,
      buyerLabel: 'buyer',
    });
    await persistLocalDeliveryReceipt({
      id: 'harvest-keep',
      farmerId,
      localPlotId: otherPlotId,
      serverPlotId: null,
      plotName: 'Other plot',
      kg: 20,
      recordedAt: Date.now(),
      qrCodeRef: null,
      pendingSync: true,
      buyerLabel: 'buyer',
    });

    await deletePlotLocalData(plotId);

    const remaining = await loadLocalDeliveryReceiptsForFarmer(farmerId);
    expect(remaining).toHaveLength(1);
    expect(remaining[0]?.id).toBe('harvest-keep');
  });

  it('loadLocalDeliveryReceiptsForFarmer merges rows across linked farmer ids', async () => {
    const { persistLocalDeliveryReceipt, loadLocalDeliveryReceiptsForFarmer } = await import(
      './persistence.native'
    );
    const profileFarmerId = 'profile-farmer';
    const serverFarmerId = 'server-farmer';
    const plotId = 'plot-1';

    await persistLocalDeliveryReceipt({
      id: 'receipt-profile',
      farmerId: profileFarmerId,
      localPlotId: plotId,
      serverPlotId: null,
      plotName: 'North',
      kg: 100,
      recordedAt: Date.now(),
      qrCodeRef: null,
      pendingSync: false,
      buyerLabel: 'buyer',
    });
    await persistLocalDeliveryReceipt({
      id: 'receipt-server',
      farmerId: serverFarmerId,
      localPlotId: plotId,
      serverPlotId: 'server-plot',
      plotName: 'North',
      kg: 200,
      recordedAt: Date.now() - 1000,
      qrCodeRef: 'V-ABC123',
      pendingSync: false,
      buyerLabel: 'buyer',
    });

    const profileOnly = await loadLocalDeliveryReceiptsForFarmer(profileFarmerId);
    expect(profileOnly.map((row) => row.id).sort()).toEqual(['receipt-profile', 'receipt-server']);

    const merged = await loadLocalDeliveryReceiptsForFarmer(profileFarmerId, {
      alsoFarmerIds: [serverFarmerId],
    });
    expect(merged.map((row) => row.id).sort()).toEqual(['receipt-profile', 'receipt-server']);
  });

  it('rekeyFarmerIdInDatabase preserves producer attestations when farmer id changes', async () => {
    const { persistFarmer, rekeyFarmerIdInDatabase, loadAppState } = await import(
      './persistence.native'
    );
    const localId = '11111111-1111-4111-8111-111111111111';
    const linkedId = '22222222-2222-4222-8222-222222222222';
    const declaredAt = Date.now();

    await persistFarmer({
      id: localId,
      role: 'farmer',
      name: 'Hector',
      selfDeclared: true,
      selfDeclaredAt: declaredAt,
      fpicConsent: true,
      laborNoChildLabor: true,
      laborNoForcedLabor: true,
    });

    await rekeyFarmerIdInDatabase(localId, linkedId);

    const loaded = await loadAppState();
    expect(loaded.farmer?.id).toBe(linkedId);
    expect(loaded.farmer?.selfDeclared).toBe(true);
    expect(loaded.farmer?.fpicConsent).toBe(true);
    expect(loaded.farmer?.laborNoChildLabor).toBe(true);
    expect(loaded.farmer?.laborNoForcedLabor).toBe(true);
    expect(loaded.farmer?.selfDeclaredAt).toBe(declaredAt);
    expect(loaded.farmer?.name).toBe('Hector');
  });
});
