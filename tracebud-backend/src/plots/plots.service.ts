import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../db/db.module';
import { plotKindEnum } from '../db/schema';
import { CreatePlotDto } from './dto/create-plot.dto';

@Injectable()
export class PlotsService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async create(createDto: CreatePlotDto, userId: string | undefined) {
    const { geometry, declaredAreaHa, precisionMeters, hdop, farmerId, clientPlotId } =
      createDto;

    // Simple validation: ensure 6 decimal places for coords
    const ensureSixDecimals = (value: number) => Number(value.toFixed(6));

    let geometrySql: string;
    let kind: (typeof plotKindEnum.enumValues)[number];

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
      geometrySql = `ST_SetSRID(ST_Polygon(ST_GeomFromText('LINESTRING(${coordText})')), 4326)`;
      kind = 'polygon';
    } else {
      throw new BadRequestException('Unsupported geometry type');
    }

    // Insert using raw SQL to leverage PostGIS functions for area and centroid.
    const text = `
      WITH ins AS (
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
        VALUES (
          $1,
          $2,
          ST_SnapToGrid(${geometrySql}, 1e-6),
          ST_Centroid(ST_SnapToGrid(${geometrySql}, 1e-6)),
          $3,
          ST_Area(ST_SnapToGrid(${geometrySql}, 1e-6)::geography) / 10000.0,
          $4,
          $5,
          $6
        )
        RETURNING *
      )
      SELECT * FROM ins;
    `;

    const result = await this.pool.query(text, [
      farmerId,
      clientPlotId,
      kind,
      declaredAreaHa ?? null,
      precisionMeters ?? null,
      hdop ?? null,
    ]);

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
        }),
      ],
    );

    return row;
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
}

