import * as SQLite from 'expo-sqlite';
import Constants from 'expo-constants';

import type { FarmerProfile, Plot } from './AppStateContext';
import { parsePlotGeometryCaptureMetadata } from '@/features/compliance/plotGeometryCapture';
import { generateHlcTimestamp } from '@/features/sync/hlc';
import {
  pendingSyncDedupKey,
  planPendingSyncCompaction,
} from '@/features/sync/pendingSyncDedup';
import { resolveDominantFarmerIdFromPlots } from '@/features/state/farmerScopeRepair';

export type PlotPhoto = {
  id: number;
  plotId: string;
  uri: string;
  takenAt: number;
  latitude?: number | null;
  longitude?: number | null;
  direction?: 'north' | 'east' | 'south' | 'west' | null;
  storagePath?: string | null;
};

export type PlotTitlePhoto = {
  id: number;
  plotId: string;
  uri: string;
  takenAt: number;
  storagePath?: string | null;
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
  storagePath?: string | null;
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
  actionType:
    | 'harvest'
    | 'photos_sync'
    | 'evidence_sync'
    | 'audit_sync'
    | 'consent_approve'
    | 'consent_deny'
    | 'consent_revoke';
  payloadJson: string;
  attempts: number;
  lastError: string | null;
  lastAttemptAt: number | null;
};

const MAX_PENDING_SYNC_ACTIONS = 1000;

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
/** Serializes farmer-table writes so concurrent persist/rekey cannot hit UNIQUE on farmer.id. */
let farmerDbLock: Promise<void> = Promise.resolve();

function withFarmerDbLock<T>(task: () => Promise<T>): Promise<T> {
  const run = farmerDbLock.then(task, task);
  farmerDbLock = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

/** @internal Reset singleton DB between Vitest cases. */
export function resetPersistenceDatabaseForTests(): void {
  dbPromise = null;
  farmerDbLock = Promise.resolve();
}

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
  await ensurePlotSchemaExtras(db);
  await ensurePlotPhotosSchemaExtras(db);
  await ensurePlotEvidenceStorageSchemaExtras(db);
  await ensurePlotLegalSchemaExtras(db);
  await ensureLocalDeliveryReceiptsSchema(db);
  await ensurePlotMappingDraftsSchema(db);
  await ensureFieldRosterSchema(db);
}

export type FieldRosterEntryRow = {
  farmerId: string;
  source: 'roster' | 'provisional';
  fullName: string;
  village: string;
  phone: string | null;
  nationalId: string | null;
  email: string | null;
  producerContactId: string | null;
  campaignId: string | null;
  assignmentId: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  createdAt: number;
  updatedAt: number;
};

async function ensureFieldRosterSchema(db: SQLite.SQLiteDatabase) {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS field_roster_entries (
      farmerId TEXT PRIMARY KEY NOT NULL,
      source TEXT NOT NULL,
      fullName TEXT NOT NULL,
      village TEXT NOT NULL,
      phone TEXT,
      nationalId TEXT,
      email TEXT,
      producerContactId TEXT,
      campaignId TEXT,
      assignmentId TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );
  `);
  try {
    await db.execAsync('ALTER TABLE field_roster_entries ADD COLUMN assignmentId TEXT;');
  } catch {
    // Column already exists.
  }
}

function mapFieldRosterRow(row: Record<string, unknown>): FieldRosterEntryRow {
  return {
    farmerId: String(row.farmerId),
    source: row.source === 'roster' ? 'roster' : 'provisional',
    fullName: String(row.fullName ?? ''),
    village: String(row.village ?? ''),
    phone: row.phone != null ? String(row.phone) : null,
    nationalId: row.nationalId != null ? String(row.nationalId) : null,
    email: row.email != null ? String(row.email) : null,
    producerContactId: row.producerContactId != null ? String(row.producerContactId) : null,
    campaignId: row.campaignId != null ? String(row.campaignId) : null,
    assignmentId: row.assignmentId != null ? String(row.assignmentId) : null,
    status:
      row.status === 'in_progress' || row.status === 'completed'
        ? row.status
        : 'pending',
    createdAt: Number(row.createdAt ?? 0),
    updatedAt: Number(row.updatedAt ?? 0),
  };
}

export async function loadFieldRosterEntries(): Promise<FieldRosterEntryRow[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM field_roster_entries ORDER BY fullName COLLATE NOCASE ASC, village COLLATE NOCASE ASC;',
  );
  return (rows ?? []).map(mapFieldRosterRow);
}

export async function loadFieldRosterEntryByFarmerId(
  farmerId: string,
): Promise<FieldRosterEntryRow | null> {
  const id = farmerId.trim();
  if (!id) return null;
  const db = await getDb();
  const row = await db.getFirstAsync<Record<string, unknown>>(
    'SELECT * FROM field_roster_entries WHERE farmerId = ? LIMIT 1;',
    [id],
  );
  return row ? mapFieldRosterRow(row) : null;
}

export async function persistFieldRosterEntry(entry: FieldRosterEntryRow): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `
      INSERT INTO field_roster_entries (
        farmerId, source, fullName, village, phone, nationalId, email,
        producerContactId, campaignId, assignmentId, status, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(farmerId) DO UPDATE SET
        source = excluded.source,
        fullName = excluded.fullName,
        village = excluded.village,
        phone = excluded.phone,
        nationalId = excluded.nationalId,
        email = excluded.email,
        producerContactId = excluded.producerContactId,
        campaignId = excluded.campaignId,
        assignmentId = excluded.assignmentId,
        status = excluded.status,
        updatedAt = excluded.updatedAt
    `,
    [
      entry.farmerId,
      entry.source,
      entry.fullName,
      entry.village,
      entry.phone,
      entry.nationalId,
      entry.email,
      entry.producerContactId,
      entry.campaignId,
      entry.assignmentId,
      entry.status,
      entry.createdAt,
      entry.updatedAt,
    ],
  );
}

export async function updateFieldRosterMemberStatus(
  farmerId: string,
  status: FieldRosterEntryRow['status'],
): Promise<void> {
  const id = farmerId.trim();
  if (!id) return;
  const db = await getDb();
  await db.runAsync(
    'UPDATE field_roster_entries SET status = ?, updatedAt = ? WHERE farmerId = ?;',
    [status, Date.now(), id],
  );
}

async function ensurePlotMappingDraftsSchema(db: SQLite.SQLiteDatabase) {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS plot_mapping_drafts (
      farmerId TEXT PRIMARY KEY NOT NULL,
      editPlotId TEXT,
      plotName TEXT,
      captureMethod TEXT,
      isRecording INTEGER NOT NULL DEFAULT 0,
      drawTracingActive INTEGER NOT NULL DEFAULT 0,
      pointsJson TEXT NOT NULL,
      updatedAt INTEGER NOT NULL
    );
  `);
}

async function ensureLocalDeliveryReceiptsSchema(db: SQLite.SQLiteDatabase) {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS local_delivery_receipts (
      id TEXT PRIMARY KEY NOT NULL,
      farmerId TEXT NOT NULL,
      localPlotId TEXT NOT NULL,
      serverPlotId TEXT,
      plotName TEXT,
      kg REAL NOT NULL,
      recordedAt INTEGER NOT NULL,
      qrCodeRef TEXT,
      pendingSync INTEGER NOT NULL DEFAULT 0,
      buyerLabel TEXT
    );
  `);
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
  if (!has('lastAttemptAt')) {
    await db.execAsync('ALTER TABLE pending_sync ADD COLUMN lastAttemptAt INTEGER;');
  }
}

async function ensurePlotPhotosSchemaExtras(db: SQLite.SQLiteDatabase) {
  const rows = await db.getAllAsync<{ name: string }>('PRAGMA table_info(plot_photos);');
  const has = (col: string) => rows.some((r) => r.name === col);
  if (!has('direction')) {
    await db.execAsync('ALTER TABLE plot_photos ADD COLUMN direction TEXT;');
  }
  if (!has('storagePath')) {
    await db.execAsync('ALTER TABLE plot_photos ADD COLUMN storagePath TEXT;');
  }
}

async function ensurePlotEvidenceStorageSchemaExtras(db: SQLite.SQLiteDatabase) {
  for (const table of ['plot_title_photos', 'plot_evidence'] as const) {
    const rows = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table});`);
    const has = (col: string) => rows.some((r) => r.name === col);
    if (!has('storagePath')) {
      await db.execAsync(`ALTER TABLE ${table} ADD COLUMN storagePath TEXT;`);
    }
  }
}

async function ensurePlotSchemaExtras(db: SQLite.SQLiteDatabase) {
  const rows = await db.getAllAsync<{ name: string }>('PRAGMA table_info(plots);');
  const has = (col: string) => rows.some((r) => r.name === col);
  if (!has('landTenureDeclared')) {
    await db.execAsync('ALTER TABLE plots ADD COLUMN landTenureDeclared INTEGER;');
  }
  if (!has('landTenureDeclaredAt')) {
    await db.execAsync('ALTER TABLE plots ADD COLUMN landTenureDeclaredAt INTEGER;');
  }
  if (!has('noDeforestationDeclared')) {
    await db.execAsync('ALTER TABLE plots ADD COLUMN noDeforestationDeclared INTEGER;');
  }
  if (!has('noDeforestationDeclaredAt')) {
    await db.execAsync('ALTER TABLE plots ADD COLUMN noDeforestationDeclaredAt INTEGER;');
  }
  if (!has('geometryCaptureMetaJson')) {
    await db.execAsync('ALTER TABLE plots ADD COLUMN geometryCaptureMetaJson TEXT;');
  }
}

async function ensurePlotLegalSchemaExtras(db: SQLite.SQLiteDatabase) {
  const rows = await db.getAllAsync<{ name: string }>('PRAGMA table_info(plot_legal);');
  const has = (col: string) => rows.some((r) => r.name === col);
  if (!has('serverPlotId')) {
    await db.execAsync('ALTER TABLE plot_legal ADD COLUMN serverPlotId TEXT;');
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
        selfDeclared: sqliteBoolFlag(farmerRow.selfDeclared),
        selfDeclaredAt: farmerRow.selfDeclaredAt ?? undefined,
        fpicConsent: sqliteBoolFlag(farmerRow.fpicConsent),
        laborNoChildLabor: sqliteBoolFlag(farmerRow.laborNoChildLabor),
        laborNoForcedLabor: sqliteBoolFlag(farmerRow.laborNoForcedLabor),
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
      landTenureDeclared: row.landTenureDeclared === 1 ? true : row.landTenureDeclared === 0 ? false : undefined,
      landTenureDeclaredAt: row.landTenureDeclaredAt ?? undefined,
      noDeforestationDeclared:
        row.noDeforestationDeclared === 1 ? true : row.noDeforestationDeclared === 0 ? false : undefined,
      noDeforestationDeclaredAt: row.noDeforestationDeclaredAt ?? undefined,
      geometryCapture: parsePlotGeometryCaptureMetadata(row.geometryCaptureMetaJson) ?? undefined,
    };
  });

  if (plotsNeedPersist && plots.length > 0) {
    await persistPlots(plots);
  }

  if (!farmer && plots.length > 0) {
    const dominantId = resolveDominantFarmerIdFromPlots(plots);
    if (dominantId && isUuid(dominantId)) {
      farmer = {
        id: dominantId,
        role: 'farmer',
        selfDeclared: false,
      };
      await persistFarmer(farmer);
    }
  }

  if (farmer && plots.some((plot) => plot.farmerId !== farmer!.id)) {
    await adoptOnDeviceFarmerScope(farmer.id);
    const repairedRows = await db.getAllAsync<any>('SELECT * FROM plots ORDER BY createdAt DESC;');
    const repairedPlots: Plot[] = (repairedRows ?? []).map((row) => {
      let points: any[] = [];
      try {
        points = JSON.parse(row.pointsJson);
      } catch {
        points = [];
      }
      let kind = row.kind as Plot['kind'];
      if (kind === 'point' && points.length >= 3) {
        kind = 'polygon';
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
        landTenureDeclared:
          row.landTenureDeclared === 1 ? true : row.landTenureDeclared === 0 ? false : undefined,
        landTenureDeclaredAt: row.landTenureDeclaredAt ?? undefined,
        noDeforestationDeclared:
          row.noDeforestationDeclared === 1
            ? true
            : row.noDeforestationDeclared === 0
              ? false
              : undefined,
        noDeforestationDeclaredAt: row.noDeforestationDeclaredAt ?? undefined,
        geometryCapture: parsePlotGeometryCaptureMetadata(row.geometryCaptureMetaJson) ?? undefined,
      };
    });
    return { farmer, plots: repairedPlots };
  }

  return { farmer, plots };
}

export async function persistFarmer(farmer?: FarmerProfile) {
  return withFarmerDbLock(async () => {
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
  });
}

export async function persistPlots(plots: Plot[]) {
  const db = await getDb();
  await db.runAsync('DELETE FROM plots;');
  for (const plot of plots) {
    await db.runAsync(
      `INSERT INTO plots (
        id, farmerId, name, createdAt, areaSquareMeters, areaHectares, kind, pointsJson,
        declaredAreaHectares, discrepancyPercent, precisionMetersAtSave,
        landTenureDeclared, landTenureDeclaredAt, noDeforestationDeclared, noDeforestationDeclaredAt,
        geometryCaptureMetaJson
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
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
        plot.landTenureDeclared === true ? 1 : plot.landTenureDeclared === false ? 0 : null,
        plot.landTenureDeclaredAt ?? null,
        plot.noDeforestationDeclared === true ? 1 : plot.noDeforestationDeclared === false ? 0 : null,
        plot.noDeforestationDeclaredAt ?? null,
        plot.geometryCapture ? JSON.stringify(plot.geometryCapture) : null,
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
    `INSERT INTO plot_photos (plotId, uri, takenAt, latitude, longitude, direction, storagePath) VALUES (?, ?, ?, ?, ?, ?, ?);`,
    [
      photo.plotId,
      photo.uri,
      photo.takenAt,
      photo.latitude ?? null,
      photo.longitude ?? null,
      photo.direction ?? null,
      photo.storagePath ?? null,
    ],
  );
}

/** Replace any prior ground-truth photo for the same plot + direction. */
export async function upsertPlotGroundPhoto(photo: Omit<PlotPhoto, 'id'>) {
  const db = await getDb();
  if (photo.direction) {
    await db.runAsync('DELETE FROM plot_photos WHERE plotId = ? AND direction = ?;', [
      photo.plotId,
      photo.direction,
    ]);
  }
  await persistPlotPhoto(photo);
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
    direction:
      row.direction === 'north' ||
      row.direction === 'east' ||
      row.direction === 'south' ||
      row.direction === 'west'
        ? row.direction
        : null,
    storagePath: row.storagePath ?? null,
  }));
}

export async function persistPlotTitlePhoto(photo: Omit<PlotTitlePhoto, 'id'>): Promise<number> {
  const db = await getDb();
  const result = await db.runAsync(
    `INSERT INTO plot_title_photos (plotId, uri, takenAt, storagePath) VALUES (?, ?, ?, ?);`,
    [photo.plotId, photo.uri, photo.takenAt, photo.storagePath ?? null],
  );
  return Number(result.lastInsertRowId);
}

export async function updatePlotTitlePhotoAfterUpload(
  photoId: number,
  params: { uri: string; storagePath: string },
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE plot_title_photos SET uri = ?, storagePath = ? WHERE id = ?;',
    [params.uri, params.storagePath, photoId],
  );
}

export async function updatePlotGroundPhotoAfterUpload(
  photoId: number,
  params: { uri: string; storagePath: string },
): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE plot_photos SET uri = ?, storagePath = ? WHERE id = ?;', [
    params.uri,
    params.storagePath,
    photoId,
  ]);
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
    storagePath: row.storagePath ?? null,
  }));
}

export async function deletePlotTitlePhoto(photoId: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM plot_title_photos WHERE id = ?;', [photoId]);
}

export function isPlotTitlePhotoPendingUpload(photo: Pick<PlotTitlePhoto, 'storagePath'>): boolean {
  return !photo.storagePath?.trim();
}

export function isPlotGroundPhotoPendingUpload(
  photo: Pick<PlotPhoto, 'uri' | 'storagePath'>,
): boolean {
  if (photo.storagePath?.trim()) return false;
  const uri = photo.uri.trim();
  if (!uri) return false;
  if (uri.startsWith('http://') || uri.startsWith('https://')) return false;
  return uri.startsWith('file://') || uri.startsWith('content://') || uri.startsWith('ph://');
}

export function isPlotEvidencePendingUpload(
  item: Pick<PlotEvidenceItem, 'uri' | 'storagePath'>,
): boolean {
  if (item.storagePath?.trim()) return false;
  const uri = item.uri.trim();
  if (!uri) return false;
  if (uri.startsWith('http://') || uri.startsWith('https://')) return false;
  return uri.startsWith('file://') || uri.startsWith('content://') || uri.startsWith('ph://');
}

export function isLocalDeliveryReceiptPendingUpload(
  receipt: Pick<LocalDeliveryReceiptRow, 'pendingSync' | 'qrCodeRef'>,
): boolean {
  if (!receipt.pendingSync) return false;
  return !receipt.qrCodeRef?.trim();
}

export async function deletePlotEvidenceItem(evidenceId: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM plot_evidence WHERE id = ?;', [evidenceId]);
}

export async function updatePlotEvidenceUri(evidenceId: number, uri: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE plot_evidence SET uri = ? WHERE id = ?;', [uri, evidenceId]);
}

export async function updatePlotEvidenceAfterUpload(
  evidenceId: number,
  params: { uri: string; storagePath: string },
): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE plot_evidence SET uri = ?, storagePath = ? WHERE id = ?;', [
    params.uri,
    params.storagePath,
    evidenceId,
  ]);
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

export async function savePlotServerLink(localPlotId: string, serverPlotId: string): Promise<void> {
  const db = await getDb();
  const trimmed = serverPlotId.trim();
  if (!trimmed) return;
  await db.runAsync(
    `INSERT INTO plot_legal (plotId, serverPlotId)
     VALUES (?, ?)
     ON CONFLICT(plotId) DO UPDATE SET serverPlotId = excluded.serverPlotId;`,
    [localPlotId, trimmed],
  );
}

export async function loadPlotServerLinks(): Promise<Record<string, string>> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ plotId: string; serverPlotId: string | null }>(
    `SELECT plotId, serverPlotId FROM plot_legal
     WHERE serverPlotId IS NOT NULL AND TRIM(serverPlotId) != '';`,
  );
  const links: Record<string, string> = {};
  for (const row of rows ?? []) {
    if (row.plotId && row.serverPlotId?.trim()) {
      links[row.plotId] = row.serverPlotId.trim();
    }
  }
  return links;
}

export async function clearPlotServerLink(localPlotId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE plot_legal SET serverPlotId = NULL WHERE plotId = ?;', [localPlotId]);
}

export async function persistPlotServerLinks(links: Record<string, string>): Promise<void> {
  const existing = await loadPlotServerLinks().catch((): Record<string, string> => ({}));
  for (const localPlotId of Object.keys(existing)) {
    if (!(localPlotId in links)) {
      await clearPlotServerLink(localPlotId).catch(() => undefined);
    }
  }
  for (const [localPlotId, serverPlotId] of Object.entries(links)) {
    await savePlotServerLink(localPlotId, serverPlotId);
  }
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
    storagePath: row.storagePath ?? null,
  }));
}

export async function compactDuplicatePendingSyncActions(): Promise<number> {
  const rows = await loadPendingSyncActions();
  const { deleteIds } = planPendingSyncCompaction(rows);
  for (const id of deleteIds) {
    await deletePendingSyncAction(id);
  }
  return deleteIds.length;
}

export async function enqueuePendingSync(
  action: Omit<PendingSyncAction, 'id' | 'attempts' | 'hlcTimestamp' | 'lastAttemptAt'> & { hlcTimestamp?: string },
) {
  const dedupKey = pendingSyncDedupKey(action.actionType, action.payloadJson);
  if (dedupKey) {
    const existing = (await loadPendingSyncActions()).find(
      (row) => pendingSyncDedupKey(row.actionType, row.payloadJson) === dedupKey,
    );
    if (existing) {
      const db = await getDb();
      await db.runAsync('UPDATE pending_sync SET payloadJson = ?, lastError = ? WHERE id = ?;', [
        action.payloadJson,
        action.lastError ?? existing.lastError ?? null,
        existing.id,
      ]);
      return;
    }
  }

  const db = await getDb();
  const last = await db.getFirstAsync<{ hlcTimestamp?: string | null }>(
    'SELECT hlcTimestamp FROM pending_sync ORDER BY id DESC LIMIT 1;',
  );
  const hlcTimestamp = generateHlcTimestamp(action.createdAt, action.hlcTimestamp ?? last?.hlcTimestamp ?? null);
  await db.runAsync(
    `INSERT INTO pending_sync (createdAt, hlcTimestamp, actionType, payloadJson, attempts, lastError, lastAttemptAt)
     VALUES (?, ?, ?, ?, 0, ?, NULL);`,
    [action.createdAt, hlcTimestamp, action.actionType, action.payloadJson, action.lastError ?? null],
  );
  await db.runAsync(
    `DELETE FROM pending_sync
     WHERE id IN (
       SELECT id FROM pending_sync
       ORDER BY createdAt ASC, id ASC
       LIMIT (
         SELECT MAX(COUNT(*) - ?, 0) FROM pending_sync
       )
     );`,
    [MAX_PENDING_SYNC_ACTIONS],
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
    lastAttemptAt: row.lastAttemptAt ?? null,
  }));
}

export async function markPendingSyncAttempt(
  id: number,
  params: { attempts: number; lastError: string | null; lastAttemptAt?: number | null },
) {
  const db = await getDb();
  await db.runAsync('UPDATE pending_sync SET attempts = ?, lastError = ?, lastAttemptAt = ? WHERE id = ?;', [
    params.attempts,
    params.lastError ?? null,
    params.lastAttemptAt ?? Date.now(),
    id,
  ]);
}

export async function deletePendingSyncAction(id: number) {
  const db = await getDb();
  await db.runAsync('DELETE FROM pending_sync WHERE id = ?;', [id]);
}

export type LocalDeliveryReceiptRow = {
  id: string;
  farmerId: string;
  localPlotId: string;
  serverPlotId: string | null;
  plotName: string;
  kg: number;
  recordedAt: number;
  qrCodeRef: string | null;
  pendingSync: boolean;
  buyerLabel: string;
};

export async function persistLocalDeliveryReceipt(row: LocalDeliveryReceiptRow): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO local_delivery_receipts
      (id, farmerId, localPlotId, serverPlotId, plotName, kg, recordedAt, qrCodeRef, pendingSync, buyerLabel)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      row.id,
      row.farmerId,
      row.localPlotId,
      row.serverPlotId,
      row.plotName,
      row.kg,
      row.recordedAt,
      row.qrCodeRef,
      row.pendingSync ? 1 : 0,
      row.buyerLabel,
    ],
  );
}

function mapLocalDeliveryReceiptRows(rows: any[] | null | undefined): LocalDeliveryReceiptRow[] {
  return (rows ?? []).map((row) => ({
    id: String(row.id),
    farmerId: String(row.farmerId),
    localPlotId: String(row.localPlotId),
    serverPlotId: row.serverPlotId != null ? String(row.serverPlotId) : null,
    plotName: String(row.plotName ?? ''),
    kg: Number(row.kg),
    recordedAt: Number(row.recordedAt),
    qrCodeRef: row.qrCodeRef != null ? String(row.qrCodeRef) : null,
    pendingSync: row.pendingSync === 1,
    buyerLabel: String(row.buyerLabel ?? ''),
  }));
}

export async function loadLocalDeliveryReceiptsForFarmer(
  farmerId: string,
  options?: { alsoFarmerIds?: readonly string[] },
): Promise<LocalDeliveryReceiptRow[]> {
  const db = await getDb();
  const farmerIds: string[] = [];
  const seen = new Set<string>();
  for (const raw of [farmerId, ...(options?.alsoFarmerIds ?? [])]) {
    const id = String(raw ?? '').trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    farmerIds.push(id);
  }
  if (farmerIds.length === 0) return [];

  const placeholders = farmerIds.map(() => '?').join(', ');
  const scoped = await db.getAllAsync<any>(
    `SELECT * FROM local_delivery_receipts WHERE farmerId IN (${placeholders}) ORDER BY recordedAt DESC;`,
    farmerIds,
  );
  const scopedRows = dedupeLocalDeliveryReceiptRows(mapLocalDeliveryReceiptRows(scoped));
  if (farmerIds.length > 1) {
    return scopedRows;
  }

  const all = await db.getAllAsync<any>(
    'SELECT * FROM local_delivery_receipts ORDER BY recordedAt DESC;',
  );
  const allRows = dedupeLocalDeliveryReceiptRows(mapLocalDeliveryReceiptRows(all));
  // Single-user field app: legacy farmerId columns may differ after cross-device restore.
  return allRows.length > scopedRows.length ? allRows : scopedRows;
}

function dedupeLocalDeliveryReceiptRows(
  rows: LocalDeliveryReceiptRow[],
): LocalDeliveryReceiptRow[] {
  const seen = new Set<string>();
  const merged: LocalDeliveryReceiptRow[] = [];
  for (const row of rows) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    merged.push(row);
  }
  return merged;
}

/** Single-user device: all stored delivery receipts regardless of legacy farmerId columns. */
export async function loadAllLocalDeliveryReceipts(): Promise<LocalDeliveryReceiptRow[]> {
  const db = await getDb();
  const all = await db.getAllAsync<any>(
    'SELECT * FROM local_delivery_receipts ORDER BY recordedAt DESC;',
  );
  return dedupeLocalDeliveryReceiptRows(mapLocalDeliveryReceiptRows(all));
}

export async function listLocalDeliveryReceiptFarmerIds(): Promise<string[]> {
  const rows = await loadAllLocalDeliveryReceipts();
  return [...new Set(rows.map((row) => row.farmerId.trim()).filter(Boolean))];
}

export async function deleteLocalDeliveryReceipt(id: string): Promise<boolean> {
  const trimmed = id.trim();
  if (!trimmed) return false;
  const db = await getDb();
  const existing = await db.getFirstAsync<{ id: string }>(
    'SELECT id FROM local_delivery_receipts WHERE id = ? LIMIT 1;',
    [trimmed],
  );
  if (!existing) return false;
  await db.runAsync('DELETE FROM local_delivery_receipts WHERE id = ?;', [trimmed]);
  return true;
}

const RECEIPT_MATCH_WINDOW_MS = 2 * 60 * 60 * 1000;

export async function findLocalDeliveryReceiptIdsForRemoval(params: {
  farmerId: string;
  receipt: { id: string; plotId: string; kg: number; createdAt: string | null; qrCodeRef: string | null };
}): Promise<string[]> {
  const rows = await loadLocalDeliveryReceiptsForFarmer(params.farmerId);
  const receiptId = params.receipt.id.trim();
  const receiptPlotId = params.receipt.plotId.trim();
  const receiptMs = params.receipt.createdAt ? new Date(params.receipt.createdAt).getTime() : null;
  const receiptQr = params.receipt.qrCodeRef?.trim() ?? '';
  const ids = new Set<string>();

  for (const row of rows) {
    if (row.id === receiptId) {
      ids.add(row.id);
      continue;
    }
    if (receiptQr && row.qrCodeRef?.trim() === receiptQr) {
      ids.add(row.id);
      continue;
    }
    if (Math.abs(row.kg - params.receipt.kg) > 0.5) continue;
    if (
      receiptMs != null &&
      Number.isFinite(receiptMs) &&
      Math.abs(row.recordedAt - receiptMs) > RECEIPT_MATCH_WINDOW_MS
    ) {
      continue;
    }
    const plotMatches =
      row.localPlotId === receiptPlotId ||
      (row.serverPlotId != null && row.serverPlotId === receiptPlotId);
    if (plotMatches) {
      ids.add(row.id);
    }
  }

  return [...ids];
}

export async function deletePendingHarvestSyncForReceipt(params: {
  receiptId: string;
  receipt: { id: string; plotId: string; kg: number; createdAt: string | null };
}): Promise<number> {
  const receiptId = params.receiptId.trim();
  let removed = 0;

  if (receiptId.startsWith('pending-')) {
    const actionId = Number(receiptId.slice('pending-'.length));
    if (Number.isFinite(actionId)) {
      await deletePendingSyncAction(actionId);
      return 1;
    }
  }

  const actions = await loadPendingSyncActions();
  const receiptMs = params.receipt.createdAt ? new Date(params.receipt.createdAt).getTime() : null;

  for (const action of actions) {
    if (action.actionType !== 'harvest') continue;
    let payload: { clientEventId?: string; plotId?: string; kg?: number };
    try {
      payload = JSON.parse(action.payloadJson) as { clientEventId?: string; plotId?: string; kg?: number };
    } catch {
      continue;
    }
    const clientEventId = String(payload.clientEventId ?? '').trim();
    if (clientEventId && (clientEventId === receiptId || receiptId === `pending-${action.id}`)) {
      await deletePendingSyncAction(action.id);
      removed += 1;
      continue;
    }
    const payloadPlotId = String(payload.plotId ?? '').trim();
    const payloadKg = Number(payload.kg ?? 0);
    if (
      payloadPlotId &&
      payloadPlotId === params.receipt.plotId.trim() &&
      Number.isFinite(payloadKg) &&
      Math.abs(payloadKg - params.receipt.kg) <= 0.5 &&
      receiptMs != null &&
      Math.abs(action.createdAt - receiptMs) <= RECEIPT_MATCH_WINDOW_MS
    ) {
      await deletePendingSyncAction(action.id);
      removed += 1;
    }
  }

  return removed;
}

export async function updateLocalDeliveryReceipt(
  id: string,
  patch: Partial<
    Pick<LocalDeliveryReceiptRow, 'qrCodeRef' | 'pendingSync' | 'serverPlotId' | 'recordedAt'>
  >,
): Promise<void> {
  const db = await getDb();
  const existing = await db.getFirstAsync<any>(
    'SELECT * FROM local_delivery_receipts WHERE id = ? LIMIT 1;',
    [id],
  );
  if (!existing) return;
  await db.runAsync(
    `UPDATE local_delivery_receipts
     SET qrCodeRef = ?, pendingSync = ?, serverPlotId = ?, recordedAt = ?
     WHERE id = ?;`,
    [
      patch.qrCodeRef !== undefined ? patch.qrCodeRef : existing.qrCodeRef,
      patch.pendingSync !== undefined ? (patch.pendingSync ? 1 : 0) : existing.pendingSync,
      patch.serverPlotId !== undefined ? patch.serverPlotId : existing.serverPlotId,
      patch.recordedAt !== undefined ? patch.recordedAt : existing.recordedAt,
      id,
    ],
  );
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

export async function deleteSettingsByPrefix(prefix: string): Promise<void> {
  const trimmed = prefix.trim();
  if (!trimmed) return;
  const db = await getDb();
  await db.runAsync('DELETE FROM settings WHERE key LIKE ?;', [`${trimmed}%`]);
}

export async function saveFarmerProfilePhotoUri(uri: string | null): Promise<void> {
  if (uri == null || uri === '') {
    await setSetting('farmerProfilePhotoUri', '');
  } else {
    await setSetting('farmerProfilePhotoUri', uri);
  }
}

export type PlotMappingDraftRow = {
  farmerId: string;
  editPlotId: string | null;
  plotName: string | null;
  captureMethod: string | null;
  isRecording: boolean;
  drawTracingActive: boolean;
  points: Array<{ latitude: number; longitude: number; timestamp?: number }>;
  updatedAt: number;
};

export async function persistPlotMappingDraft(row: PlotMappingDraftRow): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO plot_mapping_drafts
      (farmerId, editPlotId, plotName, captureMethod, isRecording, drawTracingActive, pointsJson, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      row.farmerId,
      row.editPlotId,
      row.plotName,
      row.captureMethod,
      row.isRecording ? 1 : 0,
      row.drawTracingActive ? 1 : 0,
      JSON.stringify(row.points),
      row.updatedAt,
    ],
  );
}

export async function loadPlotMappingDraft(farmerId: string): Promise<PlotMappingDraftRow | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<any>(
    'SELECT * FROM plot_mapping_drafts WHERE farmerId = ? LIMIT 1;',
    [farmerId],
  );
  if (!row) return null;
  let points: PlotMappingDraftRow['points'] = [];
  try {
    const parsed = JSON.parse(String(row.pointsJson ?? '[]'));
    if (Array.isArray(parsed)) points = parsed;
  } catch {
    points = [];
  }
  return {
    farmerId: String(row.farmerId),
    editPlotId: row.editPlotId ?? null,
    plotName: row.plotName ?? null,
    captureMethod: row.captureMethod ?? null,
    isRecording: Boolean(row.isRecording),
    drawTracingActive: Boolean(row.drawTracingActive),
    points,
    updatedAt: Number(row.updatedAt) || 0,
  };
}

export async function clearPlotMappingDraft(farmerId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM plot_mapping_drafts WHERE farmerId = ?;', [farmerId]);
}

export async function deletePlotLocalData(plotId: string): Promise<void> {
  const db = await getDb();
  const links = await loadPlotServerLinks().catch((): Record<string, string> => ({}));
  const serverPlotId = links[plotId]?.trim();
  if (serverPlotId) {
    await db.runAsync(
      'DELETE FROM local_delivery_receipts WHERE localPlotId = ? OR serverPlotId = ?;',
      [plotId, serverPlotId],
    );
  } else {
    await db.runAsync('DELETE FROM local_delivery_receipts WHERE localPlotId = ?;', [plotId]);
  }
  await db.runAsync('DELETE FROM plot_photos WHERE plotId = ?;', [plotId]);
  await db.runAsync('DELETE FROM plot_title_photos WHERE plotId = ?;', [plotId]);
  await db.runAsync('DELETE FROM plot_evidence WHERE plotId = ?;', [plotId]);
  await db.runAsync('DELETE FROM plot_legal WHERE plotId = ?;', [plotId]);
  await db.runAsync('DELETE FROM pending_sync WHERE payloadJson LIKE ?;', [`%\"plotId\":\"${plotId}\"%`]);
}

function sqliteBoolFlag(value: unknown): boolean {
  return value === 1 || value === true;
}

/** Align local farmer UUID with Supabase auth user id when server has no plots under either id. */
export async function rekeyFarmerIdInDatabase(previousId: string, nextId: string): Promise<void> {
  if (!previousId || !nextId || previousId === nextId) return;
  return withFarmerDbLock(async () => {
    const db = await getDb();
    const previousRow = await db.getFirstAsync<Record<string, unknown>>(
      'SELECT * FROM farmer WHERE id = ?;',
      [previousId],
    );
    const nextRow = await db.getFirstAsync<Record<string, unknown>>(
      'SELECT * FROM farmer WHERE id = ?;',
      [nextId],
    );

    await db.runAsync('UPDATE plots SET farmerId = ? WHERE farmerId = ?;', [nextId, previousId]);
    await db.runAsync('UPDATE audit_log SET userId = ? WHERE userId = ?;', [nextId, previousId]);
    await db.runAsync('UPDATE local_delivery_receipts SET farmerId = ? WHERE farmerId = ?;', [
      nextId,
      previousId,
    ]);
    await repairPendingSyncPayloadFarmerIds(nextId, previousId);

    // Update farmer id in place so producer attestations and profile fields survive rekey.
    // The old delete+insert path could pick a stale row and wipe saved declarations.
    if (previousRow) {
      await db.runAsync('UPDATE farmer SET id = ? WHERE id = ?;', [nextId, previousId]);
      return;
    }
    if (nextRow) {
      return;
    }
  });
}

/** Rewrite stale farmerId fields inside queued sync payloads after sign-in / scope repair. */
export async function repairPendingSyncPayloadFarmerIds(
  targetFarmerId: string,
  previousFarmerId?: string,
): Promise<number> {
  const scopedId = targetFarmerId.trim();
  if (!scopedId) return 0;
  const db = await getDb();
  const rows = await db.getAllAsync<{ id: number; payloadJson: string }>(
    'SELECT id, payloadJson FROM pending_sync ORDER BY createdAt ASC;',
  );
  let updated = 0;
  for (const row of rows ?? []) {
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(row.payloadJson) as Record<string, unknown>;
    } catch {
      continue;
    }
    const payloadFarmerId =
      typeof payload.farmerId === 'string' ? payload.farmerId.trim() : '';
    if (!payloadFarmerId || payloadFarmerId === scopedId) continue;
    if (previousFarmerId && payloadFarmerId !== previousFarmerId) continue;
    payload.farmerId = scopedId;
    await db.runAsync('UPDATE pending_sync SET payloadJson = ? WHERE id = ?;', [
      JSON.stringify(payload),
      row.id,
    ]);
    updated += 1;
  }
  return updated;
}

/**
 * After sign-in, attach plots/deliveries that still use a pre-auth local farmer id
 * to the active farmer profile (single-producer field app).
 */
export async function adoptOnDeviceFarmerScope(targetFarmerId: string): Promise<boolean> {
  const scopedId = targetFarmerId.trim();
  if (!scopedId || !isUuid(scopedId)) return false;

  const db = await getDb();
  const plotIds = await db.getAllAsync<{ farmerId: string }>(
    'SELECT DISTINCT farmerId FROM plots WHERE farmerId IS NOT NULL AND farmerId != ?;',
    [scopedId],
  );
  const receiptIds = await db.getAllAsync<{ farmerId: string }>(
    'SELECT DISTINCT farmerId FROM local_delivery_receipts WHERE farmerId IS NOT NULL AND farmerId != ?;',
    [scopedId],
  );

  const orphanIds = new Set<string>();
  for (const row of plotIds ?? []) {
    if (row.farmerId?.trim()) orphanIds.add(row.farmerId.trim());
  }
  for (const row of receiptIds ?? []) {
    if (row.farmerId?.trim()) orphanIds.add(row.farmerId.trim());
  }

  if (orphanIds.size === 0) return false;

  for (const orphanId of orphanIds) {
    await rekeyFarmerIdInDatabase(orphanId, scopedId);
  }
  return true;
}

/** Collect on-device media URIs referenced by Tracebud SQLite tables (for storage footprint). */
export async function collectTracebudMediaFileUris(): Promise<string[]> {
  const db = await getDb();
  const uris = new Set<string>();
  const addUri = (value: unknown) => {
    if (typeof value === 'string' && value.trim().length > 0) {
      uris.add(value.trim());
    }
  };

  const photoRows = await db.getAllAsync<{ uri: string }>('SELECT uri FROM plot_photos;');
  for (const row of photoRows ?? []) addUri(row.uri);

  const titleRows = await db.getAllAsync<{ uri: string }>('SELECT uri FROM plot_title_photos;');
  for (const row of titleRows ?? []) addUri(row.uri);

  const evidenceRows = await db.getAllAsync<{ uri: string }>('SELECT uri FROM plot_evidence;');
  for (const row of evidenceRows ?? []) addUri(row.uri);

  const profileUri = await getSetting('farmerProfilePhotoUri');
  addUri(profileUri);

  return [...uris];
}

