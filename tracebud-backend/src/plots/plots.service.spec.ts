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
  runHistoricalDeforestationQuery: jest.fn(),
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
    ).rejects.toThrow('GEO-102');
  });

  it('rejects polygon with GEO-101 when normalization returns null geometry', async () => {
    const pool = makePoolMock([
      { rows: [] }, // ensureFarmerProfileForPlot existing check
      { rows: [] }, // user_account upsert
      { rows: [] }, // farmer_profile insert
      { rows: [] }, // main insert/select CTE returns nothing
      { rows: [{ correction_variance_pct: null }] }, // variance probe indicates no valid normalized geometry
    ]);
    const service = new PlotsService(pool as any, gfwMock as any);

    await expect(
      service.create(makePolygonDto(), '33333333-3333-3333-3333-333333333333'),
    ).rejects.toThrow('GEO-101');
  });
});

describe('PlotsService.updateGeometry polygon normalization', () => {
  const updateDto = {
    reason: 'boundary correction',
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
  };

  it('rejects with GEO-102 when geometry correction variance is > 5%', async () => {
    const pool = makePoolMock([
      {
        rows: [{ id: 'plot_1', kind: 'polygon', geometry_geojson: '{"type":"Polygon","coordinates":[]}' }],
      }, // existing plot
      { rows: [] }, // update CTE returns nothing
      { rows: [{ correction_variance_pct: 8.12 }] }, // variance probe
    ]);
    const service = new PlotsService(pool as any, gfwMock as any);

    await expect(service.updateGeometry('plot_1', updateDto as any, 'user_1')).rejects.toThrow(
      'GEO-102',
    );
  });

  it('rejects with GEO-101 when normalization cannot produce polygon geometry', async () => {
    const pool = makePoolMock([
      {
        rows: [{ id: 'plot_1', kind: 'polygon', geometry_geojson: '{"type":"Polygon","coordinates":[]}' }],
      }, // existing plot
      { rows: [] }, // update CTE returns nothing
      { rows: [{ correction_variance_pct: null }] }, // normalization failed
    ]);
    const service = new PlotsService(pool as any, gfwMock as any);

    await expect(service.updateGeometry('plot_1', updateDto as any, 'user_1')).rejects.toThrow(
      'GEO-101',
    );
  });
});

describe('PlotsService.isAgentAssignedToPlot', () => {
  it('fails closed when assignment relation is unavailable', async () => {
    const pool = {
      query: jest.fn(async () => {
        const error = new Error('relation does not exist') as any;
        error.code = '42P01';
        throw error;
      }),
    };
    const service = new PlotsService(pool as any, gfwMock as any);

    await expect(service.isAgentAssignedToPlot('plot_1', 'agent_1', 'assign_1')).resolves.toBe(false);
  });

  it('returns true when active assignment exists for plot and agent', async () => {
    const pool = makePoolMock([{ rows: [{}] }]);
    const service = new PlotsService(pool as any, gfwMock as any);

    await expect(service.isAgentAssignedToPlot('plot_1', 'agent_1', 'assign_1')).resolves.toBe(true);
  });
});

describe('PlotsService assignment lifecycle transitions', () => {
  it('creates assignment row and maps response fields', async () => {
    const pool = makePoolMock([
      {
        rows: [
          {
            assignmentId: 'assign_1',
            plotId: 'plot_1',
            agentUserId: 'agent_1',
            status: 'active',
            assignedAt: '2026-01-01T00:00:00.000Z',
            endedAt: null,
          },
        ],
      },
    ]);
    const service = new PlotsService(pool as any, gfwMock as any);

    await expect(service.createAssignment('plot_1', 'assign_1', 'agent_1')).resolves.toEqual(
      expect.objectContaining({ assignmentId: 'assign_1', status: 'active' }),
    );
  });

  it('returns ASN-003 for invalid transition when assignment already completed', async () => {
    const pool = makePoolMock([
      { rows: [] }, // update no-op
      { rows: [{ status: 'completed' }] }, // existing assignment status probe
    ]);
    const service = new PlotsService(pool as any, gfwMock as any);

    await expect(service.completeAssignment('assign_1')).rejects.toThrow('ASN-003');
  });
});

describe('PlotsService.listAssignmentsByPlot', () => {
  it('returns paged envelope with filter metadata and totals', async () => {
    const pool = makePoolMock([
      { rows: [{ total: 3 }] },
      {
        rows: [
          {
            assignmentId: 'assign_1',
            plotId: 'plot_1',
            agentUserId: 'agent_1',
            status: 'active',
            assignedAt: '2026-01-01T00:00:00.000Z',
            endedAt: null,
          },
        ],
      },
    ]);
    const service = new PlotsService(pool as any, gfwMock as any);

    await expect(
      service.listAssignmentsByPlot('plot_1', {
        status: 'active',
        fromDays: 14,
        agentUserId: 'agent_1',
        limit: 10,
        offset: 0,
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        total: 3,
        status: 'active',
        fromDays: 14,
        agentUserId: 'agent_1',
        limit: 10,
        offset: 0,
        items: [expect.objectContaining({ assignmentId: 'assign_1' })],
      }),
    );
  });
});

describe('PlotsService.appendAssignmentExportAuditEvent', () => {
  it('persists assignment export payload fields aligned with diagnostics contract', async () => {
    const pool = makePoolMock([{ rows: [] }]);
    const service = new PlotsService(pool as any, gfwMock as any);

    await service.appendAssignmentExportAuditEvent({
      phase: 'succeeded',
      plotId: 'plot_1',
      userId: 'user_1',
      tenantId: 'tenant_1',
      exportedBy: 'ops@tracebud.test',
      rowCount: 17,
      filters: {
        status: 'active',
        fromDays: 14,
        agentUserId: 'agent_1',
      },
      error: null,
    });

    expect(pool.query).toHaveBeenCalledTimes(1);
    const [, params] = (pool.query as jest.Mock).mock.calls[0];
    expect(params[0]).toBe('user_1');
    expect(params[1]).toBe('plot_assignment_export_succeeded');
    expect(JSON.parse(params[2] as string)).toEqual({
      plotId: 'plot_1',
      tenantId: 'tenant_1',
      exportedBy: 'ops@tracebud.test',
      rowCount: 17,
      status: 'active',
      fromDays: 14,
      agentUserId: 'agent_1',
      error: null,
    });
  });

  it('normalizes optional assignment export payload fields to null when omitted', async () => {
    const pool = makePoolMock([{ rows: [] }]);
    const service = new PlotsService(pool as any, gfwMock as any);

    await service.appendAssignmentExportAuditEvent({
      phase: 'failed',
      plotId: 'plot_2',
      filters: {
        status: 'cancelled',
        fromDays: 30,
        agentUserId: null,
      },
    });

    const [, params] = (pool.query as jest.Mock).mock.calls[0];
    expect(params[0]).toBeNull();
    expect(params[1]).toBe('plot_assignment_export_failed');
    expect(JSON.parse(params[2] as string)).toEqual({
      plotId: 'plot_2',
      tenantId: null,
      exportedBy: null,
      rowCount: null,
      status: 'cancelled',
      fromDays: 30,
      agentUserId: null,
      error: null,
    });
  });
});

describe('PlotsService.getGeometryHistory mapping', () => {
  it('maps known geometry event types and normalizes timestamp fields', async () => {
    const pool = makePoolMock([
      { rows: [{ total: 2 }] },
      {
        rows: [
          {
            id: 'evt_1',
            timestamp: new Date('2026-04-16T10:00:00.000Z'),
            user_id: 'user_1',
            device_id: null,
            event_type: 'plot_geometry_superseded',
            payload: { plotId: 'plot_1', reason: 'boundary fix' },
          },
          {
            id: 'evt_2',
            timestamp: '2026-04-16T09:00:00.000Z',
            user_id: null,
            device_id: 'device_1',
            event_type: 'plot_created',
            payload: { plotId: 'plot_1' },
          },
        ],
      },
    ]);
    const service = new PlotsService(pool as any, gfwMock as any);

    const result = await service.getGeometryHistory('plot_1');

    expect(result.total).toBe(2);
    expect(result.limit).toBe(100);
    expect(result.offset).toBe(0);
    expect(result.sort).toBe('desc');
    expect(result.anomalyProfile).toBe('balanced');
    expect(result.anomalies).toEqual([]);
    expect(result.anomalySummary).toEqual({
      total: 0,
      highSeverity: 0,
      mediumSeverity: 0,
      byType: {
        largeRevisionJump: 0,
        frequentSupersession: 0,
      },
    });
    expect(result.items).toHaveLength(2);
    expect(result.items[0]).toMatchObject({
      id: 'evt_1',
      timestamp: '2026-04-16T10:00:00.000Z',
      userId: 'user_1',
      deviceId: null,
      eventType: 'plot_geometry_superseded',
      payload: { plotId: 'plot_1' },
    });
    expect(result.items[1]).toMatchObject({
      id: 'evt_2',
      timestamp: '2026-04-16T09:00:00.000Z',
      userId: null,
      deviceId: 'device_1',
      eventType: 'plot_created',
      payload: { plotId: 'plot_1' },
    });
  });

  it('coerces unknown event types to plot_created for stable contract output', async () => {
    const pool = makePoolMock([
      { rows: [{ total: 1 }] },
      {
        rows: [
          {
            id: 'evt_3',
            timestamp: '2026-04-16T08:00:00.000Z',
            user_id: 'user_2',
            device_id: null,
            event_type: 'unexpected_event',
            payload: { plotId: 'plot_1' },
          },
        ],
      },
    ]);
    const service = new PlotsService(pool as any, gfwMock as any);

    const result = await service.getGeometryHistory('plot_1');

    expect(result.items[0]?.eventType).toBe('plot_created');
  });

  it('falls back plotId and payload details when row payload is missing/invalid', async () => {
    const pool = makePoolMock([
      { rows: [{ total: 1 }] },
      {
        rows: [
          {
            id: 'evt_4',
            timestamp: '2026-04-16T07:00:00.000Z',
            user_id: null,
            device_id: null,
            event_type: 'plot_created',
            payload: null,
          },
        ],
      },
    ]);
    const service = new PlotsService(pool as any, gfwMock as any);

    const result = await service.getGeometryHistory('plot_fallback');

    expect(result.items[0]?.payload.plotId).toBe('plot_fallback');
    expect(result.items[0]?.payload.details).toEqual({});
  });

  it('supports explicit ascending sort direction', async () => {
    const pool = makePoolMock([
      { rows: [{ total: 1 }] },
      {
        rows: [
          {
            id: 'evt_5',
            timestamp: '2026-04-16T06:00:00.000Z',
            user_id: null,
            device_id: null,
            event_type: 'plot_created',
            payload: { plotId: 'plot_1' },
          },
        ],
      },
    ]);
    const service = new PlotsService(pool as any, gfwMock as any);

    const result = await service.getGeometryHistory('plot_1', 10, 0, 'asc');

    expect(result.sort).toBe('asc');
    expect(result.anomalyProfile).toBe('balanced');
    expect(result.items).toHaveLength(1);
    expect((pool.query as jest.Mock).mock.calls[1][0]).toContain('ORDER BY timestamp ASC');
  });

  it('computes anomaly metadata for large revision jumps and frequent supersessions', async () => {
    const pool = makePoolMock([
      { rows: [{ total: 2 }] },
      {
        rows: [
          {
            id: 'evt_9',
            timestamp: '2026-04-16T10:30:00.000Z',
            user_id: 'user_1',
            device_id: null,
            event_type: 'plot_geometry_superseded',
            payload: {
              plotId: 'plot_1',
              geometryNormalization: { correctionVariancePct: 4.2 },
            },
          },
          {
            id: 'evt_10',
            timestamp: '2026-04-16T09:45:00.000Z',
            user_id: 'user_1',
            device_id: null,
            event_type: 'plot_geometry_superseded',
            payload: { plotId: 'plot_1' },
          },
        ],
      },
    ]);
    const service = new PlotsService(pool as any, gfwMock as any);

    const result = await service.getGeometryHistory('plot_1', 20, 0, 'desc');

    expect(result.anomalies).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          eventId: 'evt_9',
          type: 'large_revision_jump',
          severity: 'high',
        }),
        expect.objectContaining({
          eventId: 'evt_10',
          type: 'frequent_supersession',
        }),
      ]),
    );
    expect(result.anomalySummary.total).toBe(result.anomalies.length);
    expect(result.anomalySummary.byType.largeRevisionJump).toBeGreaterThanOrEqual(1);
  });

  it('supports strict vs lenient anomaly sensitivity profiles', async () => {
    const rows = [
      {
        id: 'evt_11',
        timestamp: '2026-04-16T10:40:00.000Z',
        user_id: 'user_1',
        device_id: null,
        event_type: 'plot_geometry_superseded',
        payload: {
          plotId: 'plot_1',
          geometryNormalization: { correctionVariancePct: 2.2 },
        },
      },
      {
        id: 'evt_12',
        timestamp: '2026-04-16T09:00:00.000Z',
        user_id: 'user_1',
        device_id: null,
        event_type: 'plot_geometry_superseded',
        payload: { plotId: 'plot_1' },
      },
    ];
    const strictPool = makePoolMock([{ rows: [{ total: 2 }] }, { rows }]);
    const lenientPool = makePoolMock([{ rows: [{ total: 2 }] }, { rows }]);

    const strictService = new PlotsService(strictPool as any, gfwMock as any);
    const lenientService = new PlotsService(lenientPool as any, gfwMock as any);

    const strict = await strictService.getGeometryHistory('plot_1', 20, 0, 'desc', 'strict');
    const lenient = await lenientService.getGeometryHistory('plot_1', 20, 0, 'desc', 'lenient');

    expect(strict.anomalyProfile).toBe('strict');
    expect(strict.anomalies.some((item) => item.type === 'large_revision_jump')).toBe(true);
    expect(strict.anomalies.some((item) => item.type === 'frequent_supersession')).toBe(true);

    expect(lenient.anomalyProfile).toBe('lenient');
    expect(lenient.anomalies.some((item) => item.type === 'large_revision_jump')).toBe(false);
    expect(lenient.anomalies.some((item) => item.type === 'frequent_supersession')).toBe(false);
  });

  it('supports signalsOnly pagination over anomaly-flagged events', async () => {
    const rows = [
      {
        id: 'evt_a',
        timestamp: '2026-04-16T10:50:00.000Z',
        user_id: 'user_1',
        device_id: null,
        event_type: 'plot_geometry_superseded',
        payload: { plotId: 'plot_1', geometryNormalization: { correctionVariancePct: 4.2 } },
      },
      {
        id: 'evt_b',
        timestamp: '2026-04-16T10:20:00.000Z',
        user_id: 'user_1',
        device_id: null,
        event_type: 'plot_created',
        payload: { plotId: 'plot_1' },
      },
      {
        id: 'evt_c',
        timestamp: '2026-04-16T09:10:00.000Z',
        user_id: 'user_1',
        device_id: null,
        event_type: 'plot_geometry_superseded',
        payload: { plotId: 'plot_1' },
      },
    ];
    const pool = makePoolMock([{ rows }]);
    const service = new PlotsService(pool as any, gfwMock as any);

    const result = await service.getGeometryHistory('plot_1', 1, 1, 'desc', 'balanced', true);

    expect(result.signalsOnly).toBe(true);
    expect(result.total).toBe(2);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.id).toBe('evt_c');
    expect(result.anomalySummary.total).toBe(2);
    expect(result.anomalySummary.byType.largeRevisionJump).toBe(1);
    expect(result.anomalySummary.byType.frequentSupersession).toBe(1);
    expect((pool.query as jest.Mock).mock.calls[0][0]).toContain('ORDER BY timestamp DESC');
  });
});

describe('PlotsService.runDeforestationDecision', () => {
  beforeEach(() => {
    gfwMock.runHistoricalDeforestationQuery.mockReset();
    gfwMock.runRaddFallback.mockReset();
  });

  it('returns no_deforestation_detected verdict when alert count is zero', async () => {
    const pool = makePoolMock([
      {
        rows: [{ id: 'plot_1', kind: 'polygon', geojson: '{"type":"Polygon","coordinates":[]}' }],
      },
      { rows: [] },
    ]);
    const service = new PlotsService(pool as any, gfwMock as any);
    gfwMock.runHistoricalDeforestationQuery.mockResolvedValue({
      dataset: 'umd_glad_s2_alerts',
      version: 'latest',
      historicalSqlApplied: true,
      result: [{ count: 0, area_ha: 0 }],
    });
    gfwMock.runRaddFallback.mockReset();

    const result = await service.runDeforestationDecision('plot_1', 'user_1', '2020-12-31');

    expect(gfwMock.runHistoricalDeforestationQuery).toHaveBeenCalledWith(
      expect.objectContaining({ cutoffDate: '2020-12-31' }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        plotId: 'plot_1',
        cutoffDate: '2020-12-31',
        verdict: 'no_deforestation_detected',
        historicalSqlApplied: true,
      }),
    );
    expect(result.summary).toEqual({ alertCount: 0, alertAreaHa: 0 });
    expect(gfwMock.runRaddFallback).not.toHaveBeenCalled();
  });

  it('falls back to RADD and returns unknown when primary result is unparsable', async () => {
    const pool = makePoolMock([
      {
        rows: [{ id: 'plot_1', kind: 'polygon', geojson: '{"type":"Polygon","coordinates":[]}' }],
      },
      { rows: [] },
    ]);
    const service = new PlotsService(pool as any, gfwMock as any);
    gfwMock.runHistoricalDeforestationQuery.mockResolvedValue({
      dataset: 'umd_glad_s2_alerts',
      version: 'latest',
      historicalSqlApplied: true,
      result: [{ note: 'missing fields' }],
    });
    gfwMock.runRaddFallback.mockResolvedValue({
      dataset: 'radd_alerts',
      version: 'latest',
      result: [{ note: 'still missing fields' }],
    });

    const result = await service.runDeforestationDecision('plot_1', 'user_1', '2020-12-31');

    expect(gfwMock.runRaddFallback).toHaveBeenCalledTimes(1);
    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        verdict: 'unknown',
        usedFallback: true,
      }),
    );
    expect(result.providerMode).toBe('radd_fallback');
  });

  it('rejects malformed cutoff date', async () => {
    const pool = makePoolMock([]);
    const service = new PlotsService(pool as any, gfwMock as any);

    await expect(service.runDeforestationDecision('plot_1', 'user_1', '31-12-2020')).rejects.toThrow(
      'Invalid cutoffDate. Use YYYY-MM-DD.',
    );
  });
});
