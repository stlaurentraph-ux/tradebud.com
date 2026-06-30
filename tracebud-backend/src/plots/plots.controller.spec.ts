import { ForbiddenException } from '@nestjs/common';
import { PlotsController } from './plots.controller';
import type { PlotsService } from './plots.service';
import type { ConsentService } from '../consent/consent.service';

function makeConsentMock(): jest.Mocked<
  Pick<ConsentService, 'canTenantAccessPlot' | 'canTenantAccessFarmer'>
> {
  return {
    canTenantAccessPlot: jest.fn().mockResolvedValue(true),
    canTenantAccessFarmer: jest.fn().mockResolvedValue(true),
  };
}

function makePoolMock() {
  return {
    query: jest.fn(async () => ({ rows: [], rowCount: 0 })),
  };
}

function makePlotsController(
  service: ReturnType<typeof makeServiceMock>,
  consent: ReturnType<typeof makeConsentMock> = makeConsentMock(),
  pool: ReturnType<typeof makePoolMock> = makePoolMock(),
) {
  return new PlotsController(
    service as unknown as PlotsService,
    consent as unknown as ConsentService,
    pool as never,
  );
}

function makeServiceMock(): jest.Mocked<
  Pick<
    PlotsService,
    | 'isFarmerOwnedByUser'
    | 'isPlotOwnedByUser'
    | 'isAgentAssignedToPlot'
    | 'create'
    | 'listByFarmer'
    | 'updateMetadata'
    | 'updateGeometry'
    | 'syncPhotos'
    | 'syncLegal'
    | 'syncEvidence'
    | 'runGfwCheck'
    | 'runDeforestationDecision'
    | 'getComplianceHistory'
    | 'getDeforestationDecisionHistory'
    | 'getGeometryHistory'
    | 'listTenureVerification'
    | 'runComplianceCheck'
    | 'createAssignment'
    | 'completeAssignment'
    | 'cancelAssignment'
    | 'listAssignmentsByPlot'
    | 'appendAssignmentExportAuditEvent'
  >
> {
  return {
    isFarmerOwnedByUser: jest.fn(),
    isPlotOwnedByUser: jest.fn(),
    isAgentAssignedToPlot: jest.fn(),
    create: jest.fn(),
    listByFarmer: jest.fn(),
    updateMetadata: jest.fn(),
    updateGeometry: jest.fn(),
    syncPhotos: jest.fn(),
    syncLegal: jest.fn(),
    syncEvidence: jest.fn(),
    runGfwCheck: jest.fn(),
    runDeforestationDecision: jest.fn(),
    getComplianceHistory: jest.fn(),
    getDeforestationDecisionHistory: jest.fn(),
    getGeometryHistory: jest.fn(),
    listTenureVerification: jest.fn(),
    runComplianceCheck: jest.fn(),
    createAssignment: jest.fn(),
    completeAssignment: jest.fn(),
    cancelAssignment: jest.fn(),
    listAssignmentsByPlot: jest.fn(),
    appendAssignmentExportAuditEvent: jest.fn().mockResolvedValue(undefined),
  };
}

describe('PlotsController scope boundaries', () => {
  it('rejects create when tenant claim is missing and actor is not field-app', async () => {
    const service = makeServiceMock();
    const controller = makePlotsController(service);

    await expect(
      controller.create({} as any, { user: { id: 'user_1', email: 'exporter@example.com', app_metadata: { role: 'exporter' } } }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('allows create for field-app farmer without tenant claim', async () => {
    const service = makeServiceMock();
    service.create.mockResolvedValue({ id: 'plot_1' });
    const controller = makePlotsController(service);

    await expect(
      controller.create({ farmerId: 'user_1' } as any, {
        user: { id: 'user_1', email: 'farmer@example.com', app_metadata: { role: 'farmer' } },
      }),
    ).resolves.toEqual({ id: 'plot_1' });
  });

  it('rejects when tenant claim is missing for non-field actors', async () => {
    const service = makeServiceMock();
    const controller = makePlotsController(service);

    await expect(
      controller.listByFarmer('farmer_1', undefined, { user: { id: 'user_1', email: 'farmer@example.com' } }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects farmer list for another farmerId', async () => {
    const service = makeServiceMock();
    service.isFarmerOwnedByUser.mockResolvedValue(false);
    const controller = makePlotsController(service);

    await expect(
      controller.listByFarmer('farmer_other', undefined, {
        user: { id: 'user_1', email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1', role: 'farmer' } },
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects farmer plot metadata update for foreign plot', async () => {
    const service = makeServiceMock();
    service.isPlotOwnedByUser.mockResolvedValue(false);
    const controller = makePlotsController(service);

    await expect(
      controller.updateMetadata(
        'plot_1',
        { reason: 'fix name' } as any,
        { user: { id: 'user_1', email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1', role: 'farmer' } } },
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects geometry update when tenant claim is missing', async () => {
    const service = makeServiceMock();
    const controller = makePlotsController(service);

    await expect(
      controller.updateGeometry('plot_1', { reason: 'boundary fix', geometry: {} } as any, {
        user: { id: 'user_1', email: 'farmer@example.com' },
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('allows exporter geometry revision with tenant plot access', async () => {
    const service = makeServiceMock();
    service.updateGeometry.mockResolvedValue({ id: 'plot_1', kind: 'polygon' } as any);
    const consent = makeConsentMock();
    const controller = makePlotsController(service, consent);

    await expect(
      controller.updateGeometry(
        'plot_1',
        { reason: 'Removed GPS jitter', geometry: { type: 'Polygon', coordinates: [] }, reviewerAssist: true } as any,
        {
          user: {
            id: 'user_exp',
            email: 'exporter@example.com',
            app_metadata: { tenant_id: 'tenant_1', role: 'exporter' },
          },
        },
      ),
    ).resolves.toEqual({ id: 'plot_1', kind: 'polygon' });

    expect(consent.canTenantAccessPlot).toHaveBeenCalledWith('plot_1', 'tenant_1');
    expect(service.updateGeometry).toHaveBeenCalled();
  });

  it('rejects geometry revision for unsupported roles', async () => {
    const service = makeServiceMock();
    const controller = makePlotsController(service);

    await expect(
      controller.updateGeometry('plot_1', { reason: 'boundary fix', geometry: {} } as any, {
        user: {
          id: 'user_1',
          email: 'importer@example.com',
          app_metadata: { tenant_id: 'tenant_1', role: 'importer' },
        },
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects photos/legal/evidence sync when tenant claim is missing', async () => {
    const service = makeServiceMock();
    const controller = makePlotsController(service);

    await expect(
      controller.syncPhotos('plot_1', { kind: 'ground_truth', photos: [] } as any, {
        user: { id: 'user_1', email: 'farmer@example.com' },
      }),
    ).rejects.toThrow(ForbiddenException);

    await expect(
      controller.syncLegal('plot_1', { reason: 'title update' } as any, {
        user: { id: 'user_1', email: 'farmer@example.com' },
      }),
    ).rejects.toThrow(ForbiddenException);

    await expect(
      controller.syncEvidence('plot_1', { kind: 'tenure_evidence', items: [], reason: 'evidence upload' } as any, {
        user: { id: 'user_1', email: 'farmer@example.com' },
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects farmer sync for foreign plot ownership', async () => {
    const service = makeServiceMock();
    service.isPlotOwnedByUser.mockResolvedValue(false);
    const controller = makePlotsController(service);

    await expect(
      controller.syncPhotos('plot_1', { kind: 'ground_truth', photos: [] } as any, {
        user: { id: 'user_1', email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1', role: 'farmer' } },
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects exporter sync role and allows scoped farmer/agent sync', async () => {
    const service = makeServiceMock();
    service.isPlotOwnedByUser.mockResolvedValue(true);
    service.isAgentAssignedToPlot.mockResolvedValue(true);
    service.syncPhotos.mockResolvedValue({ ok: true } as any);
    const controller = makePlotsController(service);

    await expect(
      controller.syncPhotos('plot_1', { kind: 'ground_truth', photos: [] } as any, {
        user: { id: 'user_1', email: 'exporter+ops@example.com', app_metadata: { tenant_id: 'tenant_1', role: 'exporter' } },
      }),
    ).rejects.toThrow(ForbiddenException);

    await expect(
      controller.syncPhotos('plot_1', { kind: 'ground_truth', photos: [] } as any, {
        user: { id: 'user_1', email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1', role: 'farmer' } },
      }),
    ).resolves.toEqual({ ok: true });

    await expect(
      controller.syncPhotos('plot_1', { kind: 'ground_truth', photos: [] } as any, {
        user: { id: 'user_2', email: 'agent+field@example.com', app_metadata: { tenant_id: 'tenant_1', role: 'agent' } },
      }),
    ).resolves.toEqual({ ok: true });
  });

  it('rejects agent sync when assignment scope is missing', async () => {
    const service = makeServiceMock();
    service.isAgentAssignedToPlot.mockResolvedValue(false);
    const controller = makePlotsController(service);

    await expect(
      controller.syncPhotos(
        'plot_1',
        { kind: 'ground_truth', photos: [], assignmentId: 'assign_1' } as any,
        {
          user: { id: 'user_2', email: 'agent+field@example.com', app_metadata: { tenant_id: 'tenant_1', role: 'agent' } },
        },
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects assignment lifecycle management for farmer role', async () => {
    const service = makeServiceMock();
    const controller = makePlotsController(service);

    await expect(
      controller.createAssignment(
        'plot_1',
        { assignmentId: 'assign_1', agentUserId: 'agent_1' } as any,
        { user: { id: 'user_1', email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1', role: 'farmer' } } },
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('allows assignment lifecycle management for agent/exporter roles', async () => {
    const service = makeServiceMock();
    service.createAssignment.mockResolvedValue({
      assignmentId: 'assign_1',
      plotId: 'plot_1',
      agentUserId: 'agent_1',
      status: 'active',
      assignedAt: '2026-01-01T00:00:00.000Z',
      endedAt: null,
    } as any);
    service.completeAssignment.mockResolvedValue({
      assignmentId: 'assign_1',
      status: 'completed',
    } as any);
    service.cancelAssignment.mockResolvedValue({
      assignmentId: 'assign_2',
      status: 'cancelled',
    } as any);
    const controller = makePlotsController(service);

    await expect(
      controller.createAssignment(
        'plot_1',
        { assignmentId: 'assign_1', agentUserId: 'agent_1' } as any,
        { user: { id: 'user_1', email: 'agent+field@example.com', app_metadata: { tenant_id: 'tenant_1', role: 'agent' } } },
      ),
    ).resolves.toEqual(expect.objectContaining({ assignmentId: 'assign_1', status: 'active' }));

    await expect(
      controller.completeAssignment(
        'assign_1',
        { reason: 'work complete' } as any,
        { user: { id: 'user_2', email: 'exporter+ops@example.com', app_metadata: { tenant_id: 'tenant_1', role: 'exporter' } } },
      ),
    ).resolves.toEqual(expect.objectContaining({ assignmentId: 'assign_1', status: 'completed' }));

    await expect(
      controller.cancelAssignment(
        'assign_2',
        { reason: 'replanned' } as any,
        { user: { id: 'user_2', email: 'exporter+ops@example.com', app_metadata: { tenant_id: 'tenant_1', role: 'exporter' } } },
      ),
    ).resolves.toEqual(expect.objectContaining({ assignmentId: 'assign_2', status: 'cancelled' }));
  });

  it('lists assignments for exporter role and rejects farmer role', async () => {
    const service = makeServiceMock();
    service.listAssignmentsByPlot.mockResolvedValue({
      items: [{ assignmentId: 'assign_1', plotId: 'plot_1', status: 'active' } as any],
      total: 1,
      limit: 10,
      offset: 0,
      status: 'active',
      fromDays: 14,
      agentUserId: 'agent_1',
    } as any);
    const controller = makePlotsController(service);

    await expect(
      controller.listAssignments('plot_1', undefined, undefined, undefined, undefined, undefined, undefined, {
        user: { id: 'farmer_1', email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1', role: 'farmer' } },
      }),
    ).rejects.toThrow(ForbiddenException);

    await expect(
      controller.listAssignments('plot_1', 'active', '14', 'agent_1', '10', '0', undefined, {
        user: { id: 'exp_1', email: 'exporter+ops@example.com', app_metadata: { tenant_id: 'tenant_1', role: 'exporter' } },
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        items: [expect.objectContaining({ assignmentId: 'assign_1' })],
      }),
    );
    expect(service.listAssignmentsByPlot).toHaveBeenCalledWith(
      'plot_1',
      expect.objectContaining({
        status: 'active',
        fromDays: 14,
        agentUserId: 'agent_1',
        limit: 10,
        offset: 0,
      }),
    );
  });

  it('exports assignments as csv when format=csv', async () => {
    const service = makeServiceMock();
    service.listAssignmentsByPlot.mockResolvedValue({
      items: [
        {
          assignmentId: 'assign_1',
          plotId: 'plot_1',
          agentUserId: 'agent_1',
          agentName: 'Agent One',
          agentEmail: 'agent.one@example.com',
          status: 'active',
          assignedAt: '2026-01-01T00:00:00.000Z',
          endedAt: null,
        } as any,
      ],
      total: 1,
      limit: 10,
      offset: 0,
    } as any);
    const setHeader = jest.fn();
    const controller = makePlotsController(service);

    const result = await controller.listAssignments(
      'plot_1',
      'active',
      '30',
      undefined,
      '10',
      '0',
      'csv',
      { user: { id: 'exp_1', email: 'exporter+ops@example.com', app_metadata: { tenant_id: 'tenant_1', role: 'exporter' } } },
      { setHeader },
    );
    expect(typeof result).toBe('string');
    expect(result).toContain('assignment_id,plot_id,agent_user_id,agent_name,agent_email,status,assigned_at,ended_at');
    expect(result).toContain('"assign_1","plot_1","agent_1","Agent One","agent.one@example.com","active"');
    expect(setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv; charset=utf-8');
    expect(setHeader).toHaveBeenCalledWith('X-Export-Row-Count', '1');
    expect(service.appendAssignmentExportAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ phase: 'requested', plotId: 'plot_1' }),
    );
    expect(service.appendAssignmentExportAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ phase: 'succeeded', plotId: 'plot_1', rowCount: 1 }),
    );
  });

  it('rejects geometry history when tenant claim is missing', async () => {
    const service = makeServiceMock();
    const controller = makePlotsController(service);

    await expect(
      controller.geometryHistory('plot_1', undefined, undefined, undefined, undefined, undefined, { user: { id: 'user_1', email: 'farmer@example.com' } }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects farmer geometry history for foreign plot', async () => {
    const service = makeServiceMock();
    service.isPlotOwnedByUser.mockResolvedValue(false);
    const controller = makePlotsController(service);

    await expect(
      controller.geometryHistory('plot_1', undefined, undefined, undefined, undefined, undefined, {
        user: { id: 'user_1', email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1', role: 'farmer' } },
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('forwards geometry history for scoped farmer', async () => {
    const service = makeServiceMock();
    service.isPlotOwnedByUser.mockResolvedValue(true);
    service.getGeometryHistory.mockResolvedValue({
      items: [
        {
          id: 'evt_1',
          timestamp: '2026-04-16T00:00:00.000Z',
          userId: 'user_1',
          deviceId: null,
          eventType: 'plot_created',
          payload: { plotId: 'plot_1', details: { plotId: 'plot_1' } },
        },
      ],
      total: 1,
      anomalies: [],
      limit: 25,
      offset: 50,
      sort: 'asc',
      anomalyProfile: 'balanced',
      signalsOnly: false,
    } as any);
    const controller = makePlotsController(service);

    const result = await controller.geometryHistory('plot_1', '25', '50', 'asc', undefined, undefined, {
      user: { id: 'user_1', email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1', role: 'farmer' } },
    });

    expect(service.isPlotOwnedByUser).toHaveBeenCalledWith('plot_1', 'user_1');
    expect(service.getGeometryHistory).toHaveBeenCalledWith('plot_1', 25, 50, 'asc', 'balanced', false);
    expect(result.items).toHaveLength(1);
  });

  it('forwards anomalyProfile when provided', async () => {
    const service = makeServiceMock();
    service.isPlotOwnedByUser.mockResolvedValue(true);
    service.getGeometryHistory.mockResolvedValue({
      items: [],
      anomalies: [],
      total: 0,
      limit: 100,
      offset: 0,
      sort: 'desc',
      anomalyProfile: 'strict',
      signalsOnly: false,
    } as any);
    const controller = makePlotsController(service);

    await controller.geometryHistory('plot_1', undefined, undefined, undefined, 'strict', undefined, {
      user: { id: 'user_1', email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1', role: 'farmer' } },
    });

    expect(service.getGeometryHistory).toHaveBeenCalledWith('plot_1', 100, 0, 'desc', 'strict', false);
  });

  it('forwards signalsOnly when provided', async () => {
    const service = makeServiceMock();
    service.isPlotOwnedByUser.mockResolvedValue(true);
    service.getGeometryHistory.mockResolvedValue({
      items: [],
      anomalies: [],
      total: 0,
      limit: 100,
      offset: 0,
      sort: 'desc',
      anomalyProfile: 'balanced',
      signalsOnly: true,
    } as any);
    const controller = makePlotsController(service);

    await controller.geometryHistory('plot_1', undefined, undefined, undefined, undefined, 'true', {
      user: { id: 'user_1', email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1', role: 'farmer' } },
    });

    expect(service.getGeometryHistory).toHaveBeenCalledWith('plot_1', 100, 0, 'desc', 'balanced', true);
  });

  it('returns geometry history with stable camelCase envelope fields', async () => {
    const service = makeServiceMock();
    service.isPlotOwnedByUser.mockResolvedValue(true);
    service.getGeometryHistory.mockResolvedValue({
      items: [
        {
          id: 'evt_1',
          timestamp: '2026-04-16T00:00:00.000Z',
          userId: 'user_1',
          deviceId: 'device_1',
          eventType: 'plot_geometry_superseded',
          payload: {
            plotId: 'plot_1',
            details: { reason: 'boundary correction' },
          },
        },
      ],
      total: 1,
      anomalies: [
        {
          eventId: 'evt_1',
          type: 'large_revision_jump',
          severity: 'medium',
          message: 'Large revision jump: 3.10% area correction variance.',
        },
      ],
      limit: 100,
      offset: 0,
      sort: 'desc',
      anomalyProfile: 'balanced',
      signalsOnly: false,
    } as any);
    const controller = makePlotsController(service);

    const result = await controller.geometryHistory('plot_1', undefined, undefined, undefined, undefined, undefined, {
      user: { id: 'user_1', email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1', role: 'farmer' } },
    });

    expect(result.items[0]).toEqual(
      expect.objectContaining({
        id: 'evt_1',
        timestamp: '2026-04-16T00:00:00.000Z',
        userId: 'user_1',
        deviceId: 'device_1',
        eventType: 'plot_geometry_superseded',
        payload: expect.objectContaining({
          plotId: 'plot_1',
          details: expect.objectContaining({ reason: 'boundary correction' }),
        }),
      }),
    );
    expect((result.items[0] as any).event_type).toBeUndefined();
    expect((result.items[0] as any).user_id).toBeUndefined();
    expect((result.items[0] as any).device_id).toBeUndefined();
    expect(result.anomalies[0]).toEqual(
      expect.objectContaining({
        eventId: 'evt_1',
        type: 'large_revision_jump',
      }),
    );
  });

  it('rejects deforestation decision for farmer role', async () => {
    const service = makeServiceMock();
    const controller = makePlotsController(service);

    await expect(
      controller.runDeforestationDecision('plot_1', '2020-12-31', {
        user: { id: 'user_1', email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1', role: 'farmer' } },
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('forwards deforestation decision for exporter role', async () => {
    const service = makeServiceMock();
    service.runDeforestationDecision.mockResolvedValue({
      ok: true,
      plotId: 'plot_1',
      cutoffDate: '2020-12-31',
      verdict: 'no_deforestation_detected',
    } as any);
    const controller = makePlotsController(service);

    const result = await controller.runDeforestationDecision('plot_1', '2020-12-31', {
      user: { id: 'exp_1', email: 'exporter+ops@example.com', app_metadata: { tenant_id: 'tenant_1', role: 'exporter' } },
    });

    expect(service.runDeforestationDecision).toHaveBeenCalledWith('plot_1', 'exp_1', '2020-12-31');
    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        verdict: 'no_deforestation_detected',
      }),
    );
  });

  it('forwards deforestation decision history read', async () => {
    const service = makeServiceMock();
    service.getDeforestationDecisionHistory.mockResolvedValue([
      {
        id: 'evt_1',
        event_type: 'plot_deforestation_decision_recorded',
        payload: { plotId: 'plot_1', cutoffDate: '2020-12-31', verdict: 'no_deforestation_detected' },
      },
    ] as any);
    const consent = makeConsentMock();
    const controller = makePlotsController(service, consent);

    const result = await controller.deforestationDecisionHistory('plot_1', {
      user: {
        id: 'exp_1',
        email: 'exporter@example.com',
        app_metadata: { tenant_id: 'tenant_1', role: 'exporter' },
      },
    });

    expect(consent.canTenantAccessPlot).toHaveBeenCalledWith('plot_1', 'tenant_1');
    expect(service.getDeforestationDecisionHistory).toHaveBeenCalledWith('plot_1');
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          event_type: 'plot_deforestation_decision_recorded',
        }),
      ]),
    );
  });

  it('rejects cross-tenant deforestation decision history read (B1)', async () => {
    const service = makeServiceMock();
    const consent = makeConsentMock();
    consent.canTenantAccessPlot.mockResolvedValue(false);
    const controller = makePlotsController(service, consent);

    await expect(
      controller.deforestationDecisionHistory('plot_1', {
        user: {
          id: 'exp_2',
          email: 'exporter@other.com',
          app_metadata: { tenant_id: 'tenant_2', role: 'exporter' },
        },
      }),
    ).rejects.toThrow(ForbiddenException);

    expect(consent.canTenantAccessPlot).toHaveBeenCalledWith('plot_1', 'tenant_2');
    expect(service.getDeforestationDecisionHistory).not.toHaveBeenCalled();
  });

  it('rejects cross-tenant compliance history read (B1)', async () => {
    const service = makeServiceMock();
    const consent = makeConsentMock();
    consent.canTenantAccessPlot.mockResolvedValue(false);
    const controller = makePlotsController(service, consent);

    await expect(
      controller.complianceHistory('plot_1', {
        user: {
          id: 'exp_2',
          email: 'exporter@other.com',
          app_metadata: { tenant_id: 'tenant_2', role: 'exporter' },
        },
      }),
    ).rejects.toThrow(ForbiddenException);

    expect(consent.canTenantAccessPlot).toHaveBeenCalledWith('plot_1', 'tenant_2');
    expect(service.getComplianceHistory).not.toHaveBeenCalled();
  });

  it('rejects cross-tenant tenure verification read (B1)', async () => {
    const service = makeServiceMock();
    const consent = makeConsentMock();
    consent.canTenantAccessPlot.mockResolvedValue(false);
    const controller = makePlotsController(service, consent);

    await expect(
      controller.tenureVerification('plot_1', {
        user: {
          id: 'exp_2',
          email: 'exporter@other.com',
          app_metadata: { tenant_id: 'tenant_2', role: 'exporter' },
        },
      }),
    ).rejects.toThrow(ForbiddenException);

    expect(consent.canTenantAccessPlot).toHaveBeenCalledWith('plot_1', 'tenant_2');
    expect(service.listTenureVerification).not.toHaveBeenCalled();
  });

  it('rejects farmer reading another farmer plot tenure verification (B1)', async () => {
    const service = makeServiceMock();
    service.isPlotOwnedByUser.mockResolvedValue(false);
    const controller = makePlotsController(service);

    await expect(
      controller.tenureVerification('plot_1', {
        user: {
          id: 'farmer_2',
          email: 'farmer@other.com',
          app_metadata: { role: 'farmer' },
        },
      }),
    ).rejects.toThrow(ForbiddenException);

    expect(service.isPlotOwnedByUser).toHaveBeenCalledWith('plot_1', 'farmer_2');
    expect(service.listTenureVerification).not.toHaveBeenCalled();
  });
});
