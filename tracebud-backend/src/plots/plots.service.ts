import { Injectable, BadRequestException, ForbiddenException, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../db/db.module';
import { plotKindEnum } from '../db/schema';
import { CreatePlotDto } from './dto/create-plot.dto';
import { SyncPlotLegalDto } from './dto/sync-plot-legal.dto';
import { SyncPlotEvidenceDto } from './dto/sync-plot-evidence.dto';
import { SyncPlotPhotosDto } from './dto/sync-plot-photos.dto';
import { UpdatePlotDto } from './dto/update-plot.dto';
import { GfwService } from '../compliance/gfw.service';

@Injectable()
export class PlotsService {
  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    private readonly gfw: GfwService,
  ) {}

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
          centroid,
          kind,
          area_ha,
          declared_area_ha,
          precision_m_at_capture,
          hdop_at_capture
        )
        SELECT
          $1,
          $2,
          v.geom,
          ST_Centroid(v.geom),
          $3,
          ST_Area(v.geom::geography) / 10000.0,
          $4,
          $5,
          $6
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
          `Geometry correction variance ${variance.toFixed(2)}% exceeds 5% tolerance.`,
        );
      }
      throw new BadRequestException(
        'Invalid polygon geometry could not be normalized with ST_MakeValid.',
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

    return row;
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

  async syncEvidence(plotId: string, dto: SyncPlotEvidenceDto, userId: string | undefined) {
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

    return { ok: true };
  }

  async runGfwCheck(plotId: string, userId: string | undefined) {
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

    const normalize = (result: any): { alertCount: number | null; alertAreaHa: number | null } => {
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
    };

    let gfwResult = await this.gfw.runGeometryQuery({ geometry });
    let summary = normalize(gfwResult.result);
    let usedFallback = false;
    if (summary.alertCount == null) {
      // Fallback to radar-based alerts (better in cloudy tropics).
      gfwResult = await this.gfw.runRaddFallback({ geometry });
      summary = normalize(gfwResult.result);
      usedFallback = true;
    }

    const status =
      summary.alertCount == null
        ? 'unknown'
        : summary.alertCount === 0
          ? 'green'
          : summary.alertAreaHa != null && summary.alertAreaHa < 0.05
            ? 'amber'
            : 'red';

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
          providerMode: usedFallback ? 'radd_fallback' : 'glad_s2_primary',
          summary: {
            status,
            alertCount: summary.alertCount,
            alertAreaHa: summary.alertAreaHa,
          },
          ...gfwResult,
          runAt: new Date().toISOString(),
        }),
      ],
    );

    return { ok: true, usedFallback, summary: { status, ...summary }, ...gfwResult };
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

    let status: string = 'compliant';

    if (overlaps.sinaph_overlap && overlaps.indigenous_overlap) {
      status = 'deforestation_detected';
    } else if (overlaps.sinaph_overlap || overlaps.indigenous_overlap) {
      status = 'degradation_risk';
    }

    const updateRes = await this.pool.query(
      `
        UPDATE plot
        SET status = $2,
            sinaph_overlap = $3,
            indigenous_overlap = $4
        WHERE id = $1
        RETURNING *
      `,
      [plotId, status, overlaps.sinaph_overlap, overlaps.indigenous_overlap],
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
}

