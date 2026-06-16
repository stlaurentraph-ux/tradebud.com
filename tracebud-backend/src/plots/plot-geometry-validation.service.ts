import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../db/db.module';
import {
  buildPolygonQualityIssues,
  type GeometryQualityIssue,
  type GeometryQualityMetrics,
  polygonCompactness,
} from './plot-geometry-quality';

export type PolygonGeometryValidationResult = {
  ok: boolean;
  issues: GeometryQualityIssue[];
  metrics: GeometryQualityMetrics;
};

@Injectable()
export class PlotGeometryValidationService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async validatePolygonCandidate(params: {
    geometrySql: string;
    farmerId: string;
    excludePlotId?: string;
  }): Promise<PolygonGeometryValidationResult> {
    const overlapQuery = await this.queryPolygonQuality(params);
    const metrics: GeometryQualityMetrics = {
      areaHa: overlapQuery.metrics.area_ha,
      perimeterM: overlapQuery.metrics.perimeter_m,
      vertexCount: overlapQuery.metrics.vertex_count,
      isSimple: overlapQuery.metrics.is_simple,
      compactness: polygonCompactness(
        overlapQuery.metrics.area_ha ?? NaN,
        overlapQuery.metrics.perimeter_m ?? NaN,
      ),
    };

    const issues = buildPolygonQualityIssues({
      metrics,
      overlaps: overlapQuery.overlaps,
    });

    return {
      ok: !issues.some((issue) => issue.severity === 'error'),
      issues,
      metrics,
    };
  }

  async assertPolygonCandidateAllowed(params: {
    geometrySql: string;
    farmerId: string;
    excludePlotId?: string;
  }): Promise<PolygonGeometryValidationResult> {
    const result = await this.validatePolygonCandidate(params);
    const blocking = result.issues.find((issue) => issue.severity === 'error');
    if (blocking) {
      throw new BadRequestException({
        statusCode: 400,
        code: blocking.code,
        message: blocking.message,
        details: blocking.details ?? null,
      });
    }
    return result;
  }

  private async queryPolygonQuality(params: {
    geometrySql: string;
    farmerId: string;
    excludePlotId?: string;
  }): Promise<{
    metrics: {
      is_simple: boolean | null;
      vertex_count: number | null;
      perimeter_m: number | null;
      area_ha: number | null;
    };
    overlaps: Array<{
      plotId: string;
      plotName: string;
      farmerId: string;
      overlapHa: number;
      smallerAreaHa: number;
    }>;
  }> {
    const text = `
      WITH candidate AS (
        SELECT ST_SnapToGrid(${params.geometrySql}, 1e-6) AS geom
      ),
      metrics AS (
        SELECT
          geom,
          ST_IsSimple(geom) AS is_simple,
          ST_NPoints(geom) AS vertex_count,
          ST_Perimeter(geom::geography) AS perimeter_m,
          (ST_Area(geom::geography) / 10000.0)::float8 AS area_ha
        FROM candidate
      ),
      farmer_scope AS (
        SELECT $1::uuid AS farmer_id
        UNION
        SELECT fp2.id
        FROM farmer_profile fp
        JOIN tenant_signup_contacts tsc ON tsc.user_id = fp.user_id::text
        JOIN tenant_signup_contacts tsc2 ON tsc2.tenant_id = tsc.tenant_id
        JOIN farmer_profile fp2 ON fp2.user_id::text = tsc2.user_id
        WHERE fp.id = $1::uuid
          AND fp2.id <> $1::uuid
      ),
      overlap_candidates AS (
        SELECT
          p.id::text AS plot_id,
          p.name AS plot_name,
          p.farmer_id::text AS farmer_id,
          (ST_Area(ST_Intersection(m.geom::geography, p.geography)) / 10000.0)::float8 AS overlap_ha,
          LEAST(m.area_ha, p.area_ha::float8) AS smaller_area_ha
        FROM metrics m
        JOIN plot p ON p.geography IS NOT NULL
        WHERE p.farmer_id IN (SELECT farmer_id FROM farmer_scope)
          AND ($2::uuid IS NULL OR p.id <> $2::uuid)
          AND ST_Intersects(m.geom, p.geometry)
          AND ST_Area(ST_Intersection(m.geom::geography, p.geography)) > 0
      )
      SELECT
        'metrics' AS row_kind,
        m.is_simple,
        m.vertex_count,
        m.perimeter_m,
        m.area_ha,
        NULL::text AS plot_id,
        NULL::text AS plot_name,
        NULL::text AS farmer_id,
        NULL::float8 AS overlap_ha,
        NULL::float8 AS smaller_area_ha
      FROM metrics m
      UNION ALL
      SELECT
        'overlap' AS row_kind,
        NULL,
        NULL,
        NULL,
        NULL,
        o.plot_id,
        o.plot_name,
        o.farmer_id,
        o.overlap_ha,
        o.smaller_area_ha
      FROM overlap_candidates o
    `;

    try {
      const res = await this.pool.query(text, [params.farmerId, params.excludePlotId ?? null]);
      const metricRow = res.rows.find((row) => row.row_kind === 'metrics') ?? res.rows[0];
      const overlaps = res.rows
        .filter((row) => row.row_kind === 'overlap')
        .map((row) => ({
          plotId: String(row.plot_id),
          plotName: String(row.plot_name ?? 'Plot'),
          farmerId: String(row.farmer_id),
          overlapHa: Number(row.overlap_ha),
          smallerAreaHa: Number(row.smaller_area_ha),
        }))
        .filter((row) => Number.isFinite(row.overlapHa) && row.overlapHa > 0);

      return {
        metrics: {
          is_simple: metricRow?.is_simple ?? null,
          vertex_count:
            metricRow?.vertex_count != null ? Number(metricRow.vertex_count) : null,
          perimeter_m: metricRow?.perimeter_m != null ? Number(metricRow.perimeter_m) : null,
          area_ha: metricRow?.area_ha != null ? Number(metricRow.area_ha) : null,
        },
        overlaps,
      };
    } catch (error) {
      const code = (error as { code?: string } | null)?.code;
      if (code === '42P01') {
        return this.queryPolygonQualitySameFarmerOnly(params);
      }
      throw error;
    }
  }

  private async queryPolygonQualitySameFarmerOnly(params: {
    geometrySql: string;
    farmerId: string;
    excludePlotId?: string;
  }) {
    const text = `
      WITH candidate AS (
        SELECT ST_SnapToGrid(${params.geometrySql}, 1e-6) AS geom
      ),
      metrics AS (
        SELECT
          geom,
          ST_IsSimple(geom) AS is_simple,
          ST_NPoints(geom) AS vertex_count,
          ST_Perimeter(geom::geography) AS perimeter_m,
          (ST_Area(geom::geography) / 10000.0)::float8 AS area_ha
        FROM candidate
      ),
      overlap_candidates AS (
        SELECT
          p.id::text AS plot_id,
          p.name AS plot_name,
          p.farmer_id::text AS farmer_id,
          (ST_Area(ST_Intersection(m.geom::geography, p.geography)) / 10000.0)::float8 AS overlap_ha,
          LEAST(m.area_ha, p.area_ha::float8) AS smaller_area_ha
        FROM metrics m
        JOIN plot p ON p.geography IS NOT NULL
        WHERE p.farmer_id = $1::uuid
          AND ($2::uuid IS NULL OR p.id <> $2::uuid)
          AND ST_Intersects(m.geom, p.geometry)
          AND ST_Area(ST_Intersection(m.geom::geography, p.geography)) > 0
      )
      SELECT
        'metrics' AS row_kind,
        m.is_simple,
        m.vertex_count,
        m.perimeter_m,
        m.area_ha,
        NULL::text AS plot_id,
        NULL::text AS plot_name,
        NULL::text AS farmer_id,
        NULL::float8 AS overlap_ha,
        NULL::float8 AS smaller_area_ha
      FROM metrics m
      UNION ALL
      SELECT
        'overlap' AS row_kind,
        NULL,
        NULL,
        NULL,
        NULL,
        o.plot_id,
        o.plot_name,
        o.farmer_id,
        o.overlap_ha,
        o.smaller_area_ha
      FROM overlap_candidates o
    `;
    const res = await this.pool.query(text, [params.farmerId, params.excludePlotId ?? null]);
    const metricRow = res.rows.find((row) => row.row_kind === 'metrics') ?? res.rows[0];
    return {
      metrics: {
        is_simple: metricRow?.is_simple ?? null,
        vertex_count: metricRow?.vertex_count != null ? Number(metricRow.vertex_count) : null,
        perimeter_m: metricRow?.perimeter_m != null ? Number(metricRow.perimeter_m) : null,
        area_ha: metricRow?.area_ha != null ? Number(metricRow.area_ha) : null,
      },
      overlaps: res.rows
        .filter((row) => row.row_kind === 'overlap')
        .map((row) => ({
          plotId: String(row.plot_id),
          plotName: String(row.plot_name ?? 'Plot'),
          farmerId: String(row.farmer_id),
          overlapHa: Number(row.overlap_ha),
          smallerAreaHa: Number(row.smaller_area_ha),
        }))
        .filter((row) => Number.isFinite(row.overlapHa) && row.overlapHa > 0),
    };
  }
}
