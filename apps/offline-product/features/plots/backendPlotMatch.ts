/**
 * Resolve a backend plot row for a local plot.
 * Prefer stable client id (`client_plot_id`, or legacy server `name`), then display name.
 */

export type LocalPlotForBackendMatch = {
  id: string;
  name?: string;
  areaHectares: number;
  kind: 'point' | 'polygon';
};

export type BackendPlotRow = {
  id?: unknown;
  name?: string;
  client_plot_id?: string | null;
  /** Some API layers camelCase the column — treat the same as client_plot_id. */
  clientPlotId?: string | null;
  area_ha?: unknown;
  kind?: unknown;
  created_at?: unknown;
};

/** Stable offline id stored on the server row (snake or camel column). */
export function readBackendClientPlotId(row: BackendPlotRow): string {
  const fromSnake = String(row.client_plot_id ?? '').trim();
  if (fromSnake) return fromSnake;
  return String(row.clientPlotId ?? '').trim();
}

/** CRM-seeded plots that must never absorb a device upload link. */
export const CRM_DEMO_PLOT_IDS = new Set([
  '39d548f9-1ef4-449b-9ebd-fd244ae5d69e',
]);

/** Read the stable offline client id from a server plot row. */
export function backendRowClientPlotId(row: BackendPlotRow): string {
  const fromColumn = readBackendClientPlotId(row);
  if (fromColumn) return fromColumn;
  return String(row.name ?? '').trim();
}

export function backendRowMatchesLocalClientId(
  row: BackendPlotRow,
  localPlotId: string,
): boolean {
  const localId = String(localPlotId);
  const clientId = readBackendClientPlotId(row);
  if (clientId && clientId === localId) return true;
  if (clientId && plotClientIdsShareCreationSuffix(clientId, localId)) return true;
  if (!clientId && String(row.name ?? '').trim() === localId) return true;
  return false;
}

/** Same offline plot after farmer-id rekey: `{farmerUuid}-{createdAtMs}`. */
export function plotClientIdsShareCreationSuffix(a: string, b: string): boolean {
  const ta = String(a).trim().match(/-(\d{10,})$/);
  const tb = String(b).trim().match(/-(\d{10,})$/);
  return ta != null && tb != null && ta[1] === tb[1];
}

/** Server rows created in CRM/demo — never treat as a device upload target. */
export function isServerOnlyDemoPlot(row: BackendPlotRow): boolean {
  if (readBackendClientPlotId(row)) return false;
  const id = String(row.id ?? '').trim();
  return CRM_DEMO_PLOT_IDS.has(id);
}

function parseCreatedAtMs(row: BackendPlotRow): number {
  const raw = row.created_at;
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw === 'string' && raw.trim()) {
    const ms = Date.parse(raw);
    return Number.isFinite(ms) ? ms : 0;
  }
  return 0;
}

/**
 * Server row uploaded without a persisted client_plot_id (legacy API bug).
 * Used to reconcile instead of POSTing another duplicate.
 */
export function findOrphanServerPlotForLocalUpload(
  localPlot: LocalPlotForBackendMatch,
  backendRows: unknown[],
): BackendPlotRow | null {
  const displayName = String(localPlot.name ?? '').trim();
  if (!displayName) return null;

  const candidates = (backendRows as BackendPlotRow[]).filter((row) => {
    if (isServerOnlyDemoPlot(row)) return false;
    if (readBackendClientPlotId(row)) return false;
    if (backendRowMatchesLocalClientId(row, localPlot.id)) return true;
    return (
      String(row.name ?? '').trim() === displayName &&
      String(row.kind ?? '').trim() === localPlot.kind
    );
  });

  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];

  const targetArea = Number(localPlot.areaHectares);
  return [...candidates].sort((a, b) => {
    const areaA = Number(a.area_ha ?? NaN);
    const areaB = Number(b.area_ha ?? NaN);
    const areaDiffA = Number.isFinite(areaA) ? Math.abs(areaA - targetArea) : Number.POSITIVE_INFINITY;
    const areaDiffB = Number.isFinite(areaB) ? Math.abs(areaB - targetArea) : Number.POSITIVE_INFINITY;
    if (areaDiffA !== areaDiffB) return areaDiffA - areaDiffB;
    return parseCreatedAtMs(b) - parseCreatedAtMs(a);
  })[0];
}

export function canTrustPersistedPlotServerLink(
  row: BackendPlotRow,
  localPlotId: string,
  serverPlotId: string,
  localPlotIds?: ReadonlySet<string>,
): boolean {
  if (isServerOnlyDemoPlot(row)) return false;
  if (String(row.id ?? '') !== String(serverPlotId)) return false;
  if (backendRowMatchesLocalClientId(row, localPlotId)) return true;

  const clientId = readBackendClientPlotId(row);
  if (clientId && clientId !== localPlotId) {
    // Server client id belongs to another on-device plot — do not reuse its row.
    if (localPlotIds?.has(clientId)) return false;
    // Stale server client id after farmer rekey / orphan reconcile — keep device link.
    return true;
  }

  // Device saved this link after upload — trust while the row still exists.
  return true;
}

/**
 * Confirm a local plot already exists on the server for sync pending counts.
 * Handles client id, farmer rekey suffix, orphan rows, and stale server client ids.
 */
export function findServerPlotForSyncConfirmation(
  localPlot: LocalPlotForBackendMatch,
  backendRows: unknown[],
  localPlotIds: ReadonlySet<string>,
): BackendPlotRow | null {
  if (!Array.isArray(backendRows)) return null;
  const rows = backendRows as BackendPlotRow[];

  const byClientId = rows.find((row) => backendRowMatchesLocalClientId(row, localPlot.id));
  if (byClientId) return byClientId;

  const orphan = findOrphanServerPlotForLocalUpload(localPlot, rows);
  if (orphan) return orphan;

  const displayName = String(localPlot.name ?? '').trim();
  if (!displayName) return null;

  const staleCandidates = rows.filter((row) => {
    if (isServerOnlyDemoPlot(row)) return false;
    const clientId = readBackendClientPlotId(row);
    if (!clientId || localPlotIds.has(clientId)) return false;
    if (clientId === localPlot.id) return false;
    return (
      String(row.name ?? '').trim() === displayName &&
      String(row.kind ?? '').trim() === localPlot.kind
    );
  });

  if (staleCandidates.length === 0) return null;
  if (staleCandidates.length === 1) return staleCandidates[0];

  const targetArea = Number(localPlot.areaHectares);
  return [...staleCandidates].sort((a, b) => {
    const areaA = Number(a.area_ha ?? NaN);
    const areaB = Number(b.area_ha ?? NaN);
    const areaDiffA = Number.isFinite(areaA) ? Math.abs(areaA - targetArea) : Number.POSITIVE_INFINITY;
    const areaDiffB = Number.isFinite(areaB) ? Math.abs(areaB - targetArea) : Number.POSITIVE_INFINITY;
    if (areaDiffA !== areaDiffB) return areaDiffA - areaDiffB;
    return parseCreatedAtMs(b) - parseCreatedAtMs(a);
  })[0];
}

export function findBackendPlotForLocal(
  localPlot: LocalPlotForBackendMatch,
  backendRows: unknown[],
): unknown | null {
  if (!Array.isArray(backendRows)) return null;
  const rows = backendRows as BackendPlotRow[];

  const byClientId = rows.find((p) => backendRowMatchesLocalClientId(p, localPlot.id));
  if (byClientId) return byClientId;

  const displayName = String(localPlot.name ?? '');
  if (displayName) {
    const byName = rows.find((p) => String(p?.name ?? '') === displayName);
    if (byName) return byName;
  }

  const targetArea = Number(localPlot.areaHectares);
  const byAreaKind = rows
    .map((p) => ({
      p,
      area: Number(p?.area_ha ?? NaN),
      kind: String(p?.kind ?? ''),
    }))
    .filter((x) => Number.isFinite(x.area) && x.kind === localPlot.kind)
    .sort((a, b) => Math.abs(a.area - targetArea) - Math.abs(b.area - targetArea))[0]?.p;

  return byAreaKind ?? null;
}
