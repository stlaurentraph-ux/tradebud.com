import { ForbiddenException } from '@nestjs/common';
import { CoolFarmSaiV2Controller } from './coolfarm-sai-v2.controller';

describe('CoolFarmSaiV2Controller', () => {
  it('rejects schema access when tenant claim is missing', () => {
    const controller = new CoolFarmSaiV2Controller({ query: jest.fn() } as any);
    expect(() =>
      controller.getQuestionnaireSchema(undefined, {
        user: { id: 'user_1', email: 'exporter+ops@tracebud.com' },
      }),
    ).toThrow(ForbiddenException);
  });

  it('rejects schema access for farmer role', () => {
    const controller = new CoolFarmSaiV2Controller({ query: jest.fn() } as any);
    expect(() =>
      controller.getQuestionnaireSchema(undefined, {
        user: {
          id: 'user_1',
          email: 'farmer@example.com',
          app_metadata: { tenant_id: 'tenant_1', role: 'farmer' },
        },
      }),
    ).toThrow('Only exporter, agent, admin, or compliance manager can access V2 schema');
  });

  it('returns annuals schema by default', () => {
    const controller = new CoolFarmSaiV2Controller({ query: jest.fn() } as any);
    const result = controller.getQuestionnaireSchema(undefined, {
      user: {
        id: 'user_1',
        email: 'exporter+ops@tracebud.com',
        app_metadata: { tenant_id: 'tenant_1', role: 'exporter' },
      },
    });
    expect(result.schema.schemaId).toBe('farmQuestionnaireV1');
    expect(result.schema.pathway).toBe('annuals');
    expect(result.mappingRegistry.mappingId).toBe('farmQuestionnaireMappingV1');
    expect(result.mappingRegistry.pathway).toBe('annuals');
    expect(result.mappingRegistry.mappings.length).toBeGreaterThan(0);
    expect(result.rollout.featureFlag).toBe('coolfarm_sai_v2_enabled');
    expect(result.rollout.mode).toBe('shadow');
  });

  it('returns rice schema with paddy section for rice pathway', () => {
    const controller = new CoolFarmSaiV2Controller({ query: jest.fn() } as any);
    const result = controller.getQuestionnaireSchema('rice', {
      user: {
        id: 'user_1',
        email: 'agent+ops@tracebud.com',
        app_metadata: { tenant_id: 'tenant_1', role: 'agent' },
      },
    });
    expect(result.schema.pathway).toBe('rice');
    expect(result.schema.sections.some((section) => section.id === 'paddy_management')).toBe(true);
    expect(result.mappingRegistry.pathway).toBe('rice');
    expect(
      result.mappingRegistry.mappings.some(
        (mapping) => mapping.sectionId === 'paddy_management' && mapping.fieldId === 'paddy_water_regime',
      ),
    ).toBe(true);
  });

  it('rejects save draft when idempotency key is missing', async () => {
    const controller = new CoolFarmSaiV2Controller({ query: jest.fn() } as any);
    await expect(
      controller.saveQuestionnaireDraft(
        {
          pathway: 'annuals',
          response: {},
        },
        {
          user: {
            id: 'user_1',
            app_metadata: { tenant_id: 'tenant_1', role: 'exporter' },
          },
        },
      ),
    ).rejects.toThrow('idempotencyKey is required');
  });

  it('saves draft with upsert + audit', async () => {
    const pool = {
      query: jest
        .fn()
        .mockResolvedValueOnce({
          rows: [{ id: 'draft_1', status: 'draft', created_at: '2026-04-20T00:00:00.000Z', updated_at: '2026-04-20T00:00:00.000Z' }],
        })
        .mockResolvedValueOnce({ rows: [] }),
    };
    const controller = new CoolFarmSaiV2Controller(pool as any);
    const result = await controller.saveQuestionnaireDraft(
      {
        pathway: 'rice',
        idempotencyKey: 'idem_v2_1',
        response: { crop_details: { crop_type: 'Rice' } },
        metadata: { source: 'manual' },
      },
      {
        user: {
          id: 'user_1',
          app_metadata: { tenant_id: 'tenant_1', role: 'admin' },
        },
      },
    );

    expect(result).toEqual(
      expect.objectContaining({
        id: 'draft_1',
        status: 'draft',
        pathway: 'rice',
        schemaId: 'farmQuestionnaireV1',
        mappingVersion: '0.1.0-draft',
        idempotencyKey: 'idem_v2_1',
      }),
    );
    expect(pool.query).toHaveBeenCalledTimes(2);
    expect(pool.query).toHaveBeenNthCalledWith(
      2,
      expect.any(String),
      expect.arrayContaining(['tenant_1', 'draft_1', 'integration_v2_questionnaire_draft_saved']),
    );
  });

  it('submits draft and records run + audit', async () => {
    const pool = {
      query: jest
        .fn()
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 'draft_1', status: 'draft' }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ id: 'run_1' }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] }),
    };
    const controller = new CoolFarmSaiV2Controller(pool as any);
    const result = await controller.submitQuestionnaireDraft('draft_1', {
      user: {
        id: 'user_1',
        app_metadata: { tenant_id: 'tenant_1', role: 'admin' },
      },
    });

    expect(result).toEqual({
      id: 'draft_1',
      status: 'submitted',
      run: {
        id: 'run_1',
        type: 'validation',
        status: 'completed',
      },
    });
    expect(pool.query).toHaveBeenCalledTimes(5);
    expect(pool.query).toHaveBeenNthCalledWith(
      5,
      expect.any(String),
      expect.arrayContaining(['tenant_1', 'draft_1', 'integration_v2_questionnaire_submitted']),
    );
  });

  it('rejects submit when draft is not in draft state', async () => {
    const pool = {
      query: jest.fn().mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 'draft_1', status: 'submitted' }] }),
    };
    const controller = new CoolFarmSaiV2Controller(pool as any);
    await expect(
      controller.submitQuestionnaireDraft('draft_1', {
        user: {
          id: 'user_1',
          app_metadata: { tenant_id: 'tenant_1', role: 'admin' },
        },
      }),
    ).rejects.toThrow('Invalid transition: submitted -> submitted');
  });

  it('executes run and marks it completed', async () => {
    const pool = {
      query: jest
        .fn()
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 'draft_1', status: 'submitted' }] })
        .mockResolvedValueOnce({ rows: [{ id: 'run_2' }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] }),
    };
    const controller = new CoolFarmSaiV2Controller(pool as any);
    const result = await controller.executeQuestionnaireRun(
      'draft_1',
      { runType: 'validation', shouldFail: false },
      {
        user: {
          id: 'user_1',
          app_metadata: { tenant_id: 'tenant_1', role: 'admin' },
        },
      },
    );
    expect(result).toEqual({
      questionnaireId: 'draft_1',
      run: {
        id: 'run_2',
        type: 'validation',
        status: 'completed',
      },
    });
  });

  it('executes run and marks it failed', async () => {
    const pool = {
      query: jest
        .fn()
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 'draft_1', status: 'submitted' }] })
        .mockResolvedValueOnce({ rows: [{ id: 'run_3' }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] }),
    };
    const controller = new CoolFarmSaiV2Controller(pool as any);
    const result = await controller.executeQuestionnaireRun(
      'draft_1',
      { runType: 'scoring', shouldFail: true, reason: 'missing required field' },
      {
        user: {
          id: 'user_1',
          app_metadata: { tenant_id: 'tenant_1', role: 'admin' },
        },
      },
    );
    expect(result).toEqual({
      questionnaireId: 'draft_1',
      run: {
        id: 'run_3',
        type: 'scoring',
        status: 'failed',
      },
    });
  });

  it('lists questionnaire run history', async () => {
    const pool = {
      query: jest.fn().mockResolvedValueOnce({
        rows: [{ id: 'run_3', run_type: 'scoring', status: 'failed' }],
      }),
    };
    const controller = new CoolFarmSaiV2Controller(pool as any);
    const result = await controller.listQuestionnaireRuns('draft_1', {
      user: {
        id: 'user_1',
        app_metadata: { tenant_id: 'tenant_1', role: 'agent' },
      },
    });
    expect(result).toEqual({
      questionnaireId: 'draft_1',
      items: [{ id: 'run_3', run_type: 'scoring', status: 'failed' }],
    });
  });

  it('returns run summary counts and latest run', async () => {
    const pool = {
      query: jest
        .fn()
        .mockResolvedValueOnce({
          rows: [
            { status: 'completed', count: '2' },
            { status: 'failed', count: '1' },
          ],
        })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'run_9',
              questionnaire_id: 'draft_1',
              run_type: 'scoring',
              status: 'failed',
              started_at: '2026-04-20T00:00:00.000Z',
            },
          ],
        })
        .mockResolvedValueOnce({
          rows: [{ count: '1' }],
        })
        .mockResolvedValueOnce({
          rows: [
            {
              created_at: '2026-04-20T00:10:00.000Z',
              payload: { triggerSource: 'scheduled', releasedCount: 2 },
            },
          ],
        }),
    };
    const controller = new CoolFarmSaiV2Controller(pool as any);
    const result = await controller.getRunSummary({
      user: {
        id: 'user_1',
        app_metadata: { tenant_id: 'tenant_1', role: 'compliance_manager' },
      },
    });
    expect(result).toEqual({
      tenantId: 'tenant_1',
      counts: { started: 0, completed: 2, failed: 1 },
      staleClaimCount: 1,
      lastSweeperRun: {
        created_at: '2026-04-20T00:10:00.000Z',
        payload: { triggerSource: 'scheduled', releasedCount: 2 },
      },
      lastSweeperReleasedCount: 2,
      lastSweeperTriggerSource: 'scheduled',
      lastSweeperTokenVersion: null,
      latestRun: {
        id: 'run_9',
        questionnaire_id: 'draft_1',
        run_type: 'scoring',
        status: 'failed',
        started_at: '2026-04-20T00:00:00.000Z',
      },
    });
  });

  it('releases stale claims', async () => {
    const pool = {
      query: jest
        .fn()
        .mockResolvedValueOnce({
          rows: [
            { id: 'run_due_1', questionnaire_id: 'draft_1' },
            { id: 'run_due_2', questionnaire_id: 'draft_2' },
          ],
        })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] }),
    };
    const controller = new CoolFarmSaiV2Controller(pool as any);
    const result = await controller.releaseStaleClaims(
      { staleMinutes: 30, limit: 10 },
      {
        user: {
          id: 'user_1',
          app_metadata: { tenant_id: 'tenant_1', role: 'admin' },
        },
      },
    );
    expect(result).toEqual({
      tenantId: 'tenant_1',
      staleMinutes: 30,
      scannedLimit: 10,
      triggerSource: 'manual',
      releasedCount: 2,
      releasedRunIds: ['run_due_1', 'run_due_2'],
    });
  });

  it('returns no-op when no stale claims are found', async () => {
    const pool = {
      query: jest.fn().mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [] }),
    };
    const controller = new CoolFarmSaiV2Controller(pool as any);
    const result = await controller.releaseStaleClaims(
      {},
      {
        user: {
          id: 'user_1',
          app_metadata: { tenant_id: 'tenant_1', role: 'admin' },
        },
      },
    );
    expect(result).toEqual({
      tenantId: 'tenant_1',
      staleMinutes: 60,
      scannedLimit: 50,
      triggerSource: 'manual',
      releasedCount: 0,
      releasedRunIds: [],
    });
  });

  it('supports scheduled trigger source for stale sweeper', async () => {
    const pool = {
      query: jest.fn().mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [] }),
    };
    const controller = new CoolFarmSaiV2Controller(pool as any);
    const result = await controller.releaseStaleClaims(
      { triggerSource: 'scheduled', staleMinutes: 120, limit: 5 },
      {
        user: {
          id: 'user_1',
          app_metadata: { tenant_id: 'tenant_1', role: 'admin' },
        },
      },
    );
    expect(result).toEqual({
      tenantId: 'tenant_1',
      staleMinutes: 120,
      scannedLimit: 5,
      triggerSource: 'scheduled',
      releasedCount: 0,
      releasedRunIds: [],
    });
  });

  it('supports scheduler trigger endpoint wrapper', async () => {
    process.env.COOLFARM_SAI_V2_SCHEDULER_TOKEN = 'scheduler-secret';
    process.env.COOLFARM_SAI_V2_SCHEDULER_TOKEN_VERSION = 'v4';
    const pool = {
      query: jest.fn().mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [] }),
    };
    const controller = new CoolFarmSaiV2Controller(pool as any);
    const result = await controller.triggerScheduledStaleSweeper(
      { staleMinutes: 15, limit: 3 },
      'scheduler-secret',
      {
        user: {
          id: 'user_1',
          app_metadata: { tenant_id: 'tenant_1', role: 'admin' },
        },
      },
    );
    expect(result).toEqual({
      tenantId: 'tenant_1',
      staleMinutes: 15,
      scannedLimit: 3,
      triggerSource: 'scheduled',
      schedulerTokenVersion: 'v4',
      releasedCount: 0,
      releasedRunIds: [],
      schedulerContract: true,
    });
    delete process.env.COOLFARM_SAI_V2_SCHEDULER_TOKEN;
    delete process.env.COOLFARM_SAI_V2_SCHEDULER_TOKEN_VERSION;
  });

  it('rejects scheduler trigger without configured token', async () => {
    delete process.env.COOLFARM_SAI_V2_SCHEDULER_TOKEN;
    const controller = new CoolFarmSaiV2Controller({ query: jest.fn() } as any);
    await expect(
      controller.triggerScheduledStaleSweeper(
        { staleMinutes: 15, limit: 3 },
        'scheduler-secret',
        {
          user: {
            id: 'user_1',
            app_metadata: { tenant_id: 'tenant_1', role: 'admin' },
          },
        },
      ),
    ).rejects.toThrow('COOLFARM_SAI_V2_SCHEDULER_TOKEN is not configured');
  });

  it('rejects scheduler trigger with invalid token', async () => {
    process.env.COOLFARM_SAI_V2_SCHEDULER_TOKEN = 'scheduler-secret';
    const controller = new CoolFarmSaiV2Controller({ query: jest.fn() } as any);
    await expect(
      controller.triggerScheduledStaleSweeper(
        { staleMinutes: 15, limit: 3 },
        'wrong-token',
        {
          user: {
            id: 'user_1',
            app_metadata: { tenant_id: 'tenant_1', role: 'admin' },
          },
        },
      ),
    ).rejects.toThrow('Invalid scheduler token');
    delete process.env.COOLFARM_SAI_V2_SCHEDULER_TOKEN;
  });

  it('lists retry-ready queue rows', async () => {
    const pool = {
      query: jest.fn().mockResolvedValueOnce({
        rows: [
          {
            id: 'run_due_1',
            questionnaire_id: 'draft_1',
            run_type: 'scoring',
            status: 'failed',
            attempt_count: 2,
            error_code: 'V2_SHADOW_RETRY_FAILED',
            next_retry_at: '2026-04-20T00:00:00.000Z',
            claimed_by_user_id: null,
            claimed_at: null,
            updated_at: '2026-04-20T00:01:00.000Z',
          },
        ],
      }),
    };
    const controller = new CoolFarmSaiV2Controller(pool as any);
    const result = await controller.listRetryQueue(undefined, {
      user: {
        id: 'user_1',
        app_metadata: { tenant_id: 'tenant_1', role: 'compliance_manager' },
      },
    });
    expect(result).toEqual({
      tenantId: 'tenant_1',
      limit: 50,
      dueCount: 1,
      items: [
        {
          id: 'run_due_1',
          questionnaire_id: 'draft_1',
          run_type: 'scoring',
          status: 'failed',
          attempt_count: 2,
          error_code: 'V2_SHADOW_RETRY_FAILED',
          next_retry_at: '2026-04-20T00:00:00.000Z',
          claimed_by_user_id: null,
          claimed_at: null,
          updated_at: '2026-04-20T00:01:00.000Z',
        },
      ],
    });
  });

  it('rejects retry queue invalid limit', async () => {
    const controller = new CoolFarmSaiV2Controller({ query: jest.fn() } as any);
    await expect(
      controller.listRetryQueue('0', {
        user: {
          id: 'user_1',
          app_metadata: { tenant_id: 'tenant_1', role: 'admin' },
        },
      }),
    ).rejects.toThrow('limit must be between 1 and 200');
  });

  it('claims due failed run and records claim audit', async () => {
    const pool = {
      query: jest
        .fn()
        .mockResolvedValueOnce({
          rowCount: 1,
          rows: [
            {
              id: 'run_due_1',
              questionnaire_id: 'draft_1',
              run_type: 'scoring',
              status: 'failed',
              claimed_at: '2026-04-20T00:02:00.000Z',
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [] }),
    };
    const controller = new CoolFarmSaiV2Controller(pool as any);
    const result = await controller.claimRetryRun('run_due_1', {
      user: {
        id: 'user_1',
        app_metadata: { tenant_id: 'tenant_1', role: 'admin' },
      },
    });
    expect(result).toEqual({
      id: 'run_due_1',
      questionnaireId: 'draft_1',
      runType: 'scoring',
      status: 'failed',
      claimedAt: '2026-04-20T00:02:00.000Z',
    });
    expect(pool.query).toHaveBeenCalledTimes(2);
  });

  it('rejects claim when run is not claimable', async () => {
    const pool = {
      query: jest.fn().mockResolvedValueOnce({ rowCount: 0, rows: [] }),
    };
    const controller = new CoolFarmSaiV2Controller(pool as any);
    await expect(
      controller.claimRetryRun('run_due_1', {
        user: {
          id: 'user_1',
          app_metadata: { tenant_id: 'tenant_1', role: 'admin' },
        },
      }),
    ).rejects.toThrow('Run is not claimable');
  });

  it('releases claimed run by same actor', async () => {
    const pool = {
      query: jest
        .fn()
        .mockResolvedValueOnce({
          rowCount: 1,
          rows: [
            {
              id: 'run_due_1',
              questionnaire_id: 'draft_1',
              status: 'failed',
              claimed_by_user_id: 'user_1',
              claimed_at: '2026-04-20T00:03:00.000Z',
            },
          ],
        })
        .mockResolvedValueOnce({
          rows: [{ id: 'run_due_1', questionnaire_id: 'draft_1', status: 'failed' }],
        })
        .mockResolvedValueOnce({ rows: [] }),
    };
    const controller = new CoolFarmSaiV2Controller(pool as any);
    const result = await controller.releaseRun(
      'run_due_1',
      { reason: 'worker_shutdown' },
      {
        user: {
          id: 'user_1',
          app_metadata: { tenant_id: 'tenant_1', role: 'admin' },
        },
      },
    );
    expect(result).toEqual({
      id: 'run_due_1',
      questionnaireId: 'draft_1',
      status: 'failed',
      released: true,
      forced: false,
    });
  });

  it('rejects release when run claimed by different actor without force', async () => {
    const pool = {
      query: jest.fn().mockResolvedValueOnce({
        rowCount: 1,
        rows: [
          {
            id: 'run_due_1',
            questionnaire_id: 'draft_1',
            status: 'failed',
            claimed_by_user_id: 'user_2',
            claimed_at: '2026-04-20T00:03:00.000Z',
          },
        ],
      }),
    };
    const controller = new CoolFarmSaiV2Controller(pool as any);
    await expect(
      controller.releaseRun(
        'run_due_1',
        {},
        {
          user: {
            id: 'user_1',
            app_metadata: { tenant_id: 'tenant_1', role: 'admin' },
          },
        },
      ),
    ).rejects.toThrow('Run is claimed by a different actor; use force=true to release');
  });

  it('allows force release for differently claimed run', async () => {
    const pool = {
      query: jest
        .fn()
        .mockResolvedValueOnce({
          rowCount: 1,
          rows: [
            {
              id: 'run_due_1',
              questionnaire_id: 'draft_1',
              status: 'failed',
              claimed_by_user_id: 'user_2',
              claimed_at: '2026-04-20T00:03:00.000Z',
            },
          ],
        })
        .mockResolvedValueOnce({
          rows: [{ id: 'run_due_1', questionnaire_id: 'draft_1', status: 'failed' }],
        })
        .mockResolvedValueOnce({ rows: [] }),
    };
    const controller = new CoolFarmSaiV2Controller(pool as any);
    const result = await controller.releaseRun(
      'run_due_1',
      { force: true, reason: 'stale_claim_timeout' },
      {
        user: {
          id: 'user_1',
          app_metadata: { tenant_id: 'tenant_1', role: 'admin' },
        },
      },
    );
    expect(result).toEqual({
      id: 'run_due_1',
      questionnaireId: 'draft_1',
      status: 'failed',
      released: true,
      forced: true,
    });
  });

  it('retries failed run and marks completed', async () => {
    const pool = {
      query: jest
        .fn()
        .mockResolvedValueOnce({
          rowCount: 1,
          rows: [
            {
              id: 'run_3',
              questionnaire_id: 'draft_1',
              run_type: 'scoring',
              status: 'failed',
              attempt_count: 1,
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] }),
    };
    const controller = new CoolFarmSaiV2Controller(pool as any);
    const result = await controller.retryRun(
      'run_3',
      { shouldFail: false },
      {
        user: {
          id: 'user_1',
          app_metadata: { tenant_id: 'tenant_1', role: 'admin' },
        },
      },
    );
    expect(result).toEqual({
      runId: 'run_3',
      questionnaireId: 'draft_1',
      runType: 'scoring',
      attemptCount: 2,
      status: 'completed',
    });
  });

  it('rejects retry when run is not failed', async () => {
    const pool = {
      query: jest.fn().mockResolvedValueOnce({
        rowCount: 1,
        rows: [
          {
            id: 'run_3',
            questionnaire_id: 'draft_1',
            run_type: 'scoring',
            status: 'completed',
            attempt_count: 1,
          },
        ],
      }),
    };
    const controller = new CoolFarmSaiV2Controller(pool as any);
    await expect(
      controller.retryRun(
        'run_3',
        { shouldFail: false },
        {
          user: {
            id: 'user_1',
            app_metadata: { tenant_id: 'tenant_1', role: 'admin' },
          },
        },
      ),
    ).rejects.toThrow('Only failed runs can be retried');
  });

  it('rejects retry when max attempts reached and records exhaustion event', async () => {
    const pool = {
      query: jest
        .fn()
        .mockResolvedValueOnce({
          rowCount: 1,
          rows: [
            {
              id: 'run_4',
              questionnaire_id: 'draft_1',
              run_type: 'validation',
              status: 'failed',
              attempt_count: 5,
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [] }),
    };
    const controller = new CoolFarmSaiV2Controller(pool as any);
    await expect(
      controller.retryRun(
        'run_4',
        { shouldFail: false },
        {
          user: {
            id: 'user_1',
            app_metadata: { tenant_id: 'tenant_1', role: 'admin' },
          },
        },
      ),
    ).rejects.toThrow('Retry limit reached (5)');
    expect(pool.query).toHaveBeenCalledTimes(2);
    expect(pool.query).toHaveBeenNthCalledWith(
      2,
      expect.any(String),
      expect.arrayContaining(['tenant_1', 'draft_1', 'integration_v2_run_retry_exhausted']),
    );
  });
});

