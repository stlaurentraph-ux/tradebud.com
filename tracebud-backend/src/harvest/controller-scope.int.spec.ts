import { ForbiddenException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Pool } from 'pg';
import { HarvestController } from './harvest.controller';
import { HarvestService } from './harvest.service';
import { PlotsController } from '../plots/plots.controller';
import { PlotsService } from '../plots/plots.service';

const testDbUrl = process.env.TEST_DATABASE_URL;
const describeIfDb = testDbUrl ? describe : describe.skip;
const schema = `tb_controller_scope_test_${process.pid}_${Date.now().toString(36)}`;

function withSearchPath(connectionString: string, _targetSchema: string) {
  return connectionString;
}

describeIfDb('Controller scope integration: farmer ownership enforcement', () => {
  let pool: Pool;
  let harvestService: HarvestService;
  let plotsService: PlotsService;
  let harvestController: HarvestController;
  let plotsController: PlotsController;

  const userA = '11111111-1111-4111-8111-111111111111';
  const userB = '22222222-2222-4222-8222-222222222222';
  const farmerA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const farmerB = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  const plotA = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

  beforeAll(async () => {
    pool = new Pool({
      connectionString: withSearchPath(testDbUrl!, schema),
      ssl: { rejectUnauthorized: false },
      max: 1,
    });

    await pool.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    await pool.query(`CREATE SCHEMA IF NOT EXISTS ${schema}`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS ${schema}.user_account (
        id UUID PRIMARY KEY,
        role TEXT NOT NULL,
        name TEXT NULL
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ${schema}.farmer_profile (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES ${schema}.user_account(id),
        country_code TEXT NOT NULL DEFAULT 'HN',
        self_declared BOOLEAN NOT NULL DEFAULT true,
        status TEXT NOT NULL DEFAULT 'active'
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ${schema}.plot (
        id UUID PRIMARY KEY,
        farmer_id UUID NOT NULL REFERENCES ${schema}.farmer_profile(id),
        name TEXT NOT NULL DEFAULT 'Test plot'
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ${schema}.agent_plot_assignment (
        assignment_id TEXT PRIMARY KEY,
        agent_user_id UUID NOT NULL REFERENCES ${schema}.user_account(id),
        plot_id UUID NOT NULL REFERENCES ${schema}.plot(id),
        status TEXT NOT NULL DEFAULT 'active',
        assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        ended_at TIMESTAMPTZ NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pool.query(`ALTER TABLE ${schema}.agent_plot_assignment ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`);
    await pool.query(`ALTER TABLE ${schema}.agent_plot_assignment ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ NULL`);
    await pool.query(`ALTER TABLE ${schema}.agent_plot_assignment ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`);
    await pool.query(`ALTER TABLE ${schema}.agent_plot_assignment ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ${schema}.audit_log (
        id UUID PRIMARY KEY,
        timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        user_id UUID NULL,
        device_id TEXT NULL,
        event_type TEXT NOT NULL,
        payload JSONB NOT NULL DEFAULT '{}'::jsonb
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ${schema}.dds_package (
        id UUID PRIMARY KEY,
        farmer_id UUID NOT NULL REFERENCES ${schema}.farmer_profile(id),
        label TEXT NULL,
        status TEXT NOT NULL DEFAULT 'draft',
        traces_reference TEXT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    harvestService = new HarvestService(pool);
    plotsService = new PlotsService(pool, {} as any);
    harvestController = new HarvestController(harvestService);
    plotsController = new PlotsController(plotsService);
  }, 20_000);

  afterAll(async () => {
    await pool.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    await pool.end();
  });

  beforeEach(async () => {
    await pool.query(`SET search_path TO ${schema},public`);
    await pool.query(`CREATE TABLE IF NOT EXISTS ${schema}.agent_plot_assignment (
      assignment_id TEXT PRIMARY KEY,
      agent_user_id UUID NOT NULL REFERENCES ${schema}.user_account(id),
      plot_id UUID NOT NULL REFERENCES ${schema}.plot(id),
      status TEXT NOT NULL DEFAULT 'active',
      assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      ended_at TIMESTAMPTZ NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);
    await pool.query(`DELETE FROM ${schema}.dds_package`);
    await pool.query(`DELETE FROM ${schema}.agent_plot_assignment`);
    await pool.query(`DELETE FROM ${schema}.plot`);
    await pool.query(`DELETE FROM ${schema}.audit_log`);
    await pool.query(`DELETE FROM ${schema}.farmer_profile`);
    await pool.query(`DELETE FROM ${schema}.user_account`);

    await pool.query(
      `INSERT INTO ${schema}.user_account (id, role, name) VALUES ($1, 'farmer', 'A'), ($2, 'farmer', 'B')`,
      [userA, userB],
    );
    await pool.query(
      `INSERT INTO ${schema}.farmer_profile (id, user_id, country_code, self_declared, status)
       VALUES ($1, $2, 'HN', true, 'active'), ($3, $4, 'HN', true, 'active')`,
      [farmerA, userA, farmerB, userB],
    );
    await pool.query(`INSERT INTO ${schema}.plot (id, farmer_id, name) VALUES ($1, $2, 'Plot A')`, [plotA, farmerA]);
    await pool.query(
      `INSERT INTO ${schema}.agent_plot_assignment (assignment_id, agent_user_id, plot_id, status) VALUES ($1, $2, $3, 'active')`,
      ['assign_agent_plot_a', userB, plotA],
    );
  });

  it('denies farmer voucher list for non-owned farmerId and allows own scope', async () => {
    const listSpy = jest.spyOn(harvestService, 'listVouchersForFarmer').mockResolvedValue([]);

    await expect(
      harvestController.listVouchers(farmerB, {
        user: { id: userA, email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1' } },
      }),
    ).rejects.toThrow(ForbiddenException);

    await expect(
      harvestController.listVouchers(farmerA, {
        user: { id: userA, email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1' } },
      }),
    ).resolves.toEqual([]);

    expect(listSpy).toHaveBeenCalledWith(farmerA);
  });

  it('denies farmer plot list/update for non-owned entities and allows own scope', async () => {
    const listSpy = jest.spyOn(plotsService, 'listByFarmer').mockResolvedValue([]);
    const updateSpy = jest.spyOn(plotsService, 'updateMetadata').mockResolvedValue({ id: plotA, name: 'Renamed' } as any);

    await expect(
      plotsController.listByFarmer(farmerB, {
        user: { id: userA, email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1' } },
      }),
    ).rejects.toThrow(ForbiddenException);

    await expect(
      plotsController.listByFarmer(farmerA, {
        user: { id: userA, email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1' } },
      }),
    ).resolves.toEqual([]);

    await expect(
      plotsController.updateMetadata(
        plotA,
        { name: 'Renamed', reason: 'scope-check' } as any,
        { user: { id: userB, email: 'farmer+other@example.com', app_metadata: { tenant_id: 'tenant_1' } } },
      ),
    ).rejects.toThrow(ForbiddenException);

    await expect(
      plotsController.updateMetadata(
        plotA,
        { name: 'Renamed', reason: 'scope-check' } as any,
        { user: { id: userA, email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1' } } },
      ),
    ).resolves.toEqual({ id: plotA, name: 'Renamed' });

    expect(listSpy).toHaveBeenCalledWith(farmerA);
    expect(updateSpy).toHaveBeenCalledWith(plotA, { name: 'Renamed', reason: 'scope-check' }, userA);
  });

  it('enforces tenant claim and farmer ownership for geometry history reads', async () => {
    await pool.query(
      `
        INSERT INTO audit_log (id, user_id, device_id, event_type, payload)
        VALUES
          ('d1d1d1d1-d1d1-41d1-81d1-d1d1d1d1d1d1', $1, NULL, 'plot_created', $2::jsonb),
          ('d2d2d2d2-d2d2-42d2-82d2-d2d2d2d2d2d2', $1, 'device-a', 'plot_geometry_superseded', $2::jsonb)
      `,
      [userA, JSON.stringify({ plotId: plotA, reason: 'boundary-fix' })],
    );

    await expect(
      plotsController.geometryHistory(plotA, undefined, undefined, undefined, undefined, undefined, {
        user: { id: userA, email: 'farmer@example.com' },
      }),
    ).rejects.toThrow(ForbiddenException);

    await expect(
      plotsController.geometryHistory(plotA, undefined, undefined, undefined, undefined, undefined, {
        user: { id: userB, email: 'farmer+other@example.com', app_metadata: { tenant_id: 'tenant_1' } },
      }),
    ).rejects.toThrow(ForbiddenException);

    await expect(
      plotsController.geometryHistory(plotA, undefined, undefined, undefined, undefined, undefined, {
        user: { id: userA, email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1' } },
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        items: expect.arrayContaining([
          expect.objectContaining({
            eventType: 'plot_created',
            payload: expect.objectContaining({ plotId: plotA }),
          }),
          expect.objectContaining({
            eventType: 'plot_geometry_superseded',
            payload: expect.objectContaining({ plotId: plotA }),
          }),
        ]),
      }),
    );
  });

  it('supports geometry history sort ordering with persisted audit events', async () => {
    await pool.query(
      `
        INSERT INTO audit_log (id, timestamp, user_id, device_id, event_type, payload)
        VALUES
          ('e1e1e1e1-e1e1-41e1-81e1-e1e1e1e1e1e1', '2026-04-16T09:00:00.000Z', $1, NULL, 'plot_created', $2::jsonb),
          ('e2e2e2e2-e2e2-42e2-82e2-e2e2e2e2e2e2', '2026-04-16T10:00:00.000Z', $1, 'device-a', 'plot_geometry_superseded', $2::jsonb),
          ('e3e3e3e3-e3e3-43e3-83e3-e3e3e3e3e3e3', '2026-04-16T11:00:00.000Z', $1, 'device-b', 'plot_geometry_superseded', $2::jsonb)
      `,
      [userA, JSON.stringify({ plotId: plotA, reason: 'ordered-seed' })],
    );

    const descRes = await plotsController.geometryHistory(plotA, '2', '0', 'desc', undefined, undefined, {
      user: { id: userA, email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1' } },
    });
    const ascRes = await plotsController.geometryHistory(plotA, '2', '0', 'asc', undefined, undefined, {
      user: { id: userA, email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1' } },
    });

    expect(descRes.total).toBe(3);
    expect(descRes.sort).toBe('desc');
    expect(descRes.items).toHaveLength(2);
    expect(descRes.items[0]?.timestamp >= descRes.items[1]?.timestamp).toBe(true);

    expect(ascRes.total).toBe(3);
    expect(ascRes.sort).toBe('asc');
    expect(ascRes.items).toHaveLength(2);
    expect(ascRes.items[0]?.timestamp <= ascRes.items[1]?.timestamp).toBe(true);
    expect(descRes.items[0]?.id).not.toBe(ascRes.items[0]?.id);
  });

  it('enforces tenant claim and exporter role for package detail/list/export endpoints', async () => {
    const listSpy = jest.spyOn(harvestService, 'listDdsPackagesForFarmer').mockResolvedValue([]);
    const detailSpy = jest.spyOn(harvestService, 'getDdsPackageDetail').mockResolvedValue({ id: 'pkg_1' } as any);
    const tracesSpy = jest
      .spyOn(harvestService, 'getDdsPackageTracesJson')
      .mockResolvedValue({ reference: 'TRACES-1' } as any);

    await expect(
      harvestController.listPackages(farmerA, {
        user: { id: userA, email: 'exporter+scope@example.com' },
      }),
    ).rejects.toThrow(ForbiddenException);

    await expect(
      harvestController.getPackage('pkg_1', {
        user: { id: userA, email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1' } },
      }),
    ).rejects.toThrow(ForbiddenException);

    await expect(
      harvestController.getPackageTracesJson('pkg_1', {
        user: { id: userA, email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1' } },
      }),
    ).rejects.toThrow(ForbiddenException);

    await expect(
      harvestController.listPackages(farmerA, {
        user: { id: userA, email: 'exporter+scope@example.com', app_metadata: { tenant_id: 'tenant_1' } },
      }),
    ).resolves.toEqual([]);

    await expect(
      harvestController.getPackage('pkg_1', {
        user: { id: userA, email: 'exporter+scope@example.com', app_metadata: { tenant_id: 'tenant_1' } },
      }),
    ).resolves.toEqual({ id: 'pkg_1' });

    await expect(
      harvestController.getPackageTracesJson('pkg_1', {
        user: { id: userA, email: 'exporter+scope@example.com', app_metadata: { tenant_id: 'tenant_1' } },
      }),
    ).resolves.toEqual({ reference: 'TRACES-1' });

    expect(listSpy).toHaveBeenCalledWith(farmerA);
    expect(detailSpy).toHaveBeenCalledWith('pkg_1');
    expect(tracesSpy).toHaveBeenCalledWith('pkg_1');
  });

  it('enforces tenant claim and exporter role for package submit endpoint', async () => {
    const submitSpy = jest.spyOn(harvestService, 'submitDdsPackage').mockResolvedValue({
      packageId: 'pkg_1',
      status: 'submitted',
    } as any);

    await expect(
      harvestController.submitPackage('pkg_1', { idempotencyKey: 'idem-1' } as any, {
        user: { id: userA, email: 'exporter+scope@example.com' },
      }),
    ).rejects.toThrow(ForbiddenException);

    await expect(
      harvestController.submitPackage('pkg_1', { idempotencyKey: 'idem-1' } as any, {
        user: { id: userA, email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1' } },
      }),
    ).rejects.toThrow(ForbiddenException);

    await expect(
      harvestController.submitPackage('pkg_1', { idempotencyKey: 'idem-1' } as any, {
        user: { id: userA, email: 'exporter+scope@example.com', app_metadata: { tenant_id: 'tenant_1' } },
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        packageId: 'pkg_1',
        status: 'submitted',
      }),
    );

    expect(submitSpy).toHaveBeenCalledWith('pkg_1', 'idem-1', expect.objectContaining({ tenantId: 'tenant_1' }));
  });

  it('persists readiness audit lifecycle events on exporter readiness checks', async () => {
    jest.spyOn(harvestService, 'getDdsPackageDetail').mockResolvedValue({
      package: { id: 'pkg_1' },
      vouchers: [
        {
          id: 'v_1',
          kg: 20,
          harvest_date: null,
          declared_area_ha: 1.1,
        },
      ],
    } as any);

    const result = await harvestController.getPackageReadiness('pkg_1', {
      user: { id: userA, email: 'exporter+scope@example.com', app_metadata: { tenant_id: 'tenant_1' } },
    });
    expect(result).toEqual(expect.objectContaining({ packageId: 'pkg_1', status: 'warning_review' }));

  });

  it('persists risk-score audit lifecycle events on exporter risk-score checks', async () => {
    jest.spyOn(harvestService, 'getDdsPackageDetail').mockResolvedValue({
      package: { id: 'pkg_risk_1' },
      vouchers: [
        {
          id: 'v_risk_1',
          kg: 2500,
          area_ha: 1,
          harvest_date: '2026-04-16',
          declared_area_ha: 1,
        },
      ],
    } as any);

    const result = await harvestController.getPackageRiskScore('pkg_risk_1', {
      user: { id: userA, email: 'exporter+scope@example.com', app_metadata: { tenant_id: 'tenant_1' } },
    });
    expect(result).toEqual(expect.objectContaining({ packageId: 'pkg_risk_1', band: 'medium' }));

  });

  it('persists filing preflight lifecycle events on exporter preflight checks', async () => {
    jest.spyOn(harvestService, 'getDdsPackageDetail').mockResolvedValue({
      package: { id: 'pkg_file_1' },
      vouchers: [],
    } as any);

    const result = await harvestController.getPackageFilingPreflight('pkg_file_1', {
      user: { id: userA, email: 'exporter+scope@example.com', app_metadata: { tenant_id: 'tenant_1' } },
    });
    expect(result).toEqual(expect.objectContaining({ packageId: 'pkg_file_1', status: 'preflight_blocked' }));

  }, 20_000);

  it('persists package-generation lifecycle events on exporter generation checks', async () => {
    const packageId = randomUUID();
    await pool.query(
      `INSERT INTO ${schema}.dds_package (id, farmer_id, label, status) VALUES ($1, $2, 'pkg-gen', 'draft')`,
      [packageId, farmerA],
    );
    await pool.query(
      `INSERT INTO public.dds_package (id, farmer_id, label, status)
       VALUES ($1, $2, 'pkg-gen', 'draft')
       ON CONFLICT (id) DO NOTHING`,
      [packageId, farmerA],
    );
    jest.spyOn(harvestService, 'getDdsPackageDetail').mockResolvedValue({
      package: { id: packageId },
      vouchers: [{ id: 'v_1', kg: 10, area_ha: 1, harvest_date: '2026-04-16', declared_area_ha: 1 }],
    } as any);

    const result = await harvestController.generatePackage(packageId, {
      user: { id: userA, email: 'exporter+scope@example.com', app_metadata: { tenant_id: 'tenant_1' } },
    });
    expect(result).toEqual(expect.objectContaining({ packageId, status: 'package_generated' }));

  }, 20_000);

  it('enforces tenant claim for mobile sync metadata endpoints', async () => {
    const photosSpy = jest.spyOn(plotsService, 'syncPhotos').mockResolvedValue({ ok: true } as any);
    const legalSpy = jest.spyOn(plotsService, 'syncLegal').mockResolvedValue({ ok: true } as any);
    const evidenceSpy = jest.spyOn(plotsService, 'syncEvidence').mockResolvedValue({ ok: true } as any);

    await expect(
      plotsController.syncPhotos(
        plotA,
        { kind: 'ground_truth', photos: [], hlcTimestamp: '1712524800000:1', clientEventId: 'evt-1' } as any,
        { user: { id: userA, email: 'farmer@example.com' } },
      ),
    ).rejects.toThrow(ForbiddenException);

    await expect(
      plotsController.syncLegal(
        plotA,
        { reason: 'title update', hlcTimestamp: '1712524800000:1', clientEventId: 'evt-2' } as any,
        { user: { id: userA, email: 'farmer@example.com' } },
      ),
    ).rejects.toThrow(ForbiddenException);

    await expect(
      plotsController.syncEvidence(
        plotA,
        { kind: 'tenure_evidence', items: [], reason: 'evidence upload', hlcTimestamp: '1712524800000:1', clientEventId: 'evt-3' } as any,
        { user: { id: userA, email: 'farmer@example.com' } },
      ),
    ).rejects.toThrow(ForbiddenException);

    await expect(
      plotsController.syncPhotos(
        plotA,
        { kind: 'ground_truth', photos: [], hlcTimestamp: '1712524800000:1', clientEventId: 'evt-1' } as any,
        { user: { id: userB, email: 'farmer+other@example.com', app_metadata: { tenant_id: 'tenant_1' } } },
      ),
    ).rejects.toThrow(ForbiddenException);

    await expect(
      plotsController.syncPhotos(
        plotA,
        {
          kind: 'ground_truth',
          photos: [],
          hlcTimestamp: '1712524800000:1',
          clientEventId: 'evt-agent-1',
          assignmentId: 'assign_agent_plot_a',
        } as any,
        { user: { id: userB, email: 'agent+field@example.com', app_metadata: { tenant_id: 'tenant_1' } } },
      ),
    ).resolves.toEqual({ ok: true });

    await expect(
      plotsController.syncPhotos(
        plotA,
        { kind: 'ground_truth', photos: [], hlcTimestamp: '1712524800000:1', clientEventId: 'evt-1' } as any,
        { user: { id: userA, email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1' } } },
      ),
    ).resolves.toEqual({ ok: true });

    await expect(
      plotsController.syncLegal(
        plotA,
        { reason: 'title update', hlcTimestamp: '1712524800000:1', clientEventId: 'evt-2' } as any,
        { user: { id: userA, email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1' } } },
      ),
    ).resolves.toEqual({ ok: true });

    await expect(
      plotsController.syncEvidence(
        plotA,
        { kind: 'tenure_evidence', items: [], reason: 'evidence upload', hlcTimestamp: '1712524800000:1', clientEventId: 'evt-3' } as any,
        { user: { id: userA, email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1' } } },
      ),
    ).resolves.toEqual({ ok: true });

    expect(photosSpy).toHaveBeenCalledWith(
      plotA,
      expect.objectContaining({ clientEventId: 'evt-1' }),
      userA,
    );
    expect(legalSpy).toHaveBeenCalledWith(
      plotA,
      expect.objectContaining({ clientEventId: 'evt-2' }),
      userA,
    );
    expect(evidenceSpy).toHaveBeenCalledWith(
      plotA,
      expect.objectContaining({ clientEventId: 'evt-3' }),
      userA,
    );
  });

  it('enforces role/state transitions for assignment lifecycle endpoints', async () => {
    await expect(
      plotsController.createAssignment(
        plotA,
        { assignmentId: 'assign_new_1', agentUserId: userB } as any,
        { user: { id: userA, email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1' } } },
      ),
    ).rejects.toThrow(ForbiddenException);

    const created = await plotsController.createAssignment(
      plotA,
      { assignmentId: 'assign_new_1', agentUserId: userB } as any,
      { user: { id: userA, email: 'exporter+scope@example.com', app_metadata: { tenant_id: 'tenant_1' } } },
    );
    expect(created).toEqual(expect.objectContaining({ assignmentId: 'assign_new_1', status: 'active' }));

    const completed = await plotsController.completeAssignment(
      'assign_new_1',
      { reason: 'completed in field' } as any,
      { user: { id: userA, email: 'agent+field@example.com', app_metadata: { tenant_id: 'tenant_1' } } },
    );
    expect(completed).toEqual(expect.objectContaining({ assignmentId: 'assign_new_1', status: 'completed' }));

    await expect(
      plotsController.cancelAssignment(
        'assign_new_1',
        { reason: 'late cancel' } as any,
        { user: { id: userA, email: 'exporter+scope@example.com', app_metadata: { tenant_id: 'tenant_1' } } },
      ),
    ).rejects.toThrow('ASN-003');

    await expect(
      plotsController.listAssignments(plotA, undefined, undefined, undefined, undefined, undefined, undefined, {
        user: { id: userA, email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1' } },
      }),
    ).rejects.toThrow(ForbiddenException);

    await expect(
      plotsController.listAssignments(plotA, 'all', '30', undefined, '10', '0', undefined, {
        user: { id: userA, email: 'exporter+scope@example.com', app_metadata: { tenant_id: 'tenant_1' } },
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        items: expect.arrayContaining([expect.objectContaining({ assignmentId: 'assign_new_1' })]),
      }),
    );

    const filtered = await plotsController.listAssignments(plotA, 'completed', '30', userB, '10', '0', undefined, {
      user: { id: userA, email: 'exporter+scope@example.com', app_metadata: { tenant_id: 'tenant_1' } },
    });
    expect(filtered).toEqual(
      expect.objectContaining({
        status: 'completed',
        agentUserId: userB,
      }),
    );
    if (typeof filtered === 'string') {
      throw new Error('Expected JSON assignment list page response, received CSV string');
    }
    expect(filtered.total).toBeGreaterThanOrEqual(filtered.items.length);
  });
});
