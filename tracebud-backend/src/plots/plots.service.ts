import { Injectable, BadRequestException, ForbiddenException, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { resolveFarmerIdsForTenant } from '../common/tenant-farmer-scope';
import { PG_POOL } from '../db/db.module';
import { plotKindEnum } from '../db/schema';
import { CreatePlotDto } from './dto/create-plot.dto';
import { SyncPlotLegalDto } from './dto/sync-plot-legal.dto';
import { SyncPlotEvidenceDto } from './dto/sync-plot-evidence.dto';
import { SyncPlotPhotosDto } from './dto/sync-plot-photos.dto';
import { UpdatePlotDto } from './dto/update-plot.dto';
import { UpdatePlotGeometryDto } from './dto/update-plot-geometry.dto';
import { PlotGeometryHistoryEventDto } from './dto/plot-geometry-history-response.dto';
import { GfwService } from '../compliance/gfw.service';
import {
  buildGroundTruthPhotoVerification,
  type GroundTruthPhotoVerification,
} from '../compliance/ground-truth-photo-verification';
import { TenureParseService } from './tenure-parse.service';
import {
  applyReviewClearanceGate,
  EUDR_DEFORESTATION_CUTOFF,
  gfwSummaryToPlotStatus,
  gfwSummaryToSignalTier,
  mergePlotComplianceStatus,
  overlapToPlotStatus,
  type DeforestationScreeningSnapshot,
  type GfwAlertSummary,
  type PlotComplianceStatus,
  verdictToPlotStatus,
} from '../compliance/plot-compliance-status';

export interface PlotGeometryHistoryPage {
  items: PlotGeometryHistoryEventDto[];
  anomalies: Array<{
    eventId: string;
    type: 'large_revision_jump' | 'frequent_supersession';
    severity: 'medium' | 'high';
    message: string;
  }>;
  total: number;
  limit: number;
  offset: number;
  sort: 'desc' | 'asc';
  anomalyProfile: 'strict' | 'balanced' | 'lenient';
  signalsOnly: boolean;
  anomalySummary: {
    total: number;
    highSeverity: number;
    mediumSeverity: number;
    byType: {
      largeRevisionJump: number;
      frequentSupersession: number;
    };
  };
  anomalySummaryScope: 'current_page' | 'full_filtered_set';
}

export interface PlotAssignmentRow {
  assignmentId: string;
  plotId: string;
  agentUserId: string;
  status: 'active' | 'completed' | 'cancelled';
  assignedAt: string;
  endedAt: string | null;
  agentName?: string | null;
  agentEmail?: string | null;
}

export interface PlotAssignmentListItem extends PlotAssignmentRow {}

export interface PlotAssignmentListPage {
  items: PlotAssignmentListItem[];
  total: number;
  limit: number;
  offset: number;
  status: 'all' | 'active' | 'completed' | 'cancelled';
  fromDays: number;
  agentUserId: string | null;
}

export interface PlotAssignmentExportAuditEvent {
  phase: 'requested' | 'succeeded' | 'failed';
  plotId: string;
  userId?: string | null;
  tenantId?: string | null;
  exportedBy?: string | null;
  rowCount?: number | null;
  filters: {
    status: 'all' | 'active' | 'completed' | 'cancelled';
    fromDays: number;
    agentUserId: string | null;
  };
  error?: string | null;
}

@Injectable()
export class PlotsService {
  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly gfw: GfwService,
    private readonly tenureParse: TenureParseService,
  ) {}

  private static parseNumeric(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim().length > 0) {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  }

  private static computeGeometryHistoryAnomalies(
    events: PlotGeometryHistoryEventDto[],
    profile: 'strict' | 'balanced' | 'lenient',
  ): PlotGeometryHistoryPage['anomalies'] {
    const thresholds = {
      strict: {
        largeJumpMinPct: 2,
        highLargeJumpMinPct: 3,
        supersessionWindowMin: 240,
        highSupersessionWindowMin: 60,
      },
      balanced: {
        largeJumpMinPct: 3,
        highLargeJumpMinPct: 4,
        supersessionWindowMin: 120,
        highSupersessionWindowMin: 30,
      },
      lenient: {
        largeJumpMinPct: 4,
        highLargeJumpMinPct: 5,
        supersessionWindowMin: 60,
        highSupersessionWindowMin: 15,
      },
    }[profile];

    const anomalies: PlotGeometryHistoryPage['anomalies'] = [];
    const superseded = events.filter((event) => event.eventType === 'plot_geometry_superseded');

    for (const event of superseded) {
      const details = event.payload?.details ?? {};
      const geometryNormalization =
        details &&
        typeof details === 'object' &&
        'geometryNormalization' in details &&
        typeof (details as Record<string, unknown>).geometryNormalization === 'object'
          ? ((details as Record<string, unknown>).geometryNormalization as Record<string, unknown>)
          : null;

      const correctionVariancePct = PlotsService.parseNumeric(geometryNormalization?.correctionVariancePct);
      if (correctionVariancePct != null && correctionVariancePct >= thresholds.largeJumpMinPct) {
        anomalies.push({
          eventId: event.id,
          type: 'large_revision_jump',
          severity: correctionVariancePct >= thresholds.highLargeJumpMinPct ? 'high' : 'medium',
          message: `Large revision jump: ${correctionVariancePct.toFixed(2)}% area correction variance.`,
        });
      }
    }

    for (let index = 1; index < superseded.length; index += 1) {
      const current = superseded[index];
      const previous = superseded[index - 1];
      const currentTime = Date.parse(current.timestamp);
      const previousTime = Date.parse(previous.timestamp);
      if (Number.isNaN(currentTime) || Number.isNaN(previousTime)) continue;
      const diffMinutes = Math.abs(previousTime - currentTime) / (1000 * 60);
      if (diffMinutes <= thresholds.supersessionWindowMin) {
        anomalies.push({
          eventId: current.id,
          type: 'frequent_supersession',
          severity: diffMinutes <= thresholds.highSupersessionWindowMin ? 'high' : 'medium',
          message: `Frequent supersession: another geometry change within ${Math.round(diffMinutes)} minutes.`,
        });
      }
    }

    return anomalies;
  }

  private static summarizeGeometryHistoryAnomalies(
    anomalies: PlotGeometryHistoryPage['anomalies'],
  ): PlotGeometryHistoryPage['anomalySummary'] {
    let highSeverity = 0;
    let mediumSeverity = 0;
    let largeRevisionJump = 0;
    let frequentSupersession = 0;
    for (const anomaly of anomalies) {
      if (anomaly.severity === 'high') highSeverity += 1;
      else mediumSeverity += 1;
      if (anomaly.type === 'large_revision_jump') largeRevisionJump += 1;
      else frequentSupersession += 1;
    }
    return {
      total: anomalies.length,
      highSeverity,
      mediumSeverity,
      byType: {
        largeRevisionJump,
        frequentSupersession,
      },
    };
  }

  /**
   * The offline app generates a local farmer UUID. Plot rows reference farmer_profile.id;
   * ensure a row exists and is owned by the authenticated Supabase user (fixes FK plot_farmer_id_fkey).
   */
  private async ensureFarmerProfileForPlot(farmerId: string, authUserId: string | undefined): Promise<void> {
    if (!authUserId) {
      throw new BadRequestException('Missing authenticated user for plot creation');
    }

    const existing = await this.pool.query(`SELECT user_id FROM farmer_profile WHERE id = $1::uuid`, [
      farmerId,
    ]);
    if (existing.rows.length > 0) {
      const owner = String(existing.rows[0].user_id);
      if (owner !== authUserId) {
        throw new ForbiddenException(
          'This farmer ID is already linked to another account. Use the profile from your device.',
        );
      }
      return;
    }

    await this.pool.query(
      `
      INSERT INTO user_account (id, role, name)
      VALUES ($1::uuid, 'farmer', NULL)
      ON CONFLICT (id) DO NOTHING
    `,
      [authUserId],
    );

    await this.pool.query(
      `
      INSERT INTO farmer_profile (id, user_id, country_code, self_declared, status)
      VALUES ($1::uuid, $2::uuid, 'HN', true, 'active')
    `,
      [farmerId, authUserId],
    );
  }

  async create(createDto: CreatePlotDto, userId: string | undefined) {
    const {
      geometry,
      declaredAreaHa,
      precisionMeters,
      hdop,
      farmerId,
      clientPlotId,
      cadastralKey,
      landTitlePhotos,
      productionSystem,
    } = createDto;

    await this.ensureFarmerProfileForPlot(farmerId, userId);

    // Simple validation: ensure 6 decimal places for coords
    const ensureSixDecimals = (value: number) => Number(value.toFixed(6));

    let geometrySql: string;
    let kind: (typeof plotKindEnum.enumValues)[number];
    let polygonWkt: string | null = null;

    if (geometry.type === 'Point') {
      const [lon, lat] = geometry.coordinates.map(ensureSixDecimals) as [number, number];
      geometrySql = `ST_SetSRID(ST_Point(${lon}, ${lat}), 4326)`;
      kind = 'point';
    } else if (geometry.type === 'Polygon') {
      const rings = geometry.coordinates;
      if (!Array.isArray(rings) || rings.length === 0) {
        throw new BadRequestException('Polygon must have at least one ring');
      }
      const firstRing = rings[0];
      if (firstRing.length < 4) {
        throw new BadRequestException('Polygon ring must have at least 4 vertices');
      }
      const closedRing =
        firstRing[0][0] === firstRing[firstRing.length - 1][0] &&
        firstRing[0][1] === firstRing[firstRing.length - 1][1]
          ? firstRing
          : [...firstRing, firstRing[0]];

      const coordText = closedRing
        .map(([lon, lat]: [number, number]) => `${ensureSixDecimals(lon)} ${ensureSixDecimals(lat)}`)
        .join(', ');
      polygonWkt = `POLYGON((${coordText}))`;
      geometrySql = `ST_SetSRID(ST_GeomFromText('${polygonWkt}'), 4326)`;
      kind = 'polygon';
    } else {
      throw new BadRequestException('Unsupported geometry type');
    }

    // Insert using raw SQL to leverage PostGIS functions for area and centroid.
    // For polygons, auto-correct invalid geometry via ST_MakeValid and reject if
    // correction changes area by more than 5%.
    const text = `
      WITH input_geom AS (
        SELECT ST_SnapToGrid(${geometrySql}, 1e-6) AS geom
      ),
      normalized AS (
        SELECT
          CASE
            WHEN $7::text = 'polygon' THEN ST_CollectionExtract(ST_MakeValid(geom), 3)
            ELSE geom
          END AS geom,
          CASE
            WHEN $7::text = 'polygon' THEN ST_Area(geom::geography) / 10000.0
            ELSE NULL
          END AS original_area_ha
        FROM input_geom
      ),
      validated AS (
        SELECT
          geom,
          original_area_ha,
          CASE
            WHEN $7::text = 'polygon' THEN ST_Area(geom::geography) / 10000.0
            ELSE NULL
          END AS normalized_area_ha,
          CASE
            WHEN $7::text = 'polygon' AND original_area_ha > 0
              THEN ABS((ST_Area(geom::geography) / 10000.0) - original_area_ha) / original_area_ha * 100.0
            ELSE NULL
          END AS correction_variance_pct
        FROM normalized
      ),
      ins AS (
        INSERT INTO plot (
          farmer_id,
          name,
          geometry,
          geography,
          centroid,
          kind,
          area_ha,
          declared_area_ha,
          precision_m_at_capture,
          hdop_at_capture,
          production_system
        )
        SELECT
          $1,
          $2,
          v.geom,
          v.geom::geography,
          ST_Centroid(v.geom),
          $3,
          ST_Area(v.geom::geography) / 10000.0,
          $4,
          $5,
          $6,
          $8
        FROM validated v
        WHERE (
          $7::text <> 'polygon'
          OR v.geom IS NOT NULL
        ) AND (
          $7::text <> 'polygon'
          OR v.correction_variance_pct IS NULL
          OR v.correction_variance_pct <= 5
        )
        RETURNING *
      )
      SELECT
        i.*,
        v.original_area_ha,
        v.normalized_area_ha,
        v.correction_variance_pct
      FROM ins i
      CROSS JOIN validated v;
    `;

    const result = await this.pool.query(text, [
      farmerId,
      clientPlotId,
      kind,
      declaredAreaHa ?? null,
      precisionMeters ?? null,
      hdop ?? null,
      kind,
      productionSystem ?? null,
    ]);

    if (result.rowCount === 0 && kind === 'polygon') {
      const varianceProbe = await this.pool.query(
        `
          WITH input_geom AS (
            SELECT ST_SnapToGrid(${geometrySql}, 1e-6) AS geom
          ),
          normalized AS (
            SELECT
              ST_CollectionExtract(ST_MakeValid(geom), 3) AS geom,
              ST_Area(geom::geography) / 10000.0 AS original_area_ha
            FROM input_geom
          )
          SELECT
            CASE
              WHEN geom IS NULL THEN NULL
              ELSE ABS((ST_Area(geom::geography) / 10000.0) - original_area_ha) / NULLIF(original_area_ha, 0) * 100.0
            END AS correction_variance_pct
          FROM normalized
        `,
      );
      const variance = Number(varianceProbe.rows?.[0]?.correction_variance_pct);
      if (Number.isFinite(variance) && variance > 5) {
        throw new BadRequestException(
          `GEO-102: Geometry correction variance ${variance.toFixed(2)}% exceeds 5% tolerance.`,
        );
      }
      throw new BadRequestException(
        'GEO-101: Invalid polygon geometry could not be normalized with ST_MakeValid.',
      );
    }

    const row = result.rows[0];

    // Enforce 5% area tolerance if declaredAreaHa was provided
    if (declaredAreaHa != null && row?.area_ha != null) {
      const areaHa = Number(row.area_ha);
      const diffPct = Math.abs(areaHa - declaredAreaHa) / declaredAreaHa * 100;
      if (diffPct > 5) {
        throw new BadRequestException(
          `Area discrepancy ${diffPct.toFixed(1)}% exceeds 5% tolerance.`,
        );
      }
    }

    // Audit: plot created
    await this.pool.query(
      `
        INSERT INTO audit_log (user_id, event_type, payload)
        VALUES ($1, $2, $3::jsonb)
      `,
      [
        userId ?? null,
        'plot_created',
        JSON.stringify({
          plotId: row.id,
          farmerId,
          clientPlotId,
          cadastralKey: cadastralKey ?? null,
          landTitlePhotos:
            Array.isArray(landTitlePhotos) && landTitlePhotos.length > 0
              ? landTitlePhotos
              : null,
          geometryNormalization:
            kind === 'polygon'
              ? {
                  originalAreaHa: row.original_area_ha ?? null,
                  normalizedAreaHa: row.normalized_area_ha ?? null,
                  correctionVariancePct: row.correction_variance_pct ?? null,
                }
              : null,
        }),
      ],
    );

    void this.scheduleDeforestationScreening(row.id, userId);

    return row;
  }

  private scheduleDeforestationScreening(plotId: string, userId: string | undefined): void {
    void this.runGfwCheck(plotId, userId).catch(() => {
      // Screening failures are audited inside runGfwCheck; plot creation must not fail.
    });
  }

  async syncPhotos(plotId: string, dto: SyncPlotPhotosDto, userId: string | undefined) {
    // Ensure plot exists (lightweight guard so we do not accept orphaned photos)
    const existing = await this.pool.query(
      `
        SELECT id
        FROM plot
        WHERE id = $1
      `,
      [plotId],
    );

    if (existing.rowCount === 0) {
      throw new BadRequestException('Plot not found');
    }

    const photosArray = Array.isArray(dto.photos) ? dto.photos : [];

    await this.pool.query(
      `
        INSERT INTO audit_log (user_id, event_type, payload)
        VALUES ($1, $2, $3::jsonb)
      `,
      [
        userId ?? null,
        'plot_photos_synced',
        JSON.stringify({
          plotId,
          kind: dto.kind,
          count: photosArray.length,
          photos: photosArray,
          note: dto.note ?? null,
          hlcTimestamp: dto.hlcTimestamp ?? null,
          clientEventId: dto.clientEventId ?? null,
        }),
      ],
    );

    if (dto.kind === 'ground_truth') {
      const plotRow = await this.getPlotStatusRow(plotId).catch(() => null);
      const verification = await this.verifyGroundTruthPhotosOnPlot(plotId, photosArray);
      if (plotRow?.status === 'under_review' && verification.clearanceEligible) {
        void this.runGfwCheck(plotId, userId).catch(() => {
          // Re-screen after geo-verified photo gate; failures are audited in runGfwCheck.
        });
      }
    }

    return { ok: true };
  }

  async syncLegal(plotId: string, dto: SyncPlotLegalDto, userId: string | undefined) {
    const existing = await this.pool.query(
      `
        SELECT id
        FROM plot
        WHERE id = $1
      `,
      [plotId],
    );

    if (existing.rowCount === 0) {
      throw new BadRequestException('Plot not found');
    }

    await this.pool.query(
      `
        INSERT INTO audit_log (user_id, device_id, event_type, payload)
        VALUES ($1, $2, $3, $4::jsonb)
      `,
      [
        userId ?? null,
        dto.deviceId ?? null,
        'plot_legal_synced',
        JSON.stringify({
          plotId,
          cadastralKey: dto.cadastralKey ?? null,
          informalTenure: dto.informalTenure ?? null,
          informalTenureNote: dto.informalTenureNote ?? null,
          reason: dto.reason,
          hlcTimestamp: dto.hlcTimestamp ?? null,
          clientEventId: dto.clientEventId ?? null,
        }),
      ],
    );

    return { ok: true };
  }

  async syncEvidence(
    plotId: string,
    dto: SyncPlotEvidenceDto,
    userId: string | undefined,
    tenantId?: string | null,
  ) {
    const existing = await this.pool.query(
      `
        SELECT id
        FROM plot
        WHERE id = $1
      `,
      [plotId],
    );

    if (existing.rowCount === 0) {
      throw new BadRequestException('Plot not found');
    }

    const itemsArray = Array.isArray(dto.items) ? dto.items : [];

    await this.pool.query(
      `
        INSERT INTO audit_log (user_id, event_type, payload)
        VALUES ($1, $2, $3::jsonb)
      `,
      [
        userId ?? null,
        'plot_evidence_synced',
        JSON.stringify({
          plotId,
          tenantId: tenantId ?? null,
          kind: dto.kind,
          reason: dto.reason,
          note: dto.note ?? null,
          count: itemsArray.length,
          items: itemsArray,
          hlcTimestamp: dto.hlcTimestamp ?? null,
          clientEventId: dto.clientEventId ?? null,
        }),
      ],
    );

    await this.tenureParse.enqueueFromEvidenceSync(plotId, dto.kind, itemsArray);

    return { ok: true };
  }

  async listTenureVerification(plotId: string) {
    return this.tenureParse.listForPlot(plotId);
  }

  private async getPlotGeometryForCompliance(plotId: string) {
    const geoRes = await this.pool.query(
      `
        SELECT
          id,
          kind,
          -- Buffer point plots into a small polygon for queries that require polygons.
          CASE
            WHEN kind = 'point' THEN ST_AsGeoJSON(ST_Buffer(geometry::geography, 200)::geometry)
            ELSE ST_AsGeoJSON(geometry)
          END AS geojson
        FROM plot
        WHERE id = $1
      `,
      [plotId],
    );

    if (geoRes.rowCount === 0) {
      throw new BadRequestException('Plot not found');
    }

    let geometry: any = null;
    try {
      geometry = JSON.parse(geoRes.rows[0].geojson);
    } catch {
      throw new BadRequestException('Could not parse plot geometry');
    }
    return geometry;
  }

  private normalizeGfwResult(result: any): GfwAlertSummary {
    // We expect SQL like: SELECT COUNT(*) AS count, SUM(area__ha) AS area_ha FROM data
    if (!result) return { alertCount: null, alertAreaHa: null };
    const r = result?.data ?? result;
    // Common shapes: { data: [{count: 0, area_ha: 0.1}] } OR just [{...}]
    const first = Array.isArray(r) ? r[0] : Array.isArray(r?.data) ? r.data[0] : r?.[0];
    const countVal = first?.count ?? first?.COUNT ?? first?.['count'] ?? null;
    const areaVal = first?.area_ha ?? first?.areaHa ?? first?.['area__ha'] ?? null;
    const alertCount =
      typeof countVal === 'number' ? countVal : typeof countVal === 'string' ? Number(countVal) : null;
    const alertAreaHa =
      typeof areaVal === 'number' ? areaVal : typeof areaVal === 'string' ? Number(areaVal) : null;
    return {
      alertCount: Number.isFinite(alertCount as any) ? (alertCount as number) : null,
      alertAreaHa: Number.isFinite(alertAreaHa as any) ? (alertAreaHa as number) : null,
    };
  }

  private async getPlotStatusRow(plotId: string): Promise<{
    status: PlotComplianceStatus;
    deforestation_screening: unknown;
  }> {
    const res = await this.pool.query(
      `
        SELECT status, deforestation_screening
        FROM plot
        WHERE id = $1
      `,
      [plotId],
    );
    if (res.rowCount === 0) {
      throw new BadRequestException('Plot not found');
    }
    return {
      status: (res.rows[0].status ?? 'pending_check') as PlotComplianceStatus,
      deforestation_screening: res.rows[0].deforestation_screening ?? null,
    };
  }

  private async getLatestGroundTruthPhotos(plotId: string): Promise<unknown[]> {
    const res = await this.pool.query(
      `
        SELECT payload
        FROM audit_log
        WHERE payload ->> 'plotId' = $1
          AND event_type = 'plot_photos_synced'
          AND payload ->> 'kind' = 'ground_truth'
        ORDER BY timestamp DESC
        LIMIT 1
      `,
      [plotId],
    );
    if (res.rowCount === 0) {
      return [];
    }
    const payload = res.rows[0].payload ?? {};
    const photos = payload.photos;
    return Array.isArray(photos) ? photos : [];
  }

  private async verifyGroundTruthPhotosOnPlot(
    plotId: string,
    photos: unknown[],
  ): Promise<GroundTruthPhotoVerification> {
    const totalCount = photos.length;
    if (totalCount === 0) {
      return buildGroundTruthPhotoVerification({
        totalCount: 0,
        geoTaggedCount: 0,
        geoVerifiedCount: 0,
        timestampVerifiedCount: 0,
        clearanceVerifiedCount: 0,
      });
    }

    const res = await this.pool.query(
      `
        WITH photos AS (
          SELECT elem AS photo
          FROM jsonb_array_elements($2::jsonb) AS elem
        ),
        parsed AS (
          SELECT
            photo,
            COALESCE(
              NULLIF(photo ->> 'latitude', '')::double precision,
              NULLIF(photo ->> 'lat', '')::double precision
            ) AS lat,
            COALESCE(
              NULLIF(photo ->> 'longitude', '')::double precision,
              NULLIF(photo ->> 'lng', '')::double precision,
              NULLIF(photo ->> 'lon', '')::double precision
            ) AS lon,
            CASE
              WHEN COALESCE(photo ->> 'takenAt', photo ->> 'taken_at', '') ~ '^\\d{10,16}$'
                THEN to_timestamp(
                  (COALESCE(photo ->> 'takenAt', photo ->> 'taken_at'))::bigint /
                  CASE
                    WHEN length(COALESCE(photo ->> 'takenAt', photo ->> 'taken_at')) > 10 THEN 1000.0
                    ELSE 1.0
                  END
                )
              WHEN COALESCE(photo ->> 'takenAt', photo ->> 'taken_at', '') <> ''
                THEN (COALESCE(photo ->> 'takenAt', photo ->> 'taken_at'))::timestamptz
              ELSE NULL
            END AS taken_at
          FROM photos
        ),
        plot_row AS (
          SELECT id, kind, geography, precision_m_at_capture
          FROM plot
          WHERE id = $1
        ),
        geo_verified AS (
          SELECT p.*
          FROM parsed p
          CROSS JOIN plot_row pr
          WHERE pr.id IS NOT NULL
            AND p.lat BETWEEN -90 AND 90
            AND p.lon BETWEEN -180 AND 180
            AND (
              (
                pr.kind = 'polygon'
                AND ST_Covers(
                  pr.geography::geometry,
                  ST_SetSRID(ST_Point(p.lon, p.lat), 4326)
                )
              )
              OR (
                pr.kind = 'point'
                AND ST_DWithin(
                  pr.geography,
                  ST_SetSRID(ST_Point(p.lon, p.lat), 4326)::geography,
                  COALESCE(pr.precision_m_at_capture, 25)
                )
              )
            )
        )
        SELECT
          (SELECT COUNT(*)::int FROM parsed) AS total_count,
          (
            SELECT COUNT(*)::int
            FROM parsed
            WHERE lat BETWEEN -90 AND 90
              AND lon BETWEEN -180 AND 180
          ) AS geo_tagged_count,
          (SELECT COUNT(*)::int FROM geo_verified) AS geo_verified_count,
          (
            SELECT COUNT(*)::int
            FROM parsed
            WHERE taken_at IS NOT NULL
              AND taken_at::date > $3::date
          ) AS timestamp_verified_count,
          (
            SELECT COUNT(*)::int
            FROM geo_verified
            WHERE taken_at IS NOT NULL
              AND taken_at::date > $3::date
          ) AS clearance_verified_count
      `,
      [plotId, JSON.stringify(photos), EUDR_DEFORESTATION_CUTOFF],
    );

    const row = res.rows[0] ?? {};
    return buildGroundTruthPhotoVerification({
      totalCount: Number(row.total_count) || 0,
      geoTaggedCount: Number(row.geo_tagged_count) || 0,
      geoVerifiedCount: Number(row.geo_verified_count) || 0,
      timestampVerifiedCount: Number(row.timestamp_verified_count) || 0,
      clearanceVerifiedCount: Number(row.clearance_verified_count) || 0,
    });
  }

  private async getGroundTruthPhotoVerification(plotId: string): Promise<GroundTruthPhotoVerification> {
    const photos = await this.getLatestGroundTruthPhotos(plotId);
    return this.verifyGroundTruthPhotosOnPlot(plotId, photos);
  }

  private async finalizePlotComplianceStatus(params: {
    plotId: string;
    proposedStatus: PlotComplianceStatus;
    gfwSummary: GfwAlertSummary;
  }): Promise<{
    status: PlotComplianceStatus;
    reviewClearanceBlocked: boolean;
    groundTruthPhotos: GroundTruthPhotoVerification;
  }> {
    const { status: currentStatus } = await this.getPlotStatusRow(params.plotId);
    const groundTruthPhotos = await this.getGroundTruthPhotoVerification(params.plotId);
    const status = applyReviewClearanceGate({
      proposedStatus: params.proposedStatus,
      currentStatus,
      clearanceVerifiedGroundTruthPhotoCount: groundTruthPhotos.clearanceVerifiedCount,
    });
    return {
      status,
      reviewClearanceBlocked: status === 'under_review' && params.proposedStatus === 'compliant',
      groundTruthPhotos,
    };
  }

  private async getPlotOverlapFlags(plotId: string): Promise<{
    sinaph_overlap: boolean;
    indigenous_overlap: boolean;
  }> {
    const res = await this.pool.query(
      `
        SELECT sinaph_overlap, indigenous_overlap
        FROM plot
        WHERE id = $1
      `,
      [plotId],
    );
    if (res.rowCount === 0) {
      throw new BadRequestException('Plot not found');
    }
    const row = res.rows[0];
    return {
      sinaph_overlap: row.sinaph_overlap === true,
      indigenous_overlap: row.indigenous_overlap === true,
    };
  }

  private buildDeforestationScreeningSnapshot(params: {
    summary: GfwAlertSummary;
    signalTier: ReturnType<typeof gfwSummaryToSignalTier>;
    screening: {
      cutoffDate: string;
      usedFallback: boolean;
      gfwResult: Record<string, unknown>;
    };
  }): DeforestationScreeningSnapshot {
    return {
      cutoffDate: params.screening.cutoffDate,
      alertCount: params.summary.alertCount,
      alertAreaHa: params.summary.alertAreaHa,
      signalTier: params.signalTier,
      providerMode: params.screening.usedFallback ? 'radd_fallback' : 'glad_s2_primary',
      dataset: typeof params.screening.gfwResult.dataset === 'string' ? params.screening.gfwResult.dataset : null,
      version: typeof params.screening.gfwResult.version === 'string' ? params.screening.gfwResult.version : null,
      screenedAt: new Date().toISOString(),
    };
  }

  private async persistPlotComplianceStatus(
    plotId: string,
    status: PlotComplianceStatus,
    screening?: DeforestationScreeningSnapshot | null,
  ): Promise<void> {
    if (screening) {
      await this.pool.query(
        `
          UPDATE plot
          SET status = $2,
              deforestation_screening = $3::jsonb,
              updated_at = NOW()
          WHERE id = $1
        `,
        [plotId, status, JSON.stringify(screening)],
      );
      return;
    }

    await this.pool.query(
      `
        UPDATE plot
        SET status = $2,
            updated_at = NOW()
        WHERE id = $1
      `,
      [plotId, status],
    );
  }

  private async queryGfwAlertsForGeometry(
    geometry: any,
    cutoffDate: string = EUDR_DEFORESTATION_CUTOFF,
  ): Promise<{
    summary: GfwAlertSummary;
    gfwResult: Record<string, unknown>;
    usedFallback: boolean;
    cutoffDate: string;
    historicalSqlApplied: boolean;
  }> {
    let gfwResult: Record<string, unknown> = await this.gfw.runHistoricalDeforestationQuery({
      geometry,
      cutoffDate,
    });
    let summary = this.normalizeGfwResult(gfwResult.result);
    let usedFallback = false;
    if (summary.alertCount == null) {
      gfwResult = {
        ...(await this.gfw.runRaddFallback({ geometry, cutoffDate })),
        cutoffDate,
      };
      summary = this.normalizeGfwResult(gfwResult.result);
      usedFallback = true;
    }

    return {
      summary,
      gfwResult,
      usedFallback,
      cutoffDate,
      historicalSqlApplied: Boolean(gfwResult.historicalSqlApplied),
    };
  }

  private resolveMergedPlotStatus(params: {
    gfwSummary: GfwAlertSummary;
    sinaphOverlap: boolean;
    indigenousOverlap: boolean;
  }): PlotComplianceStatus {
    return mergePlotComplianceStatus(
      gfwSummaryToPlotStatus(params.gfwSummary),
      overlapToPlotStatus(params.sinaphOverlap, params.indigenousOverlap),
    );
  }

  async runGfwCheck(plotId: string, userId: string | undefined) {
    const geometry = await this.getPlotGeometryForCompliance(plotId);
    const overlaps = await this.getPlotOverlapFlags(plotId);

    try {
      const screening = await this.queryGfwAlertsForGeometry(geometry);
      const signalTier = gfwSummaryToSignalTier(screening.summary);
      const proposedStatus = this.resolveMergedPlotStatus({
        gfwSummary: screening.summary,
        sinaphOverlap: overlaps.sinaph_overlap,
        indigenousOverlap: overlaps.indigenous_overlap,
      });
      const finalized = await this.finalizePlotComplianceStatus({
        plotId,
        proposedStatus,
        gfwSummary: screening.summary,
      });
      const plotStatus = finalized.status;

      const screeningSnapshot = this.buildDeforestationScreeningSnapshot({
        summary: screening.summary,
        signalTier,
        screening,
      });

      await this.persistPlotComplianceStatus(plotId, plotStatus, screeningSnapshot);

      await this.pool.query(
        `
          INSERT INTO audit_log (user_id, event_type, payload)
          VALUES ($1, $2, $3::jsonb)
        `,
        [
          userId ?? null,
          'gfw_check_run',
          JSON.stringify({
            plotId,
            provider: 'gfw',
            providerMode: screeningSnapshot.providerMode,
            cutoffDate: screening.cutoffDate,
            plotStatus,
            proposedStatus,
            reviewClearanceBlocked: finalized.reviewClearanceBlocked,
            groundTruthPhotos: finalized.groundTruthPhotos,
            screening: screeningSnapshot,
            summary: {
              status: signalTier,
              alertCount: screening.summary.alertCount,
              alertAreaHa: screening.summary.alertAreaHa,
            },
            ...screening.gfwResult,
            historicalSqlApplied: screening.historicalSqlApplied,
            runAt: new Date().toISOString(),
          }),
        ],
      );

      return {
        ok: true,
        plotStatus,
        reviewClearanceBlocked: finalized.reviewClearanceBlocked,
        groundTruthPhotos: finalized.groundTruthPhotos,
        usedFallback: screening.usedFallback,
        cutoffDate: screening.cutoffDate,
        summary: { status: signalTier, ...screening.summary },
        ...screening.gfwResult,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.pool.query(
        `
          INSERT INTO audit_log (user_id, event_type, payload)
          VALUES ($1, $2, $3::jsonb)
        `,
        [
          userId ?? null,
          'gfw_check_failed',
          JSON.stringify({
            plotId,
            provider: 'gfw',
            cutoffDate: EUDR_DEFORESTATION_CUTOFF,
            error: message,
            runAt: new Date().toISOString(),
          }),
        ],
      );

      return {
        ok: false,
        plotStatus: 'pending_check' as const,
        error: message,
        cutoffDate: EUDR_DEFORESTATION_CUTOFF,
      };
    }
  }

  async runDeforestationDecision(plotId: string, userId: string | undefined, cutoffDate: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(cutoffDate)) {
      throw new BadRequestException('Invalid cutoffDate. Use YYYY-MM-DD.');
    }
    const cutoffAsDate = new Date(`${cutoffDate}T00:00:00.000Z`);
    if (Number.isNaN(cutoffAsDate.getTime())) {
      throw new BadRequestException('Invalid cutoffDate. Use YYYY-MM-DD.');
    }

    const geometry = await this.getPlotGeometryForCompliance(plotId);
    const overlaps = await this.getPlotOverlapFlags(plotId);
    const screening = await this.queryGfwAlertsForGeometry(geometry, cutoffDate);

    const verdict =
      screening.summary.alertCount == null
        ? 'unknown'
        : screening.summary.alertCount === 0
          ? 'no_deforestation_detected'
          : 'possible_deforestation_detected';

    const proposedStatus = mergePlotComplianceStatus(
      verdictToPlotStatus(verdict, screening.summary),
      overlapToPlotStatus(overlaps.sinaph_overlap, overlaps.indigenous_overlap),
    );
    const finalized = await this.finalizePlotComplianceStatus({
      plotId,
      proposedStatus,
      gfwSummary: screening.summary,
    });
    const plotStatus = finalized.status;

    const signalTier = gfwSummaryToSignalTier(screening.summary);
    const screeningSnapshot = this.buildDeforestationScreeningSnapshot({
      summary: screening.summary,
      signalTier,
      screening,
    });

    await this.persistPlotComplianceStatus(plotId, plotStatus, screeningSnapshot);

    await this.pool.query(
      `
        INSERT INTO audit_log (user_id, event_type, payload)
        VALUES ($1, $2, $3::jsonb)
      `,
      [
        userId ?? null,
        'plot_deforestation_decision_recorded',
        JSON.stringify({
          ...screening.gfwResult,
          plotId,
          provider: 'gfw',
          providerMode: screening.usedFallback ? 'radd_fallback' : 'glad_s2_primary',
          cutoffDate,
          verdict,
          plotStatus,
          summary: {
            alertCount: screening.summary.alertCount,
            alertAreaHa: screening.summary.alertAreaHa,
          },
          historicalSqlApplied: screening.historicalSqlApplied,
          runAt: new Date().toISOString(),
        }),
      ],
    );

    return {
      ok: true,
      plotId,
      cutoffDate,
      verdict,
      plotStatus,
      usedFallback: screening.usedFallback,
      summary: {
        alertCount: screening.summary.alertCount,
        alertAreaHa: screening.summary.alertAreaHa,
      },
      historicalSqlApplied: screening.historicalSqlApplied,
      provider: 'gfw',
      providerMode: screening.usedFallback ? 'radd_fallback' : 'glad_s2_primary',
      source: {
        dataset: screening.gfwResult.dataset ?? null,
        version: screening.gfwResult.version ?? null,
      },
    };
  }

  async getComplianceHistory(plotId: string) {
    const res = await this.pool.query(
      `
        SELECT id, timestamp, user_id, device_id, event_type, payload
        FROM audit_log
        WHERE payload ->> 'plotId' = $1
          AND event_type IN ('gfw_check_run', 'plot_compliance_checked', 'plot_photos_synced', 'plot_legal_synced', 'plot_edited')
        ORDER BY timestamp DESC
        LIMIT 50
      `,
      [plotId],
    );
    return res.rows;
  }

  async getDeforestationDecisionHistory(plotId: string) {
    const res = await this.pool.query(
      `
        SELECT id, timestamp, user_id, device_id, event_type, payload
        FROM (
          SELECT id, timestamp, user_id, device_id, event_type, payload
          FROM audit_log
          WHERE payload ->> 'plotId' = $1
            AND event_type = 'plot_deforestation_decision_recorded'
          UNION
          SELECT id, timestamp, user_id, device_id, event_type, payload
          FROM public.audit_log
          WHERE payload ->> 'plotId' = $1
            AND event_type = 'plot_deforestation_decision_recorded'
        ) decision_rows
        ORDER BY timestamp DESC
        LIMIT 100
      `,
      [plotId],
    );
    return res.rows;
  }

  async getGeometryHistory(
    plotId: string,
    limit = 100,
    offset = 0,
    sort: 'desc' | 'asc' = 'desc',
    anomalyProfile: 'strict' | 'balanced' | 'lenient' = 'balanced',
    signalsOnly = false,
  ): Promise<PlotGeometryHistoryPage> {
    const normalizedAnomalyProfile =
      anomalyProfile === 'strict' || anomalyProfile === 'lenient' ? anomalyProfile : 'balanced';

    const boundedLimit = Number.isFinite(limit) ? Math.max(1, Math.min(200, Math.trunc(limit))) : 100;
    const boundedOffset = Number.isFinite(offset) ? Math.max(0, Math.trunc(offset)) : 0;
    const normalizedSort = sort === 'asc' ? 'asc' : 'desc';
    const orderDirectionSql = normalizedSort === 'asc' ? 'ASC' : 'DESC';

    const mapRowToEvent = (row: any) => {
      const payload = row.payload && typeof row.payload === 'object' ? row.payload : {};
      const eventType: 'plot_created' | 'plot_geometry_superseded' =
        row.event_type === 'plot_geometry_superseded' ? 'plot_geometry_superseded' : 'plot_created';
      return {
        id: String(row.id),
        timestamp:
          row.timestamp instanceof Date
            ? row.timestamp.toISOString()
            : new Date(row.timestamp).toISOString(),
        userId: row.user_id ? String(row.user_id) : null,
        deviceId: row.device_id ? String(row.device_id) : null,
        eventType,
        payload: {
          plotId: String((payload as Record<string, unknown>).plotId ?? plotId),
          details: payload as Record<string, unknown>,
        },
      };
    };

    if (signalsOnly) {
      const fullRes = await this.pool.query(
        `
          SELECT id, timestamp, user_id, device_id, event_type, payload
          FROM audit_log
          WHERE payload ->> 'plotId' = $1
            AND event_type IN ('plot_created', 'plot_geometry_superseded')
          ORDER BY timestamp ${orderDirectionSql}
        `,
        [plotId],
      );
      const allItems = fullRes.rows.map(mapRowToEvent);
      const anomalies = PlotsService.computeGeometryHistoryAnomalies(allItems, normalizedAnomalyProfile);
      const anomalyIds = new Set(anomalies.map((anomaly) => anomaly.eventId));
      const filteredItems = allItems.filter((item) => anomalyIds.has(item.id));
      const pagedItems = filteredItems.slice(boundedOffset, boundedOffset + boundedLimit);

      return {
        items: pagedItems,
        anomalies,
        total: filteredItems.length,
        limit: boundedLimit,
        offset: boundedOffset,
        sort: normalizedSort,
        anomalyProfile: normalizedAnomalyProfile,
        signalsOnly: true,
        anomalySummary: PlotsService.summarizeGeometryHistoryAnomalies(anomalies),
        anomalySummaryScope: 'full_filtered_set',
      };
    }

    const countRes = await this.pool.query(
      `
        SELECT COUNT(*)::int AS total
        FROM audit_log
        WHERE payload ->> 'plotId' = $1
          AND event_type IN ('plot_created', 'plot_geometry_superseded')
      `,
      [plotId],
    );
    const total = Number(countRes.rows[0]?.total ?? 0);

    const res = await this.pool.query(
      `
        SELECT id, timestamp, user_id, device_id, event_type, payload
        FROM audit_log
        WHERE payload ->> 'plotId' = $1
          AND event_type IN ('plot_created', 'plot_geometry_superseded')
        ORDER BY timestamp ${orderDirectionSql}
        LIMIT $2
        OFFSET $3
      `,
      [plotId, boundedLimit, boundedOffset],
    );
    const items = res.rows.map(mapRowToEvent);
    const anomalies = PlotsService.computeGeometryHistoryAnomalies(items, normalizedAnomalyProfile);
    return {
      items,
      anomalies,
      total,
      limit: boundedLimit,
      offset: boundedOffset,
      sort: normalizedSort,
      anomalyProfile: normalizedAnomalyProfile,
      signalsOnly: false,
      anomalySummary: PlotsService.summarizeGeometryHistoryAnomalies(anomalies),
      anomalySummaryScope: 'current_page',
    };
  }

  async listByFarmer(farmerId: string) {
    const result = await this.pool.query(
      `
        SELECT
          id,
          farmer_id,
          name,
          kind,
          area_ha,
          declared_area_ha,
          precision_m_at_capture,
          sinaph_overlap,
          indigenous_overlap,
          production_system,
          deforestation_screening,
          status,
          created_at
        FROM plot
        WHERE farmer_id = $1
        ORDER BY created_at DESC
      `,
      [farmerId],
    );

    return result.rows;
  }

  async listForTenant(
    tenantId: string,
    canAccessPlot?: (plotId: string, farmerId: string) => Promise<boolean>,
  ) {
    const farmerIds = await resolveFarmerIdsForTenant(this.pool, tenantId);
    if (farmerIds.length === 0) {
      return [];
    }

    const result = await this.pool.query(
      `
        SELECT
          id,
          farmer_id,
          name,
          kind,
          area_ha,
          declared_area_ha,
          precision_m_at_capture,
          sinaph_overlap,
          indigenous_overlap,
          status,
          created_at
        FROM plot
        WHERE farmer_id = ANY($1::uuid[])
        ORDER BY created_at DESC
      `,
      [farmerIds],
    );

    if (!canAccessPlot) {
      return result.rows;
    }

    const allowed: typeof result.rows = [];
    for (const row of result.rows) {
      if (await canAccessPlot(row.id as string, row.farmer_id as string)) {
        allowed.push(row);
      }
    }
    return allowed;
  }

  async getPlotTenantScope(plotId: string): Promise<{ farmerId: string }> {
    const res = await this.pool.query(
      `
        SELECT farmer_id
        FROM plot
        WHERE id = $1
      `,
      [plotId],
    );
    if (res.rowCount === 0) {
      throw new BadRequestException('Plot not found');
    }
    return { farmerId: res.rows[0].farmer_id as string };
  }

  async listReviewQueue(
    tenantId: string,
    canAccessPlot?: (plotId: string) => Promise<boolean>,
  ) {
    const farmerIds = await resolveFarmerIdsForTenant(this.pool, tenantId);
    if (farmerIds.length === 0) {
      return [];
    }

    const result = await this.pool.query(
      `
        SELECT
          p.id,
          p.farmer_id,
          p.name,
          p.kind,
          p.area_ha,
          p.status,
          p.production_system,
          p.deforestation_screening,
          p.sinaph_overlap,
          p.indigenous_overlap,
          p.updated_at,
          COALESCE(ua.name, LEFT(fp.id::text, 8)) AS farmer_name
        FROM plot p
        JOIN farmer_profile fp ON fp.id = p.farmer_id
        LEFT JOIN user_account ua ON ua.id = fp.user_id
        WHERE p.farmer_id = ANY($1::uuid[])
          AND p.status IN ('under_review', 'degradation_risk', 'deforestation_detected')
        ORDER BY
          CASE p.status
            WHEN 'deforestation_detected' THEN 0
            WHEN 'degradation_risk' THEN 1
            ELSE 2
          END,
          p.updated_at DESC
      `,
      [farmerIds],
    );

    const scopedRows = canAccessPlot
      ? (
          await Promise.all(
            result.rows.map(async (row) => ({
              row,
              allowed: await canAccessPlot(row.id as string),
            })),
          )
        )
          .filter((entry) => entry.allowed)
          .map((entry) => entry.row)
      : result.rows;

    const items = await Promise.all(
      scopedRows.map(async (row) => {
        const groundTruthPhotos = await this.getGroundTruthPhotoVerification(row.id);
        return {
          ...row,
          reviewPriority:
            row.status === 'deforestation_detected'
              ? 'high'
              : row.status === 'degradation_risk'
                ? 'medium'
                : 'low',
          autoClearanceEligible: groundTruthPhotos.clearanceEligible,
          groundTruthPhotos,
        };
      }),
    );

    return items;
  }

  async clearPlotReview(
    plotId: string,
    params: { reason: string; note?: string | null },
    userId: string | undefined,
  ) {
    const { status: currentStatus } = await this.getPlotStatusRow(plotId);
    if (
      currentStatus !== 'under_review' &&
      currentStatus !== 'degradation_risk' &&
      currentStatus !== 'deforestation_detected'
    ) {
      throw new BadRequestException('Plot is not in a reviewable status');
    }

    await this.pool.query(
      `
        UPDATE plot
        SET status = 'compliant',
            updated_at = NOW()
        WHERE id = $1
      `,
      [plotId],
    );

    await this.pool.query(
      `
        INSERT INTO audit_log (user_id, event_type, payload)
        VALUES ($1, $2, $3::jsonb)
      `,
      [
        userId ?? null,
        'plot_review_cleared',
        JSON.stringify({
          plotId,
          previousStatus: currentStatus,
          newStatus: 'compliant',
          reason: params.reason,
          note: params.note ?? null,
          clearedAt: new Date().toISOString(),
        }),
      ],
    );

    return { ok: true, plotId, plotStatus: 'compliant' as const, previousStatus: currentStatus };
  }

  async upholdPlotReview(
    plotId: string,
    params: { reason: string; note?: string | null },
    userId: string | undefined,
  ) {
    const { status: currentStatus } = await this.getPlotStatusRow(plotId);
    if (
      currentStatus !== 'under_review' &&
      currentStatus !== 'degradation_risk' &&
      currentStatus !== 'deforestation_detected'
    ) {
      throw new BadRequestException('Plot is not in a reviewable status');
    }

    const nextStatus: PlotComplianceStatus =
      currentStatus === 'under_review' ? 'deforestation_detected' : currentStatus;

    if (nextStatus !== currentStatus) {
      await this.pool.query(
        `
          UPDATE plot
          SET status = $2,
              updated_at = NOW()
          WHERE id = $1
        `,
        [plotId, nextStatus],
      );
    }

    await this.pool.query(
      `
        INSERT INTO audit_log (user_id, event_type, payload)
        VALUES ($1, $2, $3::jsonb)
      `,
      [
        userId ?? null,
        'plot_review_upheld',
        JSON.stringify({
          plotId,
          previousStatus: currentStatus,
          newStatus: nextStatus,
          reason: params.reason,
          note: params.note ?? null,
          upheldAt: new Date().toISOString(),
        }),
      ],
    );

    return { ok: true, plotId, plotStatus: nextStatus, previousStatus: currentStatus };
  }

  async isFarmerOwnedByUser(farmerId: string, userId: string): Promise<boolean> {
    const res = await this.pool.query(
      `
        SELECT 1
        FROM farmer_profile
        WHERE id = $1
          AND user_id = $2
        LIMIT 1
      `,
      [farmerId, userId],
    );
    return (res.rowCount ?? 0) > 0;
  }

  async isPlotOwnedByUser(plotId: string, userId: string): Promise<boolean> {
    const res = await this.pool.query(
      `
        SELECT 1
        FROM plot p
        JOIN farmer_profile fp ON fp.id = p.farmer_id
        WHERE p.id = $1
          AND fp.user_id = $2
        LIMIT 1
      `,
      [plotId, userId],
    );
    return (res.rowCount ?? 0) > 0;
  }

  async isAgentAssignedToPlot(plotId: string, agentUserId: string, assignmentId?: string): Promise<boolean> {
    try {
      const res = await this.pool.query(
        `
          SELECT 1
          FROM agent_plot_assignment apa
          WHERE apa.plot_id = $1
            AND apa.agent_user_id = $2
            AND apa.status = 'active'
            AND ($3::text IS NULL OR apa.assignment_id = $3)
          LIMIT 1
        `,
        [plotId, agentUserId, assignmentId ?? null],
      );
      return (res.rowCount ?? 0) > 0;
    } catch (error: any) {
      // Fail closed until canonical assignment relation is provisioned.
      if (error?.code === '42P01') {
        return false;
      }
      throw error;
    }
  }

  async createAssignment(plotId: string, assignmentId: string, agentUserId: string): Promise<PlotAssignmentRow> {
    try {
      const res = await this.pool.query<PlotAssignmentRow>(
        `
          INSERT INTO agent_plot_assignment (assignment_id, agent_user_id, plot_id, status)
          VALUES ($1, $2, $3, 'active')
          RETURNING
            assignment_id AS "assignmentId",
            plot_id AS "plotId",
            agent_user_id AS "agentUserId",
            status,
            assigned_at AS "assignedAt",
            ended_at AS "endedAt"
        `,
        [assignmentId, agentUserId, plotId],
      );
      if ((res.rowCount ?? 0) === 0) {
        throw new BadRequestException('ASN-001: Failed to create assignment.');
      }
      return res.rows[0];
    } catch (error: any) {
      if (error?.code === '23505') {
        throw new BadRequestException('ASN-001: Assignment already active for this plot/agent scope.');
      }
      if (error?.code === '42P01') {
        throw new BadRequestException('ASN-004: Assignment relation not provisioned.');
      }
      throw error;
    }
  }

  async listAssignmentsByPlot(
    plotId: string,
    options?: {
      status?: 'all' | 'active' | 'completed' | 'cancelled';
      fromDays?: number;
      agentUserId?: string;
      limit?: number;
      offset?: number;
    },
  ): Promise<PlotAssignmentListPage> {
    const status = options?.status ?? 'all';
    const fromDays = Number.isFinite(options?.fromDays) ? Math.max(1, Math.trunc(options!.fromDays!)) : 30;
    const limit = Number.isFinite(options?.limit) ? Math.min(100, Math.max(1, Math.trunc(options!.limit!))) : 20;
    const offset = Number.isFinite(options?.offset) ? Math.max(0, Math.trunc(options!.offset!)) : 0;
    const agentUserId = options?.agentUserId?.trim() ? options.agentUserId.trim() : null;
    try {
      const totalRes = await this.pool.query<{ total: number }>(
        `
          SELECT COUNT(*)::int AS total
          FROM agent_plot_assignment
          WHERE plot_id = $1
            AND ($2::text = 'all' OR status = $2)
            AND ($3::uuid IS NULL OR agent_user_id = $3::uuid)
            AND assigned_at >= (NOW() - make_interval(days => $4::int))
        `,
        [plotId, status, agentUserId, fromDays],
      );
      const res = await this.pool.query<PlotAssignmentListItem>(
        `
          SELECT
            assignment_id AS "assignmentId",
            plot_id AS "plotId",
            agent_user_id AS "agentUserId",
            ua.name AS "agentName",
            to_jsonb(ua)->>'email' AS "agentEmail",
            status,
            assigned_at AS "assignedAt",
            ended_at AS "endedAt"
          FROM agent_plot_assignment
          LEFT JOIN user_account ua ON ua.id = agent_plot_assignment.agent_user_id
          WHERE plot_id = $1
            AND ($2::text = 'all' OR status = $2)
            AND ($3::uuid IS NULL OR agent_user_id = $3::uuid)
            AND assigned_at >= (NOW() - make_interval(days => $4::int))
          ORDER BY assigned_at DESC
          LIMIT $5
          OFFSET $6
        `,
        [plotId, status, agentUserId, fromDays, limit, offset],
      );
      return {
        items: res.rows,
        total: totalRes.rows[0]?.total ?? 0,
        limit,
        offset,
        status,
        fromDays,
        agentUserId,
      };
    } catch (error: any) {
      if (error?.code === '42P01') {
        throw new BadRequestException('ASN-004: Assignment relation not provisioned.');
      }
      throw error;
    }
  }

  async appendAssignmentExportAuditEvent(event: PlotAssignmentExportAuditEvent): Promise<void> {
    await this.pool.query(
      `
        INSERT INTO audit_log (user_id, event_type, payload)
        VALUES ($1, $2, $3::jsonb)
      `,
      [
        event.userId ?? null,
        `plot_assignment_export_${event.phase}`,
        JSON.stringify({
          plotId: event.plotId,
          tenantId: event.tenantId ?? null,
          exportedBy: event.exportedBy ?? null,
          rowCount: event.rowCount ?? null,
          status: event.filters.status,
          fromDays: event.filters.fromDays,
          agentUserId: event.filters.agentUserId,
          error: event.error ?? null,
        }),
      ],
    );
  }

  async completeAssignment(assignmentId: string): Promise<PlotAssignmentRow> {
    return this.transitionAssignmentStatus(assignmentId, 'completed');
  }

  async cancelAssignment(assignmentId: string): Promise<PlotAssignmentRow> {
    return this.transitionAssignmentStatus(assignmentId, 'cancelled');
  }

  private async transitionAssignmentStatus(
    assignmentId: string,
    nextStatus: 'completed' | 'cancelled',
  ): Promise<PlotAssignmentRow> {
    try {
      const res = await this.pool.query<PlotAssignmentRow>(
        `
          UPDATE agent_plot_assignment
          SET status = $2,
              ended_at = NOW(),
              updated_at = NOW()
          WHERE assignment_id = $1
            AND status = 'active'
          RETURNING
            assignment_id AS "assignmentId",
            plot_id AS "plotId",
            agent_user_id AS "agentUserId",
            status,
            assigned_at AS "assignedAt",
            ended_at AS "endedAt"
        `,
        [assignmentId, nextStatus],
      );

      if ((res.rowCount ?? 0) > 0) {
        return res.rows[0];
      }

      const existing = await this.pool.query<{ status: string }>(
        `SELECT status FROM agent_plot_assignment WHERE assignment_id = $1 LIMIT 1`,
        [assignmentId],
      );
      if ((existing.rowCount ?? 0) === 0) {
        throw new BadRequestException('ASN-002: Assignment not found.');
      }
      throw new BadRequestException(
        `ASN-003: Invalid assignment state transition from ${existing.rows[0].status} to ${nextStatus}.`,
      );
    } catch (error: any) {
      if (error?.code === '42P01') {
        throw new BadRequestException('ASN-004: Assignment relation not provisioned.');
      }
      throw error;
    }
  }

  async runComplianceCheck(plotId: string) {
    const plotRes = await this.pool.query(
      `
        SELECT id, area_ha, geometry
        FROM plot
        WHERE id = $1
      `,
      [plotId],
    );

    if (plotRes.rowCount === 0) {
      throw new BadRequestException('Plot not found');
    }

    const row = plotRes.rows[0];

    const overlapRes = await this.pool.query(
      `
        SELECT
          EXISTS (
            SELECT 1
            FROM sinaph_zone sz
            WHERE ST_Intersects(
              sz.geometry,
              ST_Buffer($1::geography, 50)::geometry -- 50m buffer around plot
            )
          ) AS sinaph_overlap,
          EXISTS (
            SELECT 1
            FROM indigenous_zone iz
            WHERE ST_Intersects(
              iz.geometry,
              ST_Buffer($1::geography, 50)::geometry
            )
          ) AS indigenous_overlap
      `,
      [row.geometry],
    );

    const overlaps = overlapRes.rows[0] ?? {
      sinaph_overlap: false,
      indigenous_overlap: false,
    };

    let gfwSummary: GfwAlertSummary = { alertCount: null, alertAreaHa: null };
    let gfwSignalTier: ReturnType<typeof gfwSummaryToSignalTier> = 'unknown';
    let gfwProviderMode: 'glad_s2_primary' | 'radd_fallback' | 'unavailable' = 'unavailable';
    let gfwError: string | null = null;

    try {
      const geometry = await this.getPlotGeometryForCompliance(plotId);
      const screening = await this.queryGfwAlertsForGeometry(geometry);
      gfwSummary = screening.summary;
      gfwSignalTier = gfwSummaryToSignalTier(screening.summary);
      gfwProviderMode = screening.usedFallback ? 'radd_fallback' : 'glad_s2_primary';
    } catch (error) {
      gfwError = error instanceof Error ? error.message : String(error);
    }

    const proposedStatus = this.resolveMergedPlotStatus({
      gfwSummary,
      sinaphOverlap: overlaps.sinaph_overlap === true,
      indigenousOverlap: overlaps.indigenous_overlap === true,
    });
    const finalized = await this.finalizePlotComplianceStatus({
      plotId,
      proposedStatus,
      gfwSummary,
    });
    const status = finalized.status;

    const screeningSnapshot =
      gfwSignalTier !== 'unknown'
        ? this.buildDeforestationScreeningSnapshot({
            summary: gfwSummary,
            signalTier: gfwSignalTier,
            screening: {
              cutoffDate: EUDR_DEFORESTATION_CUTOFF,
              usedFallback: gfwProviderMode === 'radd_fallback',
              gfwResult: {
                dataset: process.env.GFW_DATASET ?? 'gfw_integrated_alerts',
                version: process.env.GFW_VERSION ?? 'latest',
              },
            },
          })
        : null;

    const updateRes = await this.pool.query(
      `
        UPDATE plot
        SET status = $2,
            sinaph_overlap = $3,
            indigenous_overlap = $4,
            deforestation_screening = COALESCE($5::jsonb, deforestation_screening)
        WHERE id = $1
        RETURNING *
      `,
      [
        plotId,
        status,
        overlaps.sinaph_overlap,
        overlaps.indigenous_overlap,
        screeningSnapshot ? JSON.stringify(screeningSnapshot) : null,
      ],
    );

    const updated = updateRes.rows[0];

    // Audit: compliance re-check
    await this.pool.query(
      `
        INSERT INTO audit_log (user_id, event_type, payload)
        VALUES ($1, $2, $3::jsonb)
      `,
      [
        null,
        'plot_compliance_checked',
        JSON.stringify({
          plotId,
          status,
          sinaphOverlap: overlaps.sinaph_overlap,
          indigenousOverlap: overlaps.indigenous_overlap,
          proposedStatus,
          reviewClearanceBlocked: finalized.reviewClearanceBlocked,
          groundTruthPhotos: finalized.groundTruthPhotos,
          gfw: {
            cutoffDate: EUDR_DEFORESTATION_CUTOFF,
            providerMode: gfwProviderMode,
            signalTier: gfwSignalTier,
            alertCount: gfwSummary.alertCount,
            alertAreaHa: gfwSummary.alertAreaHa,
            error: gfwError,
          },
        }),
      ],
    );

    return updated;
  }

  async updateMetadata(plotId: string, dto: UpdatePlotDto, userId: string | undefined) {
    const existingRes = await this.pool.query(
      `
        SELECT id, name
        FROM plot
        WHERE id = $1
      `,
      [plotId],
    );

    if (existingRes.rowCount === 0) {
      throw new BadRequestException('Plot not found');
    }

    const existing = existingRes.rows[0] as { id: string; name: string };

    let updatedName = existing.name;

    if (dto.name && dto.name !== existing.name) {
      const updateRes = await this.pool.query(
        `
          UPDATE plot
          SET name = $2
          WHERE id = $1
          RETURNING name
        `,
        [plotId, dto.name],
      );

      updatedName = updateRes.rows[0]?.name ?? existing.name;
    }

    await this.pool.query(
      `
        INSERT INTO audit_log (user_id, event_type, payload)
        VALUES ($1, $2, $3::jsonb)
      `,
      [
        userId ?? null,
        'plot_edited',
        JSON.stringify({
          plotId,
          oldName: existing.name,
          newName: updatedName,
          reason: dto.reason,
          deviceId: dto.deviceId ?? null,
        }),
      ],
    );

    return {
      id: plotId,
      name: updatedName,
    };
  }

  async updateGeometry(plotId: string, dto: UpdatePlotGeometryDto, userId: string | undefined) {
    const existingRes = await this.pool.query(
      `
        SELECT id, kind, ST_AsGeoJSON(geometry) AS geometry_geojson
        FROM plot
        WHERE id = $1
      `,
      [plotId],
    );
    if (existingRes.rowCount === 0) {
      throw new BadRequestException('Plot not found');
    }

    const ensureSixDecimals = (value: number) => Number(value.toFixed(6));
    let geometrySql: string;
    let kind: (typeof plotKindEnum.enumValues)[number];

    if (dto.geometry?.type === 'Point') {
      const [lon, lat] = dto.geometry.coordinates.map(ensureSixDecimals) as [number, number];
      geometrySql = `ST_SetSRID(ST_Point(${lon}, ${lat}), 4326)`;
      kind = 'point';
    } else if (dto.geometry?.type === 'Polygon') {
      const rings = dto.geometry.coordinates;
      if (!Array.isArray(rings) || rings.length === 0) {
        throw new BadRequestException('Polygon must have at least one ring');
      }
      const firstRing = rings[0];
      if (firstRing.length < 4) {
        throw new BadRequestException('Polygon ring must have at least 4 vertices');
      }
      const closedRing =
        firstRing[0][0] === firstRing[firstRing.length - 1][0] &&
        firstRing[0][1] === firstRing[firstRing.length - 1][1]
          ? firstRing
          : [...firstRing, firstRing[0]];
      const coordText = closedRing
        .map(([lon, lat]: [number, number]) => `${ensureSixDecimals(lon)} ${ensureSixDecimals(lat)}`)
        .join(', ');
      const polygonWkt = `POLYGON((${coordText}))`;
      geometrySql = `ST_SetSRID(ST_GeomFromText('${polygonWkt}'), 4326)`;
      kind = 'polygon';
    } else {
      throw new BadRequestException('Unsupported geometry type');
    }

    const updateRes = await this.pool.query(
      `
      WITH input_geom AS (
        SELECT ST_SnapToGrid(${geometrySql}, 1e-6) AS geom
      ),
      normalized AS (
        SELECT
          CASE
            WHEN $8::text = 'polygon' THEN ST_CollectionExtract(ST_MakeValid(geom), 3)
            ELSE geom
          END AS geom,
          CASE
            WHEN $8::text = 'polygon' THEN ST_Area(geom::geography) / 10000.0
            ELSE NULL
          END AS original_area_ha
        FROM input_geom
      ),
      validated AS (
        SELECT
          geom,
          original_area_ha,
          CASE
            WHEN $8::text = 'polygon' THEN ST_Area(geom::geography) / 10000.0
            ELSE NULL
          END AS normalized_area_ha,
          CASE
            WHEN $8::text = 'polygon' AND original_area_ha > 0
              THEN ABS((ST_Area(geom::geography) / 10000.0) - original_area_ha) / original_area_ha * 100.0
            ELSE NULL
          END AS correction_variance_pct
        FROM normalized
      ),
      upd AS (
        UPDATE plot p
        SET
          geometry = v.geom,
          centroid = ST_Centroid(v.geom),
          kind = $2,
          area_ha = ST_Area(v.geom::geography) / 10000.0,
          declared_area_ha = $3,
          precision_m_at_capture = $4,
          hdop_at_capture = $5,
          updated_at = NOW()
        FROM validated v
        WHERE p.id = $1
          AND (
            $8::text <> 'polygon'
            OR v.geom IS NOT NULL
          ) AND (
            $8::text <> 'polygon'
            OR v.correction_variance_pct IS NULL
            OR v.correction_variance_pct <= 5
          )
        RETURNING p.*, ST_AsGeoJSON(p.geometry) AS geometry_geojson
      )
      SELECT
        u.*,
        v.original_area_ha,
        v.normalized_area_ha,
        v.correction_variance_pct
      FROM upd u
      CROSS JOIN validated v
      `,
      [
        plotId,
        kind,
        dto.declaredAreaHa ?? null,
        dto.precisionMeters ?? null,
        dto.hdop ?? null,
        dto.reason,
        dto.deviceId ?? null,
        kind,
      ],
    );

    if (updateRes.rowCount === 0 && kind === 'polygon') {
      const varianceProbe = await this.pool.query(
        `
          WITH input_geom AS (
            SELECT ST_SnapToGrid(${geometrySql}, 1e-6) AS geom
          ),
          normalized AS (
            SELECT
              ST_CollectionExtract(ST_MakeValid(geom), 3) AS geom,
              ST_Area(geom::geography) / 10000.0 AS original_area_ha
            FROM input_geom
          )
          SELECT
            CASE
              WHEN geom IS NULL THEN NULL
              ELSE ABS((ST_Area(geom::geography) / 10000.0) - original_area_ha) / NULLIF(original_area_ha, 0) * 100.0
            END AS correction_variance_pct
          FROM normalized
        `,
      );
      const variance = Number(varianceProbe.rows?.[0]?.correction_variance_pct);
      if (Number.isFinite(variance) && variance > 5) {
        throw new BadRequestException(
          `GEO-102: Geometry correction variance ${variance.toFixed(2)}% exceeds 5% tolerance.`,
        );
      }
      throw new BadRequestException(
        'GEO-101: Invalid polygon geometry could not be normalized with ST_MakeValid.',
      );
    }

    const row = updateRes.rows[0];
    if (dto.declaredAreaHa != null && row?.area_ha != null) {
      const areaHa = Number(row.area_ha);
      const diffPct = (Math.abs(areaHa - dto.declaredAreaHa) / dto.declaredAreaHa) * 100;
      if (diffPct > 5) {
        throw new BadRequestException(
          `Area discrepancy ${diffPct.toFixed(1)}% exceeds 5% tolerance.`,
        );
      }
    }

    await this.pool.query(
      `
        INSERT INTO audit_log (user_id, device_id, event_type, payload)
        VALUES ($1, $2, $3, $4::jsonb)
      `,
      [
        userId ?? null,
        dto.deviceId ?? null,
        'plot_geometry_superseded',
        JSON.stringify({
          plotId,
          reason: dto.reason,
          previous: {
            kind: existingRes.rows[0].kind ?? null,
            geometry: existingRes.rows[0].geometry_geojson ?? null,
          },
          next: {
            kind: row.kind ?? null,
            geometry: row.geometry_geojson ?? null,
          },
          geometryNormalization:
            kind === 'polygon'
              ? {
                  originalAreaHa: row.original_area_ha ?? null,
                  normalizedAreaHa: row.normalized_area_ha ?? null,
                  correctionVariancePct: row.correction_variance_pct ?? null,
                }
              : null,
        }),
      ],
    );

    return {
      id: row.id,
      kind: row.kind,
      areaHa: row.area_ha,
      declaredAreaHa: row.declared_area_ha,
      geometryGeoJson: row.geometry_geojson,
    };
  }
}

