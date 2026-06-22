import { isValidWgs84LatLng, normalizeWgs84Point } from '@/features/geo/coordinates';
import type { Plot, PlotPoint } from '@/features/state/AppStateContext';
import {
  backendRowClientPlotId,
  type BackendPlotRow,
} from '@/features/plots/backendPlotMatch';
import type { GeoJSONPoint, GeoJSONPolygon } from '@/features/api/postPlot';

export type ServerPlotRowForRestore = BackendPlotRow & {
  farmer_id?: string | null;
  geometry?: GeoJSONPoint | GeoJSONPolygon | null;
  declared_area_ha?: unknown;
  precision_m_at_capture?: unknown;
  created_at?: unknown;
};

function parseCreatedAtMs(raw: unknown): number {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw === 'string' && raw.trim()) {
    const ms = Date.parse(raw);
    return Number.isFinite(ms) ? ms : 0;
  }
  return 0;
}

function optionalNumber(raw: unknown): number | null {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw === 'string' && raw.trim()) {
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/** Inverse of {@link buildGeometryFromLocalPlot} for cloud → device restore. */
export function parsePlotPointsFromGeoJson(
  geometry: unknown,
  kind: 'point' | 'polygon',
): PlotPoint[] | null {
  if (!geometry || typeof geometry !== 'object') return null;
  const geo = geometry as { type?: string; coordinates?: unknown };

  if (geo.type === 'Point' && Array.isArray(geo.coordinates) && geo.coordinates.length >= 2) {
    const lon = Number(geo.coordinates[0]);
    const lat = Number(geo.coordinates[1]);
    if (!isValidWgs84LatLng(lat, lon)) return null;
    return [normalizeWgs84Point({ latitude: lat, longitude: lon })];
  }

  if (geo.type === 'Polygon' && Array.isArray(geo.coordinates) && geo.coordinates.length > 0) {
    const ring = geo.coordinates[0];
    if (!Array.isArray(ring) || ring.length < 3) return null;
    const points: PlotPoint[] = [];
    for (const coord of ring) {
      if (!Array.isArray(coord) || coord.length < 2) continue;
      const lon = Number(coord[0]);
      const lat = Number(coord[1]);
      if (!isValidWgs84LatLng(lat, lon)) continue;
      points.push(normalizeWgs84Point({ latitude: lat, longitude: lon }));
    }
    if (points.length >= 2) {
      const first = points[0];
      const last = points[points.length - 1];
      if (first.latitude === last.latitude && first.longitude === last.longitude) {
        points.pop();
      }
    }
    const minPoints = kind === 'polygon' ? 3 : 1;
    return points.length >= minPoints ? points : null;
  }

  return null;
}

export function resolveServerPlotDisplayName(row: ServerPlotRowForRestore): string {
  const clientId = backendRowClientPlotId(row);
  const name = String(row.name ?? '').trim();
  if (name && (!clientId || name !== clientId)) return name;
  const idHint = clientId || String(row.id ?? '').trim();
  return idHint ? `Plot ${idHint.slice(0, 8)}` : 'Plot';
}

export function resolveLocalPlotIdFromServerRow(row: ServerPlotRowForRestore): string {
  const clientId = backendRowClientPlotId(row);
  if (clientId) return clientId;
  return String(row.id ?? '').trim();
}

export function mapServerPlotRowToLocalPlot(
  row: ServerPlotRowForRestore,
  farmerId: string,
): Plot | null {
  const localId = resolveLocalPlotIdFromServerRow(row);
  const serverId = String(row.id ?? '').trim();
  if (!localId || !serverId) return null;

  const kindRaw = String(row.kind ?? '').trim();
  const kind: Plot['kind'] = kindRaw === 'point' ? 'point' : 'polygon';
  const points = parsePlotPointsFromGeoJson(row.geometry, kind);
  if (!points?.length) return null;

  const declaredAreaHa = optionalNumber(row.declared_area_ha);
  const areaHa =
    optionalNumber(row.area_ha) ??
    declaredAreaHa ??
    0;
  const areaSquareMeters = Math.max(0, areaHa * 10_000);
  const createdAt = parseCreatedAtMs(row.created_at) || Date.now();
  const precisionMetersAtSave = optionalNumber(row.precision_m_at_capture);

  return {
    id: localId,
    farmerId,
    name: resolveServerPlotDisplayName(row),
    createdAt,
    areaSquareMeters,
    areaHectares: areaHa,
    kind,
    points,
    declaredAreaHectares: declaredAreaHa ?? undefined,
    precisionMetersAtSave,
  };
}
