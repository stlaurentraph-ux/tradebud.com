import * as SQLite from 'expo-sqlite';
import Constants from 'expo-constants';

import type { FarmerProfile, Plot } from './AppStateContext';

export type { PlotPhoto, PlotTitlePhoto } from './persistence.types';
import type { PlotPhoto, PlotTitlePhoto } from './persistence.types';

const DB_NAME = 'tracebud_offline.db';

function getDb() {
  return SQLite.openDatabase(DB_NAME);
}

export function initDatabase() {
  const db = getDb();
  db.transaction((tx) => {
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS farmer (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT,
        role TEXT NOT NULL,
        selfDeclared INTEGER NOT NULL,
        selfDeclaredAt INTEGER,
        fpicConsent INTEGER,
        laborNoChildLabor INTEGER,
        laborNoForcedLabor INTEGER
      );`,
    );

    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS plots (
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
      );`,
    );

    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS audit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp INTEGER NOT NULL,
        userId TEXT,
        deviceId TEXT,
        eventType TEXT NOT NULL,
        payloadJson TEXT NOT NULL
      );`,
    );

    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS plot_photos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plotId TEXT NOT NULL,
        uri TEXT NOT NULL,
        takenAt INTEGER NOT NULL,
        latitude REAL,
        longitude REAL
      );`,
    );

    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS plot_legal (
        plotId TEXT PRIMARY KEY NOT NULL,
        cadastralKey TEXT
      );`,
    );

    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS plot_title_photos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plotId TEXT NOT NULL,
        uri TEXT NOT NULL,
        takenAt INTEGER NOT NULL
      );`,
    );

    tx.executeSql(
      'ALTER TABLE farmer ADD COLUMN fpicConsent INTEGER;',
      [],
      () => {},
      () => false,
    );
    tx.executeSql(
      'ALTER TABLE farmer ADD COLUMN laborNoChildLabor INTEGER;',
      [],
      () => {},
      () => false,
    );
    tx.executeSql(
      'ALTER TABLE farmer ADD COLUMN laborNoForcedLabor INTEGER;',
      [],
      () => {},
      () => false,
    );
  });
}

export function loadAppState(): Promise<{
  farmer?: FarmerProfile;
  plots: Plot[];
}> {
  const db = getDb();

  return new Promise((resolve) => {
    let loadedFarmer: FarmerProfile | undefined;
    const loadedPlots: Plot[] = [];

    db.readTransaction((tx) => {
      tx.executeSql(
        'SELECT * FROM farmer LIMIT 1;',
        [],
        (_tx, result) => {
          if (result.rows.length > 0) {
            const row = result.rows.item(0) as any;
            loadedFarmer = {
              id: row.id,
              name: row.name ?? undefined,
              role: row.role,
              selfDeclared: row.selfDeclared === 1,
              selfDeclaredAt: row.selfDeclaredAt ?? undefined,
              fpicConsent: row.fpicConsent === 1,
              laborNoChildLabor: row.laborNoChildLabor === 1,
              laborNoForcedLabor: row.laborNoForcedLabor === 1,
            };
          }
        },
        () => false,
      );

      tx.executeSql(
        'SELECT * FROM plots ORDER BY createdAt DESC;',
        [],
        (_tx, result) => {
          for (let i = 0; i < result.rows.length; i++) {
            const row = result.rows.item(i) as any;
            let points;
            try {
              points = JSON.parse(row.pointsJson);
            } catch {
              points = [];
            }

            loadedPlots.push({
              id: row.id,
              farmerId: row.farmerId,
              name: row.name,
              createdAt: row.createdAt,
              areaSquareMeters: row.areaSquareMeters,
              areaHectares: row.areaHectares,
              kind: row.kind,
              points,
              declaredAreaHectares: row.declaredAreaHectares ?? undefined,
              discrepancyPercent: row.discrepancyPercent ?? undefined,
              precisionMetersAtSave: row.precisionMetersAtSave ?? null,
            });
          }
        },
        () => false,
      );
    },
    () => {
      resolve({ farmer: loadedFarmer, plots: loadedPlots });
    },
    () => {
      resolve({ farmer: loadedFarmer, plots: loadedPlots });
    });
  });
}

export function persistFarmer(farmer?: FarmerProfile) {
  const db = getDb();
  db.transaction((tx) => {
    tx.executeSql('DELETE FROM farmer;');

    if (!farmer) {
      return;
    }

    tx.executeSql(
      'INSERT INTO farmer (id, name, role, selfDeclared, selfDeclaredAt, fpicConsent, laborNoChildLabor, laborNoForcedLabor) VALUES (?, ?, ?, ?, ?, ?, ?, ?);',
      [
        farmer.id,
        farmer.name ?? null,
        farmer.role,
        farmer.selfDeclared ? 1 : 0,
        farmer.selfDeclaredAt ?? null,
        farmer.fpicConsent ? 1 : 0,
        farmer.laborNoChildLabor ? 1 : 0,
        farmer.laborNoForcedLabor ? 1 : 0,
      ],
    );
  });
}

export function persistPlots(plots: Plot[]) {
  const db = getDb();
  db.transaction((tx) => {
    tx.executeSql('DELETE FROM plots;');

    for (const plot of plots) {
      tx.executeSql(
        `INSERT INTO plots (
          id,
          farmerId,
          name,
          createdAt,
          areaSquareMeters,
          areaHectares,
          kind,
          pointsJson,
          declaredAreaHectares,
          discrepancyPercent,
          precisionMetersAtSave
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
  });
}

export function logAuditEvent(params: {
  userId?: string;
  eventType: string;
  payload: Record<string, unknown>;
}) {
  const db = getDb();
  const deviceId =
    (Constants as any)?.deviceName ??
    (Constants as any)?.deviceId ??
    'unknown-device';
  const timestamp = Date.now();

  db.transaction((tx) => {
    tx.executeSql(
      'INSERT INTO audit_log (timestamp, userId, deviceId, eventType, payloadJson) VALUES (?, ?, ?, ?, ?);',
      [timestamp, params.userId ?? null, deviceId, params.eventType, JSON.stringify(params.payload)],
    );
  });
}

export function persistPlotPhoto(photo: Omit<PlotPhoto, 'id'>) {
  const db = getDb();
  db.transaction((tx) => {
    tx.executeSql(
      `INSERT INTO plot_photos (plotId, uri, takenAt, latitude, longitude)
       VALUES (?, ?, ?, ?, ?);`,
      [
        photo.plotId,
        photo.uri,
        photo.takenAt,
        photo.latitude ?? null,
        photo.longitude ?? null,
      ],
    );
  });
}

export function loadPhotosForPlot(plotId: string): Promise<PlotPhoto[]> {
  const db = getDb();
  return new Promise((resolve) => {
    const photos: PlotPhoto[] = [];
    db.readTransaction((tx) => {
      tx.executeSql(
        'SELECT * FROM plot_photos WHERE plotId = ? ORDER BY takenAt DESC;',
        [plotId],
        (_tx, result) => {
          for (let i = 0; i < result.rows.length; i++) {
            const row = result.rows.item(i) as any;
            photos.push({
              id: row.id,
              plotId: row.plotId,
              uri: row.uri,
              takenAt: row.takenAt,
              latitude: row.latitude ?? null,
              longitude: row.longitude ?? null,
            });
          }
        },
      );
    },
    () => resolve(photos),
    () => resolve(photos));
  });
}

export function savePlotCadastralKey(plotId: string, cadastralKey: string | null) {
  const db = getDb();
  db.transaction((tx) => {
    if (!cadastralKey) {
      tx.executeSql('DELETE FROM plot_legal WHERE plotId = ?;', [plotId]);
      return;
    }
    tx.executeSql(
      `INSERT INTO plot_legal (plotId, cadastralKey)
       VALUES (?, ?)
       ON CONFLICT(plotId) DO UPDATE SET cadastralKey = excluded.cadastralKey;`,
      [plotId, cadastralKey],
    );
  });
}

export function loadPlotCadastralKey(plotId: string): Promise<string | null> {
  const db = getDb();
  return new Promise((resolve) => {
    db.readTransaction((tx) => {
      tx.executeSql(
        'SELECT cadastralKey FROM plot_legal WHERE plotId = ? LIMIT 1;',
        [plotId],
        (_tx, result) => {
          if (result.rows.length > 0) {
            const row = result.rows.item(0) as any;
            resolve(row.cadastralKey ?? null);
          } else {
            resolve(null);
          }
        },
      );
    });
  });
}

export function persistPlotTitlePhoto(photo: Omit<PlotTitlePhoto, 'id'>) {
  const db = getDb();
  db.transaction((tx) => {
    tx.executeSql(
      `INSERT INTO plot_title_photos (plotId, uri, takenAt)
       VALUES (?, ?, ?);`,
      [photo.plotId, photo.uri, photo.takenAt],
    );
  });
}

export function loadTitlePhotosForPlot(plotId: string): Promise<PlotTitlePhoto[]> {
  const db = getDb();
  return new Promise((resolve) => {
    const photos: PlotTitlePhoto[] = [];
    db.readTransaction((tx) => {
      tx.executeSql(
        'SELECT * FROM plot_title_photos WHERE plotId = ? ORDER BY takenAt DESC;',
        [plotId],
        (_tx, result) => {
          for (let i = 0; i < result.rows.length; i++) {
            const row = result.rows.item(i) as any;
            photos.push({
              id: row.id,
              plotId: row.plotId,
              uri: row.uri,
              takenAt: row.takenAt,
            });
          }
        },
      );
    },
    () => resolve(photos),
    () => resolve(photos));
  });
}
