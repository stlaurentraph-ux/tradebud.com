import { BadRequestException } from '@nestjs/common';
import { PlotsService } from './plots.service';
import type { CreatePlotDto } from './dto/create-plot.dto';

type QueryResult = { rowCount?: number; rows?: any[] };

function makePoolMock(results: QueryResult[]): { query: jest.Mock; calls: any[] } {
  const queue = [...results];
  const calls: any[] = [];
  return {
    calls,
    query: jest.fn(async (...args: any[]) => {
      calls.push(args);
      if (queue.length === 0) return { rowCount: 0, rows: [] };
      const next = queue.shift()!;
      return {
        rowCount: next.rowCount ?? (next.rows ? next.rows.length : 0),
        rows: next.rows ?? [],
      };
    }),
  };
}

const gfwMock = {
  runGeometryQuery: jest.fn(),
  runRaddFallback: jest.fn(),
};

function makePolygonDto(): CreatePlotDto {
  return {
    farmerId: '11111111-1111-1111-1111-111111111111',
    clientPlotId: 'local-plot-1',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [-86.1, 14.1],
          [-86.2, 14.1],
          [-86.2, 14.2],
          [-86.1, 14.2],
          [-86.1, 14.1],
        ],
      ],
    },
    declaredAreaHa: 1.0,
  } as CreatePlotDto;
}

describe('PlotsService.create polygon normalization', () => {
  it('accepts polygon when correction variance is <= 5%', async () => {
    const pool = makePoolMock([
      { rows: [] }, // ensureFarmerProfileForPlot existing check
      { rows: [] }, // user_account upsert
      { rows: [] }, // farmer_profile insert
      {
        rows: [
          {
            id: '22222222-2222-2222-2222-222222222222',
            area_ha: 1.0,
            original_area_ha: 1.0,
            normalized_area_ha: 1.03,
            correction_variance_pct: 3.0,
          },
        ],
      }, // main insert/select CTE
      { rows: [] }, // audit insert
    ]);
    const service = new PlotsService(pool as any, gfwMock as any);

    const row = await service.create(makePolygonDto(), '33333333-3333-3333-3333-333333333333');
    expect(row).toBeTruthy();
    expect((pool.query as jest.Mock).mock.calls.length).toBeGreaterThanOrEqual(5);
  });

  it('rejects polygon when correction variance is > 5%', async () => {
    const pool = makePoolMock([
      { rows: [] }, // ensureFarmerProfileForPlot existing check
      { rows: [] }, // user_account upsert
      { rows: [] }, // farmer_profile insert
      { rows: [] }, // main insert/select CTE returns nothing
      { rows: [{ correction_variance_pct: 12.34 }] }, // variance probe
    ]);
    const service = new PlotsService(pool as any, gfwMock as any);

    await expect(
      service.create(makePolygonDto(), '33333333-3333-3333-3333-333333333333'),
    ).rejects.toThrow(BadRequestException);
  });
});
