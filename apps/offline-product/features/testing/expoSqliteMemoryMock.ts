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

export type ExpoSqliteMemoryMock = {
  openDatabaseAsync: (name: string) => Promise<{
    execAsync: (sql: string) => Promise<void>;
    runAsync: (sql: string, params?: unknown[]) => Promise<{ lastInsertRowId: number }>;
    getAllAsync: <T>(sql: string, params?: unknown[]) => Promise<T[]>;
    getFirstAsync: <T>(sql: string, params?: unknown[]) => Promise<T | null>;
  }>;
  tables: {
    titlePhotos: TitlePhotoRow[];
    evidence: EvidenceRow[];
  };
  reset: () => void;
};

export function createExpoSqliteMemoryMock(): ExpoSqliteMemoryMock {
  const tables = {
    titlePhotos: [] as TitlePhotoRow[],
    evidence: [] as EvidenceRow[],
  };
  let titlePhotoId = 1;
  let evidenceId = 1;

  const reset = () => {
    tables.titlePhotos.length = 0;
    tables.evidence.length = 0;
    titlePhotoId = 1;
    evidenceId = 1;
  };

  const db = {
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
      return [] as T[];
    },
    getFirstAsync: async <T>(_sql: string, _params: unknown[] = []): Promise<T | null> => null,
  };

  return {
    openDatabaseAsync: async () => db,
    tables,
    reset,
  };
}
