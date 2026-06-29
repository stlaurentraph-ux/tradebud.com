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
