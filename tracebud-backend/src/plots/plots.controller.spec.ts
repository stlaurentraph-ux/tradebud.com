import { ForbiddenException } from '@nestjs/common';
import { PlotsController } from './plots.controller';
import type { PlotsService } from './plots.service';

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
    runComplianceCheck: jest.fn(),
    createAssignment: jest.fn(),
    completeAssignment: jest.fn(),
    cancelAssignment: jest.fn(),
    listAssignmentsByPlot: jest.fn(),
    appendAssignmentExportAuditEvent: jest.fn().mockResolvedValue(undefined),
  };
}

describe('PlotsController scope boundaries', () => {
  it('rejects create when tenant claim is missing', async () => {
    const service = makeServiceMock();
    const controller = new PlotsController(service as unknown as PlotsService);

    await expect(
      controller.create({} as any, { user: { id: 'user_1', email: 'farmer@example.com' } }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects when tenant claim is missing', async () => {
    const service = makeServiceMock();
    const controller = new PlotsController(service as unknown as PlotsService);

    await expect(
      controller.listByFarmer('farmer_1', { user: { id: 'user_1', email: 'farmer@example.com' } }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects farmer list for another farmerId', async () => {
    const service = makeServiceMock();
    service.isFarmerOwnedByUser.mockResolvedValue(false);
    const controller = new PlotsController(service as unknown as PlotsService);

    await expect(
      controller.listByFarmer('farmer_other', {
        user: { id: 'user_1', email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1' } },
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects farmer plot metadata update for foreign plot', async () => {
    const service = makeServiceMock();
    service.isPlotOwnedByUser.mockResolvedValue(false);
    const controller = new PlotsController(service as unknown as PlotsService);

    await expect(
      controller.updateMetadata(
        'plot_1',
        { reason: 'fix name' } as any,
        { user: { id: 'user_1', email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1' } } },
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects geometry update when tenant claim is missing', async () => {
    const service = makeServiceMock();
    const controller = new PlotsController(service as unknown as PlotsService);

    await expect(
      controller.updateGeometry('plot_1', { reason: 'boundary fix', geometry: {} } as any, {
        user: { id: 'user_1', email: 'farmer@example.com' },
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects photos/legal/evidence sync when tenant claim is missing', async () => {
    const service = makeServiceMock();
    const controller = new PlotsController(service as unknown as PlotsService);

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
    const controller = new PlotsController(service as unknown as PlotsService);

    await expect(
      controller.syncPhotos('plot_1', { kind: 'ground_truth', photos: [] } as any, {
        user: { id: 'user_1', email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1' } },
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects exporter sync role and allows scoped farmer/agent sync', async () => {
    const service = makeServiceMock();
    service.isPlotOwnedByUser.mockResolvedValue(true);
    service.isAgentAssignedToPlot.mockResolvedValue(true);
    service.syncPhotos.mockResolvedValue({ ok: true } as any);
    const controller = new PlotsController(service as unknown as PlotsService);

    await expect(
      controller.syncPhotos('plot_1', { kind: 'ground_truth', photos: [] } as any, {
        user: { id: 'user_1', email: 'exporter+ops@example.com', app_metadata: { tenant_id: 'tenant_1' } },
      }),
    ).rejects.toThrow(ForbiddenException);

    await expect(
      controller.syncPhotos('plot_1', { kind: 'ground_truth', photos: [] } as any, {
        user: { id: 'user_1', email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1' } },
      }),
    ).resolves.toEqual({ ok: true });

    await expect(
      controller.syncPhotos('plot_1', { kind: 'ground_truth', photos: [] } as any, {
        user: { id: 'user_2', email: 'agent+field@example.com', app_metadata: { tenant_id: 'tenant_1' } },
      }),
    ).resolves.toEqual({ ok: true });
  });

  it('rejects agent sync when assignment scope is missing', async () => {
    const service = makeServiceMock();
    service.isAgentAssignedToPlot.mockResolvedValue(false);
    const controller = new PlotsController(service as unknown as PlotsService);

    await expect(
      controller.syncPhotos(
        'plot_1',
        { kind: 'ground_truth', photos: [], assignmentId: 'assign_1' } as any,
        {
          user: { id: 'user_2', email: 'agent+field@example.com', app_metadata: { tenant_id: 'tenant_1' } },
        },
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects assignment lifecycle management for farmer role', async () => {
    const service = makeServiceMock();
    const controller = new PlotsController(service as unknown as PlotsService);

    await expect(
      controller.createAssignment(
        'plot_1',
        { assignmentId: 'assign_1', agentUserId: 'agent_1' } as any,
        { user: { id: 'user_1', email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1' } } },
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
    const controller = new PlotsController(service as unknown as PlotsService);

    await expect(
      controller.createAssignment(
        'plot_1',
        { assignmentId: 'assign_1', agentUserId: 'agent_1' } as any,
        { user: { id: 'user_1', email: 'agent+field@example.com', app_metadata: { tenant_id: 'tenant_1' } } },
      ),
    ).resolves.toEqual(expect.objectContaining({ assignmentId: 'assign_1', status: 'active' }));

    await expect(
      controller.completeAssignment(
        'assign_1',
        { reason: 'work complete' } as any,
        { user: { id: 'user_2', email: 'exporter+ops@example.com', app_metadata: { tenant_id: 'tenant_1' } } },
      ),
    ).resolves.toEqual(expect.objectContaining({ assignmentId: 'assign_1', status: 'completed' }));

    await expect(
      controller.cancelAssignment(
        'assign_2',
        { reason: 'replanned' } as any,
        { user: { id: 'user_2', email: 'exporter+ops@example.com', app_metadata: { tenant_id: 'tenant_1' } } },
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
    const controller = new PlotsController(service as unknown as PlotsService);

    await expect(
      controller.listAssignments('plot_1', undefined, undefined, undefined, undefined, undefined, undefined, {
        user: { id: 'farmer_1', email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1' } },
      }),
    ).rejects.toThrow(ForbiddenException);

    await expect(
      controller.listAssignments('plot_1', 'active', '14', 'agent_1', '10', '0', undefined, {
        user: { id: 'exp_1', email: 'exporter+ops@example.com', app_metadata: { tenant_id: 'tenant_1' } },
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
    const controller = new PlotsController(service as unknown as PlotsService);

    const result = await controller.listAssignments(
      'plot_1',
      'active',
      '30',
      undefined,
      '10',
      '0',
      'csv',
      { user: { id: 'exp_1', email: 'exporter+ops@example.com', app_metadata: { tenant_id: 'tenant_1' } } },
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
    const controller = new PlotsController(service as unknown as PlotsService);

    await expect(
      controller.geometryHistory('plot_1', undefined, undefined, undefined, undefined, undefined, { user: { id: 'user_1', email: 'farmer@example.com' } }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects farmer geometry history for foreign plot', async () => {
    const service = makeServiceMock();
    service.isPlotOwnedByUser.mockResolvedValue(false);
    const controller = new PlotsController(service as unknown as PlotsService);

    await expect(
      controller.geometryHistory('plot_1', undefined, undefined, undefined, undefined, undefined, {
        user: { id: 'user_1', email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1' } },
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
    const controller = new PlotsController(service as unknown as PlotsService);

    const result = await controller.geometryHistory('plot_1', '25', '50', 'asc', undefined, undefined, {
      user: { id: 'user_1', email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1' } },
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
    const controller = new PlotsController(service as unknown as PlotsService);

    await controller.geometryHistory('plot_1', undefined, undefined, undefined, 'strict', undefined, {
      user: { id: 'user_1', email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1' } },
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
    const controller = new PlotsController(service as unknown as PlotsService);

    await controller.geometryHistory('plot_1', undefined, undefined, undefined, undefined, 'true', {
      user: { id: 'user_1', email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1' } },
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
    const controller = new PlotsController(service as unknown as PlotsService);

    const result = await controller.geometryHistory('plot_1', undefined, undefined, undefined, undefined, undefined, {
      user: { id: 'user_1', email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1' } },
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
    const controller = new PlotsController(service as unknown as PlotsService);

    await expect(
      controller.runDeforestationDecision('plot_1', '2020-12-31', {
        user: { id: 'user_1', email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1' } },
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
    const controller = new PlotsController(service as unknown as PlotsService);

    const result = await controller.runDeforestationDecision('plot_1', '2020-12-31', {
      user: { id: 'exp_1', email: 'exporter+ops@example.com', app_metadata: { tenant_id: 'tenant_1' } },
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
    const controller = new PlotsController(service as unknown as PlotsService);

    const result = await controller.deforestationDecisionHistory('plot_1');

    expect(service.getDeforestationDecisionHistory).toHaveBeenCalledWith('plot_1');
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          event_type: 'plot_deforestation_decision_recorded',
        }),
      ]),
    );
  });
});
