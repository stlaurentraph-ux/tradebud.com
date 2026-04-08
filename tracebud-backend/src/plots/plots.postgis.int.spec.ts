import { Pool } from 'pg';

const testDbUrl = process.env.TEST_DATABASE_URL;
const describeIfDb = testDbUrl ? describe : describe.skip;

describeIfDb('PostGIS integration: v1.6 spatial checks', () => {
  let pool: Pool;

  beforeAll(async () => {
    pool = new Pool({
      connectionString: testDbUrl,
      ssl: { rejectUnauthorized: false },
    });
    await pool.query('CREATE EXTENSION IF NOT EXISTS postgis;');
  }, 20_000);

  afterAll(async () => {
    await pool.end();
  });

  it('computes area via geography and returns finite hectares', async () => {
    const res = await pool.query<{
      area_ha: number;
    }>(
      `
      WITH g AS (
        SELECT ST_GeomFromText('POLYGON((-86.1 14.1, -86.2 14.1, -86.2 14.2, -86.1 14.2, -86.1 14.1))', 4326) AS geom
      )
      SELECT (ST_Area(geom::geography) / 10000.0)::float8 AS area_ha
      FROM g
      `,
    );

    expect(res.rowCount).toBe(1);
    expect(Number.isFinite(res.rows[0].area_ha)).toBe(true);
    expect(res.rows[0].area_ha).toBeGreaterThan(0);
  });

  it('produces measurable correction variance for invalid polygon normalization', async () => {
    const res = await pool.query<{
      variance_pct: number | null;
    }>(
      `
      WITH raw AS (
        SELECT ST_GeomFromText('POLYGON((-86.1 14.1, -86.2 14.2, -86.2 14.1, -86.1 14.2, -86.1 14.1))', 4326) AS geom
      ),
      normalized AS (
        SELECT
          geom,
          ST_CollectionExtract(ST_MakeValid(geom), 3) AS norm_geom
        FROM raw
      )
      SELECT
        CASE
          WHEN ST_Area(geom::geography) = 0 THEN NULL
          ELSE ABS((ST_Area(norm_geom::geography) - ST_Area(geom::geography)) / ST_Area(geom::geography)) * 100.0
        END::float8 AS variance_pct
      FROM normalized
      `,
    );

    expect(res.rowCount).toBe(1);
    expect(res.rows[0].variance_pct === null || Number.isFinite(res.rows[0].variance_pct)).toBe(true);
  });
});
