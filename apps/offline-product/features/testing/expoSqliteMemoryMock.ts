/**
 * Minimal in-memory expo-sqlite mock for Vitest persist→load integration tests.
 */

type TitlePhotoRow = {
  id: number;
  plotId: string;
  uri: string;
  takenAt: number;
};

type EvidenceRow = {
  id: number;
  plotId: string;
  kind: string;
  uri: string;
  mimeType: string | null;
  label: string | null;
  takenAt: number;
};

type FarmerRow = {
  id: string;
  name: string | null;
  role: string;
  selfDeclared: number;
  selfDeclaredAt: number | null;
  fpicConsent: number | null;
  laborNoChildLabor: number | null;
  laborNoForcedLabor: number | null;
  postalAddress?: string | null;
  commodityCode?: string | null;
  declarationLatitude?: number | null;
  declarationLongitude?: number | null;
  declarationGeoCapturedAt?: number | null;
};

type DeliveryReceiptRow = {
  id: string;
  farmerId: string;
  localPlotId: string;
  serverPlotId: string | null;
  plotName: string;
  kg: number;
  recordedAt: number;
  qrCodeRef: string | null;
  pendingSync: number;
  buyerLabel: string;
};

export type ExpoSqliteMemoryMock = {
  openDatabaseAsync: (name: string) => Promise<{
    execAsync: (sql: string) => Promise<void>;
    runAsync: (sql: string, params?: unknown[]) => Promise<{ lastInsertRowId: number }>;
    getAllAsync: <T>(sql: string, params?: unknown[]) => Promise<T[]>;
    getFirstAsync: <T>(sql: string, params?: unknown[]) => Promise<T | null>;
    withTransactionAsync: (task: () => Promise<void>) => Promise<void>;
    withExclusiveTransactionAsync: <T>(task: (txn: unknown) => Promise<T>) => Promise<T>;
  }>;
  tables: {
    titlePhotos: TitlePhotoRow[];
    evidence: EvidenceRow[];
    farmer: FarmerRow[];
    deliveryReceipts: DeliveryReceiptRow[];
  };
  reset: () => void;
};

export function createExpoSqliteMemoryMock(): ExpoSqliteMemoryMock {
  const tables = {
    titlePhotos: [] as TitlePhotoRow[],
    evidence: [] as EvidenceRow[],
    farmer: [] as FarmerRow[],
    deliveryReceipts: [] as DeliveryReceiptRow[],
  };
  let titlePhotoId = 1;
  let evidenceId = 1;

  const reset = () => {
    tables.titlePhotos.length = 0;
    tables.evidence.length = 0;
    tables.farmer.length = 0;
    tables.deliveryReceipts.length = 0;
    titlePhotoId = 1;
    evidenceId = 1;
  };

  const readFarmerRow = (params: unknown[]): FarmerRow => ({
    id: String(params[0]),
    name: params[1] != null ? String(params[1]) : null,
    role: String(params[2]),
    selfDeclared: Number(params[3]),
    selfDeclaredAt: params[4] != null ? Number(params[4]) : null,
    fpicConsent: params[5] != null ? Number(params[5]) : null,
    laborNoChildLabor: params[6] != null ? Number(params[6]) : null,
    laborNoForcedLabor: params[7] != null ? Number(params[7]) : null,
    postalAddress: params[8] != null ? String(params[8]) : null,
    commodityCode: params[9] != null ? String(params[9]) : null,
    declarationLatitude: params[10] != null ? Number(params[10]) : null,
    declarationLongitude: params[11] != null ? Number(params[11]) : null,
    declarationGeoCapturedAt: params[12] != null ? Number(params[12]) : null,
  });

  const db = {
    // No real transaction isolation needed for the in-memory mock — run the task against the
    // same db so the persistPlots/persistFarmer transactional wrappers behave as before.
    withTransactionAsync: async (task: () => Promise<void>): Promise<void> => {
      await task();
    },
    withExclusiveTransactionAsync: async <T>(task: (txn: unknown) => Promise<T>): Promise<T> => {
      return task(db);
    },
    execAsync: async (_sql: string) => {
      /* schema init no-op */
    },
    runAsync: async (sql: string, params: unknown[] = []) => {
      if (sql.includes('INSERT INTO plot_title_photos')) {
        const row: TitlePhotoRow = {
          id: titlePhotoId++,
          plotId: String(params[0]),
          uri: String(params[1]),
          takenAt: Number(params[2]),
        };
        tables.titlePhotos.push(row);
        return { lastInsertRowId: row.id };
      }
      if (sql.includes('INSERT INTO plot_evidence')) {
        const row: EvidenceRow = {
          id: evidenceId++,
          plotId: String(params[0]),
          kind: String(params[1]),
          uri: String(params[2]),
          mimeType: params[3] != null ? String(params[3]) : null,
          label: params[4] != null ? String(params[4]) : null,
          takenAt: Number(params[5]),
        };
        tables.evidence.push(row);
        return { lastInsertRowId: row.id };
      }
      if (sql.includes('DELETE FROM plot_title_photos WHERE id')) {
        const id = Number(params[0]);
        tables.titlePhotos = tables.titlePhotos.filter((row) => row.id !== id);
        return { lastInsertRowId: 0 };
      }
      if (sql.includes('DELETE FROM plot_evidence WHERE id')) {
        const id = Number(params[0]);
        tables.evidence = tables.evidence.filter((row) => row.id !== id);
        return { lastInsertRowId: 0 };
      }
      if (sql.includes('DELETE FROM farmer')) {
        tables.farmer.length = 0;
        return { lastInsertRowId: 0 };
      }
      if (sql.includes('INSERT INTO farmer')) {
        tables.farmer.push(readFarmerRow(params));
        return { lastInsertRowId: 1 };
      }
      if (sql.includes('UPDATE farmer SET id = ? WHERE id = ?')) {
        const nextId = String(params[0]);
        const previousId = String(params[1]);
        const row = tables.farmer.find((entry) => entry.id === previousId);
        if (row) row.id = nextId;
        return { lastInsertRowId: 0 };
      }
      if (sql.includes('INSERT OR REPLACE INTO local_delivery_receipts')) {
        const row: DeliveryReceiptRow = {
          id: String(params[0]),
          farmerId: String(params[1]),
          localPlotId: String(params[2]),
          serverPlotId: params[3] != null ? String(params[3]) : null,
          plotName: String(params[4]),
          kg: Number(params[5]),
          recordedAt: Number(params[6]),
          qrCodeRef: params[7] != null ? String(params[7]) : null,
          pendingSync: Number(params[8]),
          buyerLabel: String(params[9]),
        };
        tables.deliveryReceipts = tables.deliveryReceipts.filter((entry) => entry.id !== row.id);
        tables.deliveryReceipts.push(row);
        return { lastInsertRowId: 1 };
      }
      if (sql.includes('DELETE FROM local_delivery_receipts WHERE localPlotId = ? OR serverPlotId = ?')) {
        const localPlotId = String(params[0]);
        const serverPlotId = String(params[1]);
        tables.deliveryReceipts = tables.deliveryReceipts.filter(
          (row) => row.localPlotId !== localPlotId && row.serverPlotId !== serverPlotId,
        );
        return { lastInsertRowId: 0 };
      }
      if (sql.includes('DELETE FROM local_delivery_receipts WHERE localPlotId = ?')) {
        const localPlotId = String(params[0]);
        tables.deliveryReceipts = tables.deliveryReceipts.filter(
          (row) => row.localPlotId !== localPlotId,
        );
        return { lastInsertRowId: 0 };
      }
      return { lastInsertRowId: 0 };
    },
    getAllAsync: async <T>(sql: string, params: unknown[] = []): Promise<T[]> => {
      if (sql.includes('FROM plot_title_photos')) {
        const plotId = String(params[0]);
        const rows = tables.titlePhotos
          .filter((r) => r.plotId === plotId)
          .sort((a, b) => b.takenAt - a.takenAt);
        return rows as T[];
      }
      if (sql.includes('FROM plot_evidence')) {
        const plotId = String(params[0]);
        const kind = params.length > 1 ? String(params[1]) : null;
        const rows = tables.evidence
          .filter((r) => r.plotId === plotId && (kind == null || r.kind === kind))
          .sort((a, b) => b.takenAt - a.takenAt);
        return rows as T[];
      }
      if (sql.includes('PRAGMA table_info')) {
        return [] as T[];
      }
      if (sql.includes('FROM plots')) {
        return [] as T[];
      }
      if (sql.includes('FROM local_delivery_receipts')) {
        if (sql.includes('WHERE farmerId IN')) {
          const allowed = new Set(params.map((value) => String(value)));
          const rows = tables.deliveryReceipts
            .filter((row) => allowed.has(row.farmerId))
            .sort((a, b) => b.recordedAt - a.recordedAt);
          return rows as T[];
        }
        if (sql.includes('WHERE farmerId = ?')) {
          const farmerId = String(params[0]);
          const rows = tables.deliveryReceipts
            .filter((row) => row.farmerId === farmerId)
            .sort((a, b) => b.recordedAt - a.recordedAt);
          return rows as T[];
        }
        const rows = [...tables.deliveryReceipts].sort((a, b) => b.recordedAt - a.recordedAt);
        return rows as T[];
      }
      if (sql.includes('FROM plot_legal')) {
        return [] as T[];
      }
      return [] as T[];
    },
    getFirstAsync: async <T>(sql: string, params: unknown[] = []): Promise<T | null> => {
      if (sql.includes('FROM farmer')) {
        if (sql.includes('WHERE id = ?')) {
          const id = String(params[0]);
          const row = tables.farmer.find((entry) => entry.id === id);
          return (row ?? null) as T | null;
        }
        return (tables.farmer[0] ?? null) as T | null;
      }
      return null;
    },
  };

  return {
    openDatabaseAsync: async () => db,
    tables,
    reset,
  };
}
