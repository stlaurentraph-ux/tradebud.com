import * as SQLite from 'expo-sqlite';
import Constants from 'expo-constants';

import type { FarmerProfile, Plot } from './AppStateContext';
import { generateHlcTimestamp } from '@/features/sync/hlc';

export type PlotPhoto = {
  id: number;
  plotId: string;
  uri: string;
  takenAt: number;
  latitude?: number | null;
  longitude?: number | null;
};

export type PlotTitlePhoto = {
  id: number;
  plotId: string;
  uri: string;
  takenAt: number;
};

export type PlotEvidenceKind =
  | 'fpic_repository'
  | 'protected_area_permit'
  | 'labor_evidence'
  | 'tenure_evidence';

export type PlotEvidenceItem = {
  id: number;
  plotId: string;
  kind: PlotEvidenceKind;
  uri: string;
  mimeType: string | null;
  label: string | null;
  takenAt: number;
};

export type PlotTenure = {
  plotId: string;
  informalTenure: boolean;
  informalTenureNote: string | null;
};

export type PendingSyncAction = {
  id: number;
  createdAt: number;
  hlcTimestamp: string;
  actionType: 'harvest' | 'photos_sync' | 'evidence_sync';
  payloadJson: string;
  attempts: number;
  lastError: string | null;
};

export type LocalAuditEvent = {
  id: number;
  timestamp: number;
  userId: string | null;
  deviceId: string | null;
  eventType: string;
  payload: any;
};

const DB_NAME = 'tracebud_offline.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;
function getDb() {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME);
  }
  return dbPromise;
}

function isUuid(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  // UUID v4-ish + other variants: 8-4-4-4-12 hex chars.
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export async function initDatabase() {
  const db = await getDb();
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS farmer (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT,
      role TEXT NOT NULL,
      selfDeclared INTEGER NOT NULL,
      selfDeclaredAt INTEGER,
      fpicConsent INTEGER,
      laborNoChildLabor INTEGER,
      laborNoForcedLabor INTEGER
    );

    CREATE TABLE IF NOT EXISTS plots (
      id TEXT PRIMARY KEY NOT NULL,
      farmerId TEXT NOT NULL,
      name TEXT NOT NULL,
      createdAt INTEGER NOT NULL,
      areaSquareMeters REAL NOT NULL,
      areaHectares REAL NOT NULL,
      kind TEXT NOT NULL,
      pointsJson TEXT NOT NULL,
      declaredAreaHectares REAL,
      discrepancyPercent REAL,
      precisionMetersAtSave REAL
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp INTEGER NOT NULL,
      userId TEXT,
      deviceId TEXT,
      eventType TEXT NOT NULL,
      payloadJson TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS plot_photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plotId TEXT NOT NULL,
      uri TEXT NOT NULL,
      takenAt INTEGER NOT NULL,
      latitude REAL,
      longitude REAL
    );

    CREATE TABLE IF NOT EXISTS plot_legal (
      plotId TEXT PRIMARY KEY NOT NULL,
      cadastralKey TEXT,
      informalTenure INTEGER,
      informalTenureNote TEXT
    );

    CREATE TABLE IF NOT EXISTS plot_title_photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plotId TEXT NOT NULL,
      uri TEXT NOT NULL,
      takenAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS plot_evidence (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plotId TEXT NOT NULL,
      kind TEXT NOT NULL,
      uri TEXT NOT NULL,
      mimeType TEXT,
      label TEXT,
      takenAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pending_sync (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      createdAt INTEGER NOT NULL,
      hlcTimestamp TEXT,
      actionType TEXT NOT NULL,
      payloadJson TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      lastError TEXT
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `);
  await ensureFarmerSchemaExtras(db);
  await ensurePendingSyncSchemaExtras(db);
}

async function ensureFarmerSchemaExtras(db: SQLite.SQLiteDatabase) {
  const rows = await db.getAllAsync<{ name: string }>('PRAGMA table_info(farmer);');
  const has = (col: string) => rows.some((r) => r.name === col);
  if (!has('postalAddress')) {
    await db.execAsync('ALTER TABLE farmer ADD COLUMN postalAddress TEXT;');
  }
  if (!has('commodityCode')) {
    await db.execAsync('ALTER TABLE farmer ADD COLUMN commodityCode TEXT;');
  }
  if (!has('declarationLatitude')) {
    await db.execAsync('ALTER TABLE farmer ADD COLUMN declarationLatitude REAL;');
  }
  if (!has('declarationLongitude')) {
    await db.execAsync('ALTER TABLE farmer ADD COLUMN declarationLongitude REAL;');
  }
  if (!has('declarationGeoCapturedAt')) {
    await db.execAsync('ALTER TABLE farmer ADD COLUMN declarationGeoCapturedAt INTEGER;');
  }
}

async function ensurePendingSyncSchemaExtras(db: SQLite.SQLiteDatabase) {
  const rows = await db.getAllAsync<{ name: string }>('PRAGMA table_info(pending_sync);');
  const has = (col: string) => rows.some((r) => r.name === col);
  if (!has('hlcTimestamp')) {
    await db.execAsync('ALTER TABLE pending_sync ADD COLUMN hlcTimestamp TEXT;');
  }
}

export async function loadAppState(): Promise<{ farmer?: FarmerProfile; plots: Plot[] }> {
  const db = await getDb();
  const farmerRow = await db.getFirstAsync<any>('SELECT * FROM farmer LIMIT 1;');
  const plotRows = await db.getAllAsync<any>('SELECT * FROM plots ORDER BY createdAt DESC;');

  let farmer: FarmerProfile | undefined = farmerRow
    ? (() => {
        const candidateId = farmerRow.id;
        // Backend endpoints expect farmerId to be a UUID; if we stored placeholder text
        // like "Temporary", don't load it to avoid breaking sync.
        if (!isUuid(candidateId)) return undefined;
        return {
        id: candidateId,
        name: farmerRow.name ?? undefined,
        role: farmerRow.role,
        selfDeclared: farmerRow.selfDeclared === 1,
        selfDeclaredAt: farmerRow.selfDeclaredAt ?? undefined,
        fpicConsent: farmerRow.fpicConsent === 1,
        laborNoChildLabor: farmerRow.laborNoChildLabor === 1,
        laborNoForcedLabor: farmerRow.laborNoForcedLabor === 1,
        postalAddress:
          typeof farmerRow.postalAddress === 'string' && farmerRow.postalAddress.trim()
            ? farmerRow.postalAddress.trim()
            : undefined,
        commodityCode:
          typeof farmerRow.commodityCode === 'string' && farmerRow.commodityCode.trim()
            ? farmerRow.commodityCode.trim()
            : undefined,
      };
      })()
    : undefined;

  if (farmer) {
    const photoUri = await getSetting('farmerProfilePhotoUri');
    if (photoUri && photoUri.length > 0) {
      farmer = { ...farmer, profilePhotoUri: photoUri };
    }
  }

  let plotsNeedPersist = false;
  const plots: Plot[] = (plotRows ?? []).map((row) => {
    let points: any[] = [];
    try {
      points = JSON.parse(row.pointsJson);
    } catch {
      points = [];
    }
    let kind = row.kind as Plot['kind'];
    if (kind === 'point' && points.length >= 3) {
      kind = 'polygon';
      plotsNeedPersist = true;
    }
    return {
      id: row.id,
      farmerId: row.farmerId,
      name: row.name,
      createdAt: row.createdAt,
      areaSquareMeters: row.areaSquareMeters,
      areaHectares: row.areaHectares,
      kind,
      points,
      declaredAreaHectares: row.declaredAreaHectares ?? undefined,
      discrepancyPercent: row.discrepancyPercent ?? undefined,
      precisionMetersAtSave: row.precisionMetersAtSave ?? null,
    };
  });

  if (plotsNeedPersist && plots.length > 0) {
    await persistPlots(plots);
  }

  return { farmer, plots };
}

export async function persistFarmer(farmer?: FarmerProfile) {
  const db = await getDb();
  await db.runAsync('DELETE FROM farmer;');
  if (!farmer) return;
  await db.runAsync(
    'INSERT INTO farmer (id, name, role, selfDeclared, selfDeclaredAt, fpicConsent, laborNoChildLabor, laborNoForcedLabor, postalAddress, commodityCode, declarationLatitude, declarationLongitude, declarationGeoCapturedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);',
    [
      farmer.id,
      farmer.name ?? null,
      farmer.role,
      farmer.selfDeclared ? 1 : 0,
      farmer.selfDeclaredAt ?? null,
      farmer.fpicConsent ? 1 : 0,
      farmer.laborNoChildLabor ? 1 : 0,
      farmer.laborNoForcedLabor ? 1 : 0,
      farmer.postalAddress?.trim() ? farmer.postalAddress.trim() : null,
      farmer.commodityCode?.trim() ? farmer.commodityCode.trim() : null,
      farmer.declarationLatitude != null && Number.isFinite(farmer.declarationLatitude)
        ? farmer.declarationLatitude
        : null,
      farmer.declarationLongitude != null && Number.isFinite(farmer.declarationLongitude)
        ? farmer.declarationLongitude
        : null,
      farmer.declarationGeoCapturedAt ?? null,
    ],
  );
}

export async function persistPlots(plots: Plot[]) {
  const db = await getDb();
  await db.runAsync('DELETE FROM plots;');
  for (const plot of plots) {
    await db.runAsync(
      `INSERT INTO plots (
        id, farmerId, name, createdAt, areaSquareMeters, areaHectares, kind, pointsJson,
        declaredAreaHectares, discrepancyPercent, precisionMetersAtSave
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        plot.id,
        plot.farmerId,
        plot.name,
        plot.createdAt,
        plot.areaSquareMeters,
        plot.areaHectares,
        plot.kind,
        JSON.stringify(plot.points),
        plot.declaredAreaHectares ?? null,
        plot.discrepancyPercent ?? null,
        plot.precisionMetersAtSave ?? null,
      ],
    );
  }
}

export async function logAuditEvent(params: {
  userId?: string;
  eventType: string;
  payload: Record<string, unknown>;
}) {
  const db = await getDb();
  const deviceId =
    (Constants as any)?.deviceName ?? (Constants as any)?.deviceId ?? 'unknown-device';
  const timestamp = Date.now();
  await db.runAsync(
    'INSERT INTO audit_log (timestamp, userId, deviceId, eventType, payloadJson) VALUES (?, ?, ?, ?, ?);',
    [timestamp, params.userId ?? null, deviceId, params.eventType, JSON.stringify(params.payload)],
  );
}

export async function loadLocalAuditEvents(params?: { limit?: number }): Promise<LocalAuditEvent[]> {
  const db = await getDb();
  const limit = Math.max(1, Math.min(500, params?.limit ?? 50));
  const rows = await db.getAllAsync<any>(
    'SELECT id, timestamp, userId, deviceId, eventType, payloadJson FROM audit_log ORDER BY timestamp DESC LIMIT ?;',
    [limit],
  );
  return (rows ?? []).map((row) => {
    let payload: any = null;
    try {
      payload = JSON.parse(row.payloadJson);
    } catch {
      payload = null;
    }
    return {
      id: row.id,
      timestamp: row.timestamp,
      userId: row.userId ?? null,
      deviceId: row.deviceId ?? null,
      eventType: row.eventType,
      payload,
    };
  });
}

export async function persistPlotPhoto(photo: Omit<PlotPhoto, 'id'>) {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO plot_photos (plotId, uri, takenAt, latitude, longitude) VALUES (?, ?, ?, ?, ?);`,
    [photo.plotId, photo.uri, photo.takenAt, photo.latitude ?? null, photo.longitude ?? null],
  );
}

export async function loadPhotosForPlot(plotId: string): Promise<PlotPhoto[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM plot_photos WHERE plotId = ? ORDER BY takenAt DESC;',
    [plotId],
  );
  return (rows ?? []).map((row) => ({
    id: row.id,
    plotId: row.plotId,
    uri: row.uri,
    takenAt: row.takenAt,
    latitude: row.latitude ?? null,
    longitude: row.longitude ?? null,
  }));
}

export async function persistPlotTitlePhoto(photo: Omit<PlotTitlePhoto, 'id'>) {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO plot_title_photos (plotId, uri, takenAt) VALUES (?, ?, ?);`,
    [photo.plotId, photo.uri, photo.takenAt],
  );
}

export async function loadTitlePhotosForPlot(plotId: string): Promise<PlotTitlePhoto[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM plot_title_photos WHERE plotId = ? ORDER BY takenAt DESC;',
    [plotId],
  );
  return (rows ?? []).map((row) => ({
    id: row.id,
    plotId: row.plotId,
    uri: row.uri,
    takenAt: row.takenAt,
  }));
}

export async function savePlotCadastralKey(plotId: string, cadastralKey: string | null) {
  const db = await getDb();
  if (!cadastralKey) {
    await db.runAsync('DELETE FROM plot_legal WHERE plotId = ?;', [plotId]);
    return;
  }
  await db.runAsync(
    `INSERT INTO plot_legal (plotId, cadastralKey)
     VALUES (?, ?)
     ON CONFLICT(plotId) DO UPDATE SET cadastralKey = excluded.cadastralKey;`,
    [plotId, cadastralKey],
  );
}

export async function loadPlotCadastralKey(plotId: string): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<any>(
    'SELECT cadastralKey FROM plot_legal WHERE plotId = ? LIMIT 1;',
    [plotId],
  );
  return row?.cadastralKey ?? null;
}

export async function savePlotTenure(
  plotId: string,
  params: { informalTenure: boolean; informalTenureNote: string | null },
) {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO plot_legal (plotId, informalTenure, informalTenureNote)
     VALUES (?, ?, ?)
     ON CONFLICT(plotId) DO UPDATE SET
       informalTenure = excluded.informalTenure,
       informalTenureNote = excluded.informalTenureNote;`,
    [plotId, params.informalTenure ? 1 : 0, params.informalTenureNote ?? null],
  );
}

export async function loadPlotTenure(plotId: string): Promise<PlotTenure> {
  const db = await getDb();
  const row = await db.getFirstAsync<any>(
    'SELECT plotId, informalTenure, informalTenureNote FROM plot_legal WHERE plotId = ? LIMIT 1;',
    [plotId],
  );
  if (!row) {
    return { plotId, informalTenure: false, informalTenureNote: null };
  }
  return {
    plotId,
    informalTenure: row.informalTenure === 1,
    informalTenureNote: row.informalTenureNote ?? null,
  };
}

export async function persistPlotEvidenceItem(item: Omit<PlotEvidenceItem, 'id'>) {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO plot_evidence (plotId, kind, uri, mimeType, label, takenAt)
     VALUES (?, ?, ?, ?, ?, ?);`,
    [item.plotId, item.kind, item.uri, item.mimeType ?? null, item.label ?? null, item.takenAt],
  );
}

export async function loadEvidenceForPlot(
  plotId: string,
  kind?: PlotEvidenceKind,
): Promise<PlotEvidenceItem[]> {
  const db = await getDb();
  const rows = kind
    ? await db.getAllAsync<any>(
        'SELECT * FROM plot_evidence WHERE plotId = ? AND kind = ? ORDER BY takenAt DESC;',
        [plotId, kind],
      )
    : await db.getAllAsync<any>('SELECT * FROM plot_evidence WHERE plotId = ? ORDER BY takenAt DESC;', [
        plotId,
      ]);
  return (rows ?? []).map((row) => ({
    id: row.id,
    plotId: row.plotId,
    kind: row.kind,
    uri: row.uri,
    mimeType: row.mimeType ?? null,
    label: row.label ?? null,
    takenAt: row.takenAt,
  }));
}

export async function enqueuePendingSync(
  action: Omit<PendingSyncAction, 'id' | 'attempts' | 'hlcTimestamp'> & { hlcTimestamp?: string },
) {
  const db = await getDb();
  const last = await db.getFirstAsync<{ hlcTimestamp?: string | null }>(
    'SELECT hlcTimestamp FROM pending_sync ORDER BY id DESC LIMIT 1;',
  );
  const hlcTimestamp = generateHlcTimestamp(action.createdAt, action.hlcTimestamp ?? last?.hlcTimestamp ?? null);
  await db.runAsync(
    `INSERT INTO pending_sync (createdAt, hlcTimestamp, actionType, payloadJson, attempts, lastError)
     VALUES (?, ?, ?, ?, 0, ?);`,
    [action.createdAt, hlcTimestamp, action.actionType, action.payloadJson, action.lastError ?? null],
  );
}

export async function loadPendingSyncActions(): Promise<PendingSyncAction[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<any>('SELECT * FROM pending_sync ORDER BY createdAt ASC;');
  return (rows ?? []).map((row) => ({
    id: row.id,
    createdAt: row.createdAt,
    hlcTimestamp: typeof row.hlcTimestamp === 'string' && row.hlcTimestamp.length > 0 ? row.hlcTimestamp : generateHlcTimestamp(row.createdAt),
    actionType: row.actionType,
    payloadJson: row.payloadJson,
    attempts: row.attempts ?? 0,
    lastError: row.lastError ?? null,
  }));
}

export async function markPendingSyncAttempt(id: number, params: { attempts: number; lastError: string | null }) {
  const db = await getDb();
  await db.runAsync('UPDATE pending_sync SET attempts = ?, lastError = ? WHERE id = ?;', [
    params.attempts,
    params.lastError ?? null,
    id,
  ]);
}

export async function deletePendingSyncAction(id: number) {
  const db = await getDb();
  await db.runAsync('DELETE FROM pending_sync WHERE id = ?;', [id]);
}

export async function getSetting(key: string): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<any>('SELECT value FROM settings WHERE key = ? LIMIT 1;', [key]);
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?);', [key, value]);
}

export async function deleteSetting(key: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM settings WHERE key = ?;', [key]);
}

export async function saveFarmerProfilePhotoUri(uri: string | null): Promise<void> {
  if (uri == null || uri === '') {
    await setSetting('farmerProfilePhotoUri', '');
  } else {
    await setSetting('farmerProfilePhotoUri', uri);
  }
}

export async function deletePlotLocalData(plotId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM plot_photos WHERE plotId = ?;', [plotId]);
  await db.runAsync('DELETE FROM plot_title_photos WHERE plotId = ?;', [plotId]);
  await db.runAsync('DELETE FROM plot_evidence WHERE plotId = ?;', [plotId]);
  await db.runAsync('DELETE FROM plot_legal WHERE plotId = ?;', [plotId]);
  await db.runAsync('DELETE FROM pending_sync WHERE payloadJson LIKE ?;', [`%\"plotId\":\"${plotId}\"%`]);
}

