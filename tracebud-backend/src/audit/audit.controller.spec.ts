import { ForbiddenException } from '@nestjs/common';
import { AuditController } from './audit.controller';

describe('AuditController tenant-claim and role checks', () => {
  it('rejects create when tenant claim is missing', async () => {
    const pool = { query: jest.fn() };
    const controller = new AuditController(pool as any);

    await expect(
      controller.create(
        { eventType: 'test_event', payload: { ok: true } } as any,
        { user: { id: 'user_1', email: 'farmer@example.com' } },
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects list when tenant claim is missing', async () => {
    const pool = { query: jest.fn() };
    const controller = new AuditController(pool as any);

    await expect(controller.list(undefined, { user: { id: 'user_1', email: 'farmer@example.com' } })).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('allows list when tenant claim is present', async () => {
    const pool = { query: jest.fn().mockResolvedValue({ rows: [{ id: 'evt_1' }] }) };
    const controller = new AuditController(pool as any);

    await expect(
      controller.list(undefined, { user: { id: 'user_1', email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1' } } }),
    ).resolves.toEqual([{ id: 'evt_1' }]);
  });

  it('rejects gated-entry list when tenant claim is missing', async () => {
    const pool = { query: jest.fn() };
    const controller = new AuditController(pool as any);

    await expect(
      controller.listGatedEntry(undefined, undefined, undefined, undefined, undefined, {
        user: { id: 'user_1', email: 'farmer@example.com' },
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('lists only dashboard gated-entry events for tenant claim', async () => {
    const pool = {
      query: jest
        .fn()
        .mockResolvedValueOnce({ rows: [{ total: 1 }] })
        .mockResolvedValueOnce({ rows: [{ id: 'evt_gate_1' }] }),
    };
    const controller = new AuditController(pool as any);

    await expect(
      controller.listGatedEntry(undefined, undefined, undefined, undefined, undefined, {
        user: { id: 'user_1', email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1' } },
      }),
    ).resolves.toEqual({
      items: [{ id: 'evt_gate_1' }],
      total: 1,
      limit: 50,
      offset: 0,
    });

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("event_type = 'dashboard_gated_entry_attempt'"),
      ['tenant_1', 168],
    );
  });

  it('rejects invalid pagination parameters for gated-entry list', async () => {
    const pool = { query: jest.fn() };
    const controller = new AuditController(pool as any);

    await expect(
      controller.listGatedEntry(undefined, '0', '50', '0', undefined, {
        user: { id: 'user_1', email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1' } },
      }),
    ).rejects.toThrow('fromHours must be between 1 and 720.');
  });

  it('rejects invalid sort parameter for gated-entry list', async () => {
    const pool = { query: jest.fn() };
    const controller = new AuditController(pool as any);

    await expect(
      controller.listGatedEntry(undefined, '24', '20', '0', 'sideways' as any, {
        user: { id: 'user_1', email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1' } },
      }),
    ).rejects.toThrow('sort must be desc or asc.');
  });

  it('exports tenant-scoped gated-entry telemetry as csv', async () => {
    const pool = {
      query: jest
        .fn()
        .mockResolvedValueOnce({
          rows: [
            {
              timestamp: '2026-04-15T12:00:00.000Z',
              payload: {
                gate: 'request_campaigns',
                role: 'buyer',
                feature: 'mvp_gated',
                redirectedPath: '/requests/new',
              },
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [] }),
    };
    const controller = new AuditController(pool as any);
    const response = { setHeader: jest.fn() };

    const csv = await controller.exportGatedEntryCsv(
      undefined,
      '24',
      'desc',
      {
        user: { id: 'user_1', email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1' } },
      },
      response as any,
    );

    expect(csv).toContain('captured_at,gate,role,feature,redirected_path');
    expect(csv).toContain('request_campaigns,buyer,mvp_gated,/requests/new');
    expect(response.setHeader).toHaveBeenCalledWith('X-Export-Row-Limit', '5000');
    expect(response.setHeader).toHaveBeenCalledWith('X-Export-Row-Count', '1');
    expect(response.setHeader).toHaveBeenCalledWith('X-Export-Truncated', 'false');
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("event_type = 'dashboard_gated_entry_attempt'"),
      ['tenant_1', 24],
    );
    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("event_type, payload"),
      expect.arrayContaining([
        'user_1',
        'dashboard-web',
        'dashboard_gated_entry_exported',
      ]),
    );
    const exportEventInsert = (pool.query as jest.Mock).mock.calls[1]?.[1]?.[3];
    expect(typeof exportEventInsert).toBe('string');
    expect(JSON.parse(exportEventInsert)).toEqual(
      expect.objectContaining({
        tenantId: 'tenant_1',
        exportedBy: 'farmer@example.com',
        format: 'csv',
      }),
    );
    expect(JSON.parse(exportEventInsert)).toEqual(
      expect.objectContaining({
        gate: 'all',
        fromHours: 24,
        sort: 'desc',
        rowCount: 1,
        rowLimit: 5000,
        truncated: false,
        exportedAt: expect.any(String),
      }),
    );
  });

  it('lists tenant-scoped gated-entry export activity events', async () => {
    const pool = {
      query: jest
        .fn()
        .mockResolvedValueOnce({ rows: [{ total: 1 }] })
        .mockResolvedValueOnce({
          rows: [{ id: 'evt_export_1', event_type: 'dashboard_gated_entry_exported' }],
        }),
    };
    const controller = new AuditController(pool as any);

    await expect(
      controller.listGatedEntryExports('24', '10', '0', 'desc', {
        user: { id: 'user_1', email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1' } },
      }),
    ).resolves.toEqual({
      items: [{ id: 'evt_export_1', event_type: 'dashboard_gated_entry_exported' }],
      total: 1,
      limit: 10,
      offset: 0,
    });
  });

  it('lists tenant-scoped assignment export activity events', async () => {
    const pool = {
      query: jest
        .fn()
        .mockResolvedValueOnce({ rows: [{ total: 2 }] })
        .mockResolvedValueOnce({
          rows: [
            { id: 'evt_assign_1', event_type: 'plot_assignment_export_requested' },
            { id: 'evt_assign_2', event_type: 'plot_assignment_export_succeeded' },
          ],
        }),
    };
    const controller = new AuditController(pool as any);

    await expect(
      controller.listAssignmentExports('24', '10', '0', 'desc', undefined, undefined, {
        user: { id: 'user_1', email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1' } },
      }),
    ).resolves.toEqual({
      items: [
        { id: 'evt_assign_1', event_type: 'plot_assignment_export_requested' },
        { id: 'evt_assign_2', event_type: 'plot_assignment_export_succeeded' },
      ],
      total: 2,
      limit: 10,
      offset: 0,
    });
  });

  it('applies assignment export phase/status filters when provided', async () => {
    const pool = {
      query: jest
        .fn()
        .mockResolvedValueOnce({ rows: [{ total: 1 }] })
        .mockResolvedValueOnce({
          rows: [{ id: 'evt_assign_2', event_type: 'plot_assignment_export_succeeded' }],
        }),
    };
    const controller = new AuditController(pool as any);

    await controller.listAssignmentExports('24', '10', '0', 'desc', 'succeeded', 'active', {
      user: { id: 'user_1', email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1' } },
    });

    expect(pool.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("payload ->> 'status'"),
      ['tenant_1', 24, 'plot_assignment_export_succeeded', 'active'],
    );
  });

  it('exports filtered assignment export activity as csv', async () => {
    const pool = {
      query: jest.fn().mockResolvedValue({
        rows: [
          {
            timestamp: '2026-04-16T12:00:00.000Z',
            user_id: '11111111-1111-1111-1111-111111111111',
            event_type: 'plot_assignment_export_failed',
            payload: {
              exportedBy: 'ops@tracebud.test',
              status: 'active',
              fromDays: 30,
              agentUserId: 'agent_1',
              rowCount: 0,
              error: 'network timeout',
            },
          },
        ],
      }),
    };
    const controller = new AuditController(pool as any);
    const response = { setHeader: jest.fn() };

    const csv = await controller.exportAssignmentExportsCsv(
      '24',
      'desc',
      'failed',
      'active',
      {
        user: { id: 'user_1', email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1' } },
      },
      response as any,
    );
    expect(csv).toContain('captured_at,actor,phase,status,from_days,agent_user_id,row_count,error');
    expect(csv).toContain('ops@tracebud.test,failed,active,30,agent_1,0,network timeout');
    expect(response.setHeader).toHaveBeenCalledWith('X-Export-Row-Limit', '5000');
    expect(response.setHeader).toHaveBeenCalledWith('X-Export-Row-Count', '1');
  });

  it('lists tenant-scoped risk-score activity events', async () => {
    const pool = {
      query: jest
        .fn()
        .mockResolvedValueOnce({ rows: [{ total: 2 }] })
        .mockResolvedValueOnce({
          rows: [
            { id: 'evt_risk_1', event_type: 'dds_package_risk_score_requested' },
            { id: 'evt_risk_2', event_type: 'dds_package_risk_score_medium' },
          ],
        }),
    };
    const controller = new AuditController(pool as any);

    await expect(
      controller.listRiskScoreActivity('24', '10', '0', 'desc', undefined, undefined, {
        user: { id: 'user_1', email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1' } },
      }),
    ).resolves.toEqual({
      items: [
        { id: 'evt_risk_1', event_type: 'dds_package_risk_score_requested' },
        { id: 'evt_risk_2', event_type: 'dds_package_risk_score_medium' },
      ],
      total: 2,
      limit: 10,
      offset: 0,
    });
  });

  it('applies risk-score phase/band filters when provided', async () => {
    const pool = {
      query: jest
        .fn()
        .mockResolvedValueOnce({ rows: [{ total: 1 }] })
        .mockResolvedValueOnce({
          rows: [{ id: 'evt_risk_2', event_type: 'dds_package_risk_score_medium' }],
        }),
    };
    const controller = new AuditController(pool as any);

    await controller.listRiskScoreActivity('24', '10', '0', 'desc', 'medium', 'medium', {
      user: { id: 'user_1', email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1' } },
    });

    expect(pool.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("payload ->> 'band'"),
      ['tenant_1', 24, 'dds_package_risk_score_medium', 'medium'],
    );
  });

  it('exports filtered risk-score activity as csv', async () => {
    const pool = {
      query: jest.fn().mockResolvedValue({
        rows: [
          {
            timestamp: '2026-04-16T12:00:00.000Z',
            user_id: '11111111-1111-1111-1111-111111111111',
            event_type: 'dds_package_risk_score_medium',
            payload: {
              exportedBy: 'ops@tracebud.test',
              packageId: 'pkg_1',
              provider: 'internal_v1',
              band: 'medium',
              score: 45,
              reasonCount: 1,
              scoredAt: '2026-04-16T12:00:00.000Z',
            },
          },
        ],
      }),
    };
    const controller = new AuditController(pool as any);
    const response = { setHeader: jest.fn() };

    const csv = await controller.exportRiskScoreActivityCsv(
      '24',
      'desc',
      'medium',
      'medium',
      {
        user: { id: 'user_1', email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1' } },
      },
      response as any,
    );
    expect(csv).toContain('captured_at,actor,phase,package_id,provider,band,score,reason_count,scored_at');
    expect(csv).toContain('ops@tracebud.test,medium,pkg_1,internal_v1,medium,45,1');
    expect(response.setHeader).toHaveBeenCalledWith('X-Export-Row-Limit', '5000');
    expect(response.setHeader).toHaveBeenCalledWith('X-Export-Row-Count', '1');
  });

  it('lists tenant-scoped filing activity events', async () => {
    const pool = {
      query: jest
        .fn()
        .mockResolvedValueOnce({ rows: [{ total: 2 }] })
        .mockResolvedValueOnce({
          rows: [
            { id: 'evt_file_1', event_type: 'dds_package_generation_generated' },
            { id: 'evt_file_2', event_type: 'dds_package_submission_accepted' },
          ],
        }),
    };
    const controller = new AuditController(pool as any);
    await expect(
      controller.listFilingActivity('24', '10', '0', 'desc', undefined, {
        user: { id: 'user_1', email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1' } },
      }),
    ).resolves.toEqual({
      items: [
        { id: 'evt_file_1', event_type: 'dds_package_generation_generated' },
        { id: 'evt_file_2', event_type: 'dds_package_submission_accepted' },
      ],
      total: 2,
      limit: 10,
      offset: 0,
    });
  });

  it('exports filtered filing activity as csv', async () => {
    const pool = {
      query: jest.fn().mockResolvedValue({
        rows: [
          {
            timestamp: '2026-04-16T12:00:00.000Z',
            user_id: '11111111-1111-1111-1111-111111111111',
            event_type: 'dds_package_submission_replayed',
            payload: {
              exportedBy: 'ops@tracebud.test',
              packageId: 'pkg_1',
              idempotencyKey: 'idem-1',
              submissionState: 'submitted',
              tracesReference: 'TRACES-123',
              replayed: true,
              persistedAt: '2026-04-16T12:00:00.000Z',
            },
          },
        ],
      }),
    };
    const controller = new AuditController(pool as any);
    const response = { setHeader: jest.fn() };
    const csv = await controller.exportFilingActivityCsv(
      '24',
      'desc',
      'submission_replayed',
      {
        user: { id: 'user_1', email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1' } },
      },
      response as any,
    );
    expect(csv).toContain('captured_at,actor,phase,package_id');
    expect(csv).toContain('ops@tracebud.test,submission_replayed,pkg_1');
    expect(response.setHeader).toHaveBeenCalledWith('X-Export-Row-Limit', '5000');
    expect(response.setHeader).toHaveBeenCalledWith('X-Export-Row-Count', '1');
  });

  it('lists tenant-scoped chat-thread activity events', async () => {
    const pool = {
      query: jest
        .fn()
        .mockResolvedValueOnce({ rows: [{ total: 1 }] })
        .mockResolvedValueOnce({
          rows: [{ id: 'evt_chat_1', event_type: 'chat_thread_created' }],
        }),
    };
    const controller = new AuditController(pool as any);
    await expect(
      controller.listChatThreadActivity('24', '10', '0', 'desc', 'created', {
        user: { id: 'user_1', email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1' } },
      }),
    ).resolves.toEqual({
      items: [{ id: 'evt_chat_1', event_type: 'chat_thread_created' }],
      total: 1,
      limit: 10,
      offset: 0,
    });
  });

  it('applies chat-thread lifecycle phase filters for resolved events', async () => {
    const pool = {
      query: jest
        .fn()
        .mockResolvedValueOnce({ rows: [{ total: 1 }] })
        .mockResolvedValueOnce({
          rows: [{ id: 'evt_chat_2', event_type: 'chat_thread_resolved' }],
        }),
    };
    const controller = new AuditController(pool as any);
    await controller.listChatThreadActivity('24', '10', '0', 'desc', 'resolved', {
      user: { id: 'user_1', email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1' } },
    });
    expect(pool.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('chat_thread_resolved'),
      ['tenant_1', 24, 'chat_thread_resolved'],
    );
  });

  it('lists tenant-scoped workflow activity events', async () => {
    const pool = {
      query: jest
        .fn()
        .mockResolvedValueOnce({ rows: [{ total: 1 }] })
        .mockResolvedValueOnce({
          rows: [{ id: 'evt_wf_1', event_type: 'workflow_stage_transitioned' }],
        }),
    };
    const controller = new AuditController(pool as any);
    await expect(
      controller.listWorkflowActivity('24', '10', '0', 'desc', 'stage_transitioned', undefined, {
        user: { id: 'user_1', email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1' } },
      }),
    ).resolves.toEqual({
      items: [{ id: 'evt_wf_1', event_type: 'workflow_stage_transitioned' }],
      total: 1,
      limit: 10,
      offset: 0,
    });
  });

  it('applies workflow phase/slaState filters when provided', async () => {
    const pool = {
      query: jest
        .fn()
        .mockResolvedValueOnce({ rows: [{ total: 1 }] })
        .mockResolvedValueOnce({
          rows: [{ id: 'evt_wf_1', event_type: 'workflow_stage_sla_warning' }],
        }),
    };
    const controller = new AuditController(pool as any);
    await controller.listWorkflowActivity('24', '10', '0', 'desc', 'sla_warning', 'warning', {
      user: { id: 'user_1', email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1' } },
    });
    expect(pool.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("payload ->> 'slaState'"),
      ['tenant_1', 24, 'workflow_stage_sla_warning', 'warning'],
    );
  });

  it('returns tenant-scoped dashboard diagnostics summary counters', async () => {
    const pool = {
      query: jest.fn().mockResolvedValue({
        rows: [
          {
            gated_entry_attempts: 2,
            assignment_export_events: 3,
            assignment_export_requested: 1,
            assignment_export_succeeded: 1,
            assignment_export_failed: 1,
            assignment_status_active: 2,
            assignment_status_completed: 1,
            assignment_status_cancelled: 0,
            risk_score_events: 4,
            risk_band_low: 1,
            risk_band_medium: 2,
            risk_band_high: 1,
            filing_activity_events: 5,
            filing_generation_events: 2,
            filing_submission_events: 3,
            chat_activity_events: 6,
            chat_created_events: 1,
            chat_posted_events: 2,
            chat_replayed_events: 1,
            chat_resolved_events: 1,
            chat_reopened_events: 1,
            chat_archived_events: 0,
            latest_event_at: '2026-04-16T12:00:00.000Z',
          },
        ],
      }),
    };
    const controller = new AuditController(pool as any);
    await expect(
      controller.getDashboardDiagnosticsSummary('24', {
        user: { id: 'user_1', email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1' } },
      }),
    ).resolves.toEqual({
      tenantId: 'tenant_1',
      fromHours: 24,
      totalDiagnostics: 20,
      counters: {
        gatedEntryAttempts: 2,
        assignmentExportEvents: 3,
        riskScoreEvents: 4,
        filingActivityEvents: 5,
        chatActivityEvents: 6,
      },
      breakdown: {
        assignmentPhase: { requested: 1, succeeded: 1, failed: 1 },
        assignmentStatus: { active: 2, completed: 1, cancelled: 0 },
        riskBand: { low: 1, medium: 2, high: 1 },
        filingFamily: { generation: 2, submission: 3 },
        chatPhase: { created: 1, posted: 2, replayed: 1, resolved: 1, reopened: 1, archived: 0 },
      },
      readiness: {
        hasAnyDiagnostics: true,
        canExportDetailed: true,
        latestEventAt: '2026-04-16T12:00:00.000Z',
      },
    });
  });

  it('returns non-export-ready summary when diagnostics are empty', async () => {
    const pool = {
      query: jest.fn().mockResolvedValue({
        rows: [
          {
            gated_entry_attempts: 0,
            assignment_export_events: 0,
            assignment_export_requested: 0,
            assignment_export_succeeded: 0,
            assignment_export_failed: 0,
            assignment_status_active: 0,
            assignment_status_completed: 0,
            assignment_status_cancelled: 0,
            risk_score_events: 0,
            risk_band_low: 0,
            risk_band_medium: 0,
            risk_band_high: 0,
            filing_activity_events: 0,
            filing_generation_events: 0,
            filing_submission_events: 0,
            chat_activity_events: 0,
            chat_created_events: 0,
            chat_posted_events: 0,
            chat_replayed_events: 0,
            chat_resolved_events: 0,
            chat_reopened_events: 0,
            chat_archived_events: 0,
            latest_event_at: null,
          },
        ],
      }),
    };
    const controller = new AuditController(pool as any);
    await expect(
      controller.getDashboardDiagnosticsSummary('24', {
        user: { id: 'user_1', email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1' } },
      }),
    ).resolves.toEqual({
      tenantId: 'tenant_1',
      fromHours: 24,
      totalDiagnostics: 0,
      counters: {
        gatedEntryAttempts: 0,
        assignmentExportEvents: 0,
        riskScoreEvents: 0,
        filingActivityEvents: 0,
        chatActivityEvents: 0,
      },
      breakdown: {
        assignmentPhase: { requested: 0, succeeded: 0, failed: 0 },
        assignmentStatus: { active: 0, completed: 0, cancelled: 0 },
        riskBand: { low: 0, medium: 0, high: 0 },
        filingFamily: { generation: 0, submission: 0 },
        chatPhase: { created: 0, posted: 0, replayed: 0, resolved: 0, reopened: 0, archived: 0 },
      },
      readiness: {
        hasAnyDiagnostics: false,
        canExportDetailed: false,
        latestEventAt: null,
      },
    });
  });

  it('resolves tenant-scoped actor labels for requested user ids', async () => {
    const pool = {
      query: jest.fn().mockResolvedValue({
        rows: [
          {
            user_id: '11111111-1111-1111-1111-111111111111',
            exported_by: 'ops@tracebud.test',
            user_name: 'Ops Exporter',
          },
          {
            user_id: '22222222-2222-2222-2222-222222222222',
            exported_by: null,
            user_name: 'Fallback User',
          },
        ],
      }),
    };
    const controller = new AuditController(pool as any);

    await expect(
      controller.resolveGatedEntryActors(
        '11111111-1111-1111-1111-111111111111,22222222-2222-2222-2222-222222222222',
        {
          user: { id: 'user_1', email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1' } },
        },
      ),
    ).resolves.toEqual({
      actors: {
        '11111111-1111-1111-1111-111111111111': 'ops@tracebud.test',
        '22222222-2222-2222-2222-222222222222': 'Fallback User',
      },
    });
  });

  it('rejects actor lookup when ids include invalid uuid values', async () => {
    const pool = { query: jest.fn() };
    const controller = new AuditController(pool as any);

    await expect(
      controller.resolveGatedEntryActors('not-a-uuid,11111111-1111-1111-1111-111111111111', {
        user: { id: 'user_1', email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1' } },
      }),
    ).rejects.toThrow('ids must be UUID values.');
    expect(pool.query).not.toHaveBeenCalled();
  });

  it('rejects actor lookup when ids are missing', async () => {
    const pool = { query: jest.fn() };
    const controller = new AuditController(pool as any);

    await expect(
      controller.resolveGatedEntryActors(undefined, {
        user: { id: 'user_1', email: 'farmer@example.com', app_metadata: { tenant_id: 'tenant_1' } },
      }),
    ).rejects.toThrow('ids is required.');
    expect(pool.query).not.toHaveBeenCalled();
  });
});
