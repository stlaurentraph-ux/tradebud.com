import { ForbiddenException } from '@nestjs/common';
import { Pool } from 'pg';
import { AuditController } from './audit.controller';

const testDbUrl = process.env.TEST_DATABASE_URL;
const describeIfDb = testDbUrl ? describe : describe.skip;
const schema = `tb_audit_gated_entry_test_${process.pid}_${Date.now().toString(36)}`;

function withSearchPath(connectionString: string, targetSchema: string) {
  const url = new URL(connectionString);
  url.searchParams.set('options', `-c search_path=${targetSchema},public`);
  return url.toString();
}

describeIfDb('AuditController integration: gated-entry telemetry listing', () => {
  let pool: Pool;
  let controller: AuditController;

  beforeAll(async () => {
    pool = new Pool({
      connectionString: withSearchPath(testDbUrl!, schema),
      ssl: { rejectUnauthorized: false },
      max: 1,
    });

    await pool.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    await pool.query(`CREATE SCHEMA IF NOT EXISTS ${schema}`);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        user_id UUID NULL,
        device_id TEXT NULL,
        event_type TEXT NOT NULL,
        payload JSONB NOT NULL DEFAULT '{}'::jsonb
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_account (
        id UUID PRIMARY KEY,
        role TEXT NULL,
        name TEXT NULL
      )
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_log_gated_entry_tenant_gate_ts
      ON audit_log (
        event_type,
        (payload ->> 'tenantId'),
        (payload ->> 'gate'),
        timestamp DESC
      )
    `);

    controller = new AuditController(pool as any);
  }, 20_000);

  afterAll(async () => {
    await pool.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    await pool.end();
  });

  beforeEach(async () => {
    await pool.query(`SET search_path TO ${schema},public`);
    await pool.query('DELETE FROM audit_log');
    await pool.query(
      `
        INSERT INTO audit_log (event_type, payload)
        VALUES
          ('dashboard_gated_entry_attempt', '{"tenantId":"tenant_1","gate":"request_campaigns"}'::jsonb),
          ('dashboard_gated_entry_attempt', '{"tenantId":"tenant_2","gate":"annual_reporting"}'::jsonb),
          ('shipment_created', '{"tenantId":"tenant_1"}'::jsonb)
      `,
    );
  });

  it('rejects gated-entry list when tenant claim is missing', async () => {
    await expect(
      controller.listGatedEntry(undefined, undefined, undefined, undefined, undefined, {
        user: { id: 'user_1', email: 'exporter+demo@tracebud.com' },
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('returns only dashboard gated-entry events for signed tenant claim', async () => {
    const rows = await controller.listGatedEntry(undefined, undefined, undefined, undefined, undefined, {
      user: { id: 'user_1', email: 'exporter+demo@tracebud.com', app_metadata: { tenant_id: 'tenant_1' } },
    });

    expect(rows.items).toHaveLength(1);
    expect(rows.items[0]).toEqual(
      expect.objectContaining({
        event_type: 'dashboard_gated_entry_attempt',
        payload: expect.objectContaining({ tenantId: 'tenant_1' }),
      }),
    );
    expect(rows.total).toBe(1);
  });

  it('resolves actor labels for tenant-scoped export events only', async () => {
    await pool.query(
      `
        INSERT INTO user_account (id, role, name)
        VALUES
          ('11111111-1111-1111-1111-111111111111'::uuid, 'exporter', 'Tenant One User'),
          ('22222222-2222-2222-2222-222222222222'::uuid, 'exporter', 'Tenant Two User'),
          ('33333333-3333-3333-3333-333333333333'::uuid, 'exporter', 'Tenant One Named Fallback')
        ON CONFLICT (id) DO UPDATE
        SET name = EXCLUDED.name
      `,
    );
    await pool.query(
      `
        INSERT INTO audit_log (user_id, event_type, payload)
        VALUES
          (
            '11111111-1111-1111-1111-111111111111'::uuid,
            'dashboard_gated_entry_exported',
            '{"tenantId":"tenant_1","exportedBy":"ops@tracebud.test","format":"csv"}'::jsonb
          ),
          (
            '22222222-2222-2222-2222-222222222222'::uuid,
            'dashboard_gated_entry_exported',
            '{"tenantId":"tenant_2","exportedBy":"other@tracebud.test","format":"csv"}'::jsonb
          ),
          (
            '33333333-3333-3333-3333-333333333333'::uuid,
            'dashboard_gated_entry_exported',
            '{"tenantId":"tenant_1","format":"csv"}'::jsonb
          )
      `,
    );

    const resolved = await controller.resolveGatedEntryActors(
      '11111111-1111-1111-1111-111111111111,22222222-2222-2222-2222-222222222222,33333333-3333-3333-3333-333333333333',
      {
        user: { id: 'user_1', email: 'exporter+demo@tracebud.com', app_metadata: { tenant_id: 'tenant_1' } },
      },
    );

    expect(resolved).toEqual({
      actors: {
        '11111111-1111-1111-1111-111111111111': 'ops@tracebud.test',
        '22222222-2222-2222-2222-222222222222': 'user:22222222-2222-2222-2222-222222222222',
        '33333333-3333-3333-3333-333333333333': 'Tenant One Named Fallback',
      },
    });
  });

  it('returns tenant-scoped assignment export events with contract payload fields', async () => {
    await pool.query(
      `
        INSERT INTO audit_log (user_id, event_type, payload)
        VALUES
          (
            '11111111-1111-1111-1111-111111111111'::uuid,
            'plot_assignment_export_succeeded',
            '{
              "tenantId":"tenant_1",
              "plotId":"plot_1",
              "exportedBy":"ops@tracebud.test",
              "rowCount":3,
              "status":"active",
              "fromDays":14,
              "agentUserId":"agent_1",
              "error":null
            }'::jsonb
          ),
          (
            '22222222-2222-2222-2222-222222222222'::uuid,
            'plot_assignment_export_failed',
            '{
              "tenantId":"tenant_2",
              "plotId":"plot_other",
              "exportedBy":"other@tracebud.test",
              "rowCount":0,
              "status":"cancelled",
              "fromDays":30,
              "agentUserId":null,
              "error":"timeout"
            }'::jsonb
          )
      `,
    );

    const result = await controller.listAssignmentExports('24', '20', '0', 'desc', undefined, undefined, {
      user: { id: 'user_1', email: 'exporter+demo@tracebud.com', app_metadata: { tenant_id: 'tenant_1' } },
    });

    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toEqual(
      expect.objectContaining({
        event_type: 'plot_assignment_export_succeeded',
        payload: expect.objectContaining({
          tenantId: 'tenant_1',
          plotId: 'plot_1',
          exportedBy: 'ops@tracebud.test',
          rowCount: 3,
          status: 'active',
          fromDays: 14,
          agentUserId: 'agent_1',
          error: null,
        }),
      }),
    );
  });

  it('applies combined assignment export phase/status filters on tenant-scoped reads', async () => {
    await pool.query(
      `
        INSERT INTO audit_log (user_id, event_type, payload)
        VALUES
          (
            '11111111-1111-1111-1111-111111111111'::uuid,
            'plot_assignment_export_failed',
            '{
              "tenantId":"tenant_1",
              "plotId":"plot_1",
              "exportedBy":"ops@tracebud.test",
              "rowCount":0,
              "status":"active",
              "fromDays":14,
              "agentUserId":"agent_1",
              "error":"timeout"
            }'::jsonb
          ),
          (
            '11111111-1111-1111-1111-111111111111'::uuid,
            'plot_assignment_export_failed',
            '{
              "tenantId":"tenant_1",
              "plotId":"plot_1",
              "exportedBy":"ops@tracebud.test",
              "rowCount":0,
              "status":"cancelled",
              "fromDays":14,
              "agentUserId":"agent_1",
              "error":"cancelled"
            }'::jsonb
          ),
          (
            '11111111-1111-1111-1111-111111111111'::uuid,
            'plot_assignment_export_succeeded',
            '{
              "tenantId":"tenant_1",
              "plotId":"plot_1",
              "exportedBy":"ops@tracebud.test",
              "rowCount":5,
              "status":"active",
              "fromDays":14,
              "agentUserId":"agent_1",
              "error":null
            }'::jsonb
          ),
          (
            '22222222-2222-2222-2222-222222222222'::uuid,
            'plot_assignment_export_failed',
            '{
              "tenantId":"tenant_2",
              "plotId":"plot_2",
              "exportedBy":"other@tracebud.test",
              "rowCount":0,
              "status":"active",
              "fromDays":30,
              "agentUserId":null,
              "error":"timeout"
            }'::jsonb
          )
      `,
    );

    const result = await controller.listAssignmentExports('24', '20', '0', 'desc', 'failed', 'active', {
      user: { id: 'user_1', email: 'exporter+demo@tracebud.com', app_metadata: { tenant_id: 'tenant_1' } },
    });

    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toEqual(
      expect.objectContaining({
        event_type: 'plot_assignment_export_failed',
        payload: expect.objectContaining({
          tenantId: 'tenant_1',
          status: 'active',
          error: 'timeout',
        }),
      }),
    );
  });

  it('returns tenant-scoped risk-score events and applies phase/band filters', async () => {
    await pool.query(
      `
        INSERT INTO audit_log (user_id, event_type, payload)
        VALUES
          (
            '11111111-1111-1111-1111-111111111111'::uuid,
            'dds_package_risk_score_medium',
            '{
              "tenantId":"tenant_1",
              "packageId":"pkg_1",
              "provider":"internal_v1",
              "score":45,
              "band":"medium",
              "reasonCount":1
            }'::jsonb
          ),
          (
            '11111111-1111-1111-1111-111111111111'::uuid,
            'dds_package_risk_score_high',
            '{
              "tenantId":"tenant_1",
              "packageId":"pkg_2",
              "provider":"internal_v1",
              "score":82,
              "band":"high",
              "reasonCount":2
            }'::jsonb
          ),
          (
            '22222222-2222-2222-2222-222222222222'::uuid,
            'dds_package_risk_score_medium',
            '{
              "tenantId":"tenant_2",
              "packageId":"pkg_other",
              "provider":"internal_v1",
              "score":50,
              "band":"medium",
              "reasonCount":1
            }'::jsonb
          )
      `,
    );

    const result = await controller.listRiskScoreActivity('24', '20', '0', 'desc', 'medium', 'medium', {
      user: { id: 'user_1', email: 'exporter+demo@tracebud.com', app_metadata: { tenant_id: 'tenant_1' } },
    });

    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toEqual(
      expect.objectContaining({
        event_type: 'dds_package_risk_score_medium',
        payload: expect.objectContaining({
          tenantId: 'tenant_1',
          packageId: 'pkg_1',
          band: 'medium',
          score: 45,
        }),
      }),
    );
  });

  it('returns tenant-scoped filing activity events and applies phase filter', async () => {
    await pool.query(
      `
        INSERT INTO audit_log (user_id, event_type, payload)
        VALUES
          (
            '11111111-1111-1111-1111-111111111111'::uuid,
            'dds_package_generation_generated',
            '{
              "tenantId":"tenant_1",
              "packageId":"pkg_1",
              "status":"package_generated",
              "artifactVersion":"v1",
              "lotCount":2
            }'::jsonb
          ),
          (
            '11111111-1111-1111-1111-111111111111'::uuid,
            'dds_package_submission_accepted',
            '{
              "tenantId":"tenant_1",
              "packageId":"pkg_1",
              "idempotencyKey":"idem-1",
              "submissionState":"submitted",
              "tracesReference":"TRACES-1",
              "replayed":false
            }'::jsonb
          ),
          (
            '22222222-2222-2222-2222-222222222222'::uuid,
            'dds_package_generation_generated',
            '{
              "tenantId":"tenant_2",
              "packageId":"pkg_other",
              "status":"package_generated",
              "artifactVersion":"v1",
              "lotCount":1
            }'::jsonb
          )
      `,
    );
    const result = await controller.listFilingActivity('24', '20', '0', 'desc', 'generation_generated', {
      user: { id: 'user_1', email: 'exporter+demo@tracebud.com', app_metadata: { tenant_id: 'tenant_1' } },
    });
    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toEqual(
      expect.objectContaining({
        event_type: 'dds_package_generation_generated',
        payload: expect.objectContaining({
          tenantId: 'tenant_1',
          packageId: 'pkg_1',
          artifactVersion: 'v1',
        }),
      }),
    );
  });

  it('returns tenant-scoped chat-thread events and applies phase filter', async () => {
    await pool.query(
      `
        INSERT INTO audit_log (user_id, event_type, payload)
        VALUES
          (
            '11111111-1111-1111-1111-111111111111'::uuid,
            'chat_thread_created',
            '{
              "tenantId":"tenant_1",
              "threadId":"thread_1",
              "recordId":"record_1",
              "messageId":"msg_1",
              "actorRole":"exporter"
            }'::jsonb
          ),
          (
            '11111111-1111-1111-1111-111111111111'::uuid,
            'chat_thread_message_posted',
            '{
              "tenantId":"tenant_1",
              "threadId":"thread_1",
              "messageId":"msg_2",
              "actorRole":"exporter"
            }'::jsonb
          ),
          (
            '22222222-2222-2222-2222-222222222222'::uuid,
            'chat_thread_created',
            '{
              "tenantId":"tenant_2",
              "threadId":"thread_other",
              "recordId":"record_other",
              "messageId":"msg_other",
              "actorRole":"exporter"
            }'::jsonb
          )
      `,
    );
    const result = await controller.listChatThreadActivity('24', '20', '0', 'desc', 'created', {
      user: { id: 'user_1', email: 'exporter+demo@tracebud.com', app_metadata: { tenant_id: 'tenant_1' } },
    });
    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toEqual(
      expect.objectContaining({
        event_type: 'chat_thread_created',
        payload: expect.objectContaining({
          tenantId: 'tenant_1',
          threadId: 'thread_1',
          messageId: 'msg_1',
        }),
      }),
    );
  });

  it('returns tenant-scoped chat-thread resolved events when resolved phase is selected', async () => {
    await pool.query(
      `
        INSERT INTO audit_log (user_id, event_type, payload)
        VALUES
          (
            '11111111-1111-1111-1111-111111111111'::uuid,
            'chat_thread_resolved',
            '{
              "tenantId":"tenant_1",
              "threadId":"thread_2",
              "recordId":"record_2",
              "messageId":"status_1",
              "actorRole":"exporter"
            }'::jsonb
          ),
          (
            '11111111-1111-1111-1111-111111111111'::uuid,
            'chat_thread_reopened',
            '{
              "tenantId":"tenant_1",
              "threadId":"thread_2",
              "recordId":"record_2",
              "messageId":"status_2",
              "actorRole":"exporter"
            }'::jsonb
          )
      `,
    );
    const result = await controller.listChatThreadActivity('24', '20', '0', 'desc', 'resolved', {
      user: { id: 'user_1', email: 'exporter+demo@tracebud.com', app_metadata: { tenant_id: 'tenant_1' } },
    });
    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toEqual(
      expect.objectContaining({
        event_type: 'chat_thread_resolved',
        payload: expect.objectContaining({
          tenantId: 'tenant_1',
          threadId: 'thread_2',
          messageId: 'status_1',
        }),
      }),
    );
  });

  it('returns tenant-scoped workflow activity events and applies phase/slaState filters', async () => {
    await pool.query(
      `
        INSERT INTO audit_log (user_id, event_type, payload)
        VALUES
          (
            '11111111-1111-1111-1111-111111111111'::uuid,
            'workflow_stage_sla_warning',
            '{
              "tenantId":"tenant_1",
              "templateId":"template_1",
              "stageId":"verify_docs",
              "slaState":"warning",
              "actorRole":"exporter"
            }'::jsonb
          ),
          (
            '11111111-1111-1111-1111-111111111111'::uuid,
            'workflow_stage_transitioned',
            '{
              "tenantId":"tenant_1",
              "templateId":"template_1",
              "stageId":"verify_docs",
              "fromStatus":"pending",
              "toStatus":"in_progress",
              "actorRole":"agent"
            }'::jsonb
          ),
          (
            '22222222-2222-2222-2222-222222222222'::uuid,
            'workflow_stage_sla_warning',
            '{
              "tenantId":"tenant_2",
              "templateId":"template_2",
              "stageId":"review_docs",
              "slaState":"warning",
              "actorRole":"exporter"
            }'::jsonb
          )
      `,
    );
    const result = await controller.listWorkflowActivity('24', '20', '0', 'desc', 'sla_warning', 'warning', {
      user: { id: 'user_1', email: 'exporter+demo@tracebud.com', app_metadata: { tenant_id: 'tenant_1' } },
    });
    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toEqual(
      expect.objectContaining({
        event_type: 'workflow_stage_sla_warning',
        payload: expect.objectContaining({
          tenantId: 'tenant_1',
          templateId: 'template_1',
          stageId: 'verify_docs',
          slaState: 'warning',
        }),
      }),
    );
  });

  it('returns tenant-scoped dashboard diagnostics summary counters', async () => {
    await pool.query(
      `
        INSERT INTO audit_log (event_type, payload)
        VALUES
          ('dashboard_gated_entry_attempt', '{"tenantId":"tenant_1","gate":"request_campaigns"}'::jsonb),
          ('plot_assignment_export_requested', '{"tenantId":"tenant_1"}'::jsonb),
          ('dds_package_risk_score_medium', '{"tenantId":"tenant_1"}'::jsonb),
          ('dds_package_submission_accepted', '{"tenantId":"tenant_1"}'::jsonb),
          ('chat_thread_message_posted', '{"tenantId":"tenant_1"}'::jsonb),
          ('chat_thread_message_posted', '{"tenantId":"tenant_2"}'::jsonb)
      `,
    );
    const result = await controller.getDashboardDiagnosticsSummary('24', {
      user: { id: 'user_1', email: 'exporter+demo@tracebud.com', app_metadata: { tenant_id: 'tenant_1' } },
    });
    expect(result).toEqual({
      tenantId: 'tenant_1',
      fromHours: 24,
      totalDiagnostics: 6,
      counters: {
        gatedEntryAttempts: 2,
        assignmentExportEvents: 1,
        riskScoreEvents: 1,
        filingActivityEvents: 1,
        chatActivityEvents: 1,
      },
      breakdown: {
        assignmentPhase: { requested: 1, succeeded: 0, failed: 0 },
        assignmentStatus: { active: 0, completed: 0, cancelled: 0 },
        riskBand: { low: 0, medium: 1, high: 0 },
        filingFamily: { generation: 0, submission: 1 },
        chatPhase: { created: 0, posted: 1, replayed: 0, resolved: 0, reopened: 0, archived: 0 },
      },
      readiness: {
        hasAnyDiagnostics: true,
        canExportDetailed: true,
        latestEventAt: expect.any(String),
      },
    });
  });

  it('returns non-export-ready dashboard summary when tenant has no diagnostics', async () => {
    const result = await controller.getDashboardDiagnosticsSummary('24', {
      user: { id: 'user_1', email: 'exporter+demo@tracebud.com', app_metadata: { tenant_id: 'tenant_empty' } },
    });
    expect(result).toEqual({
      tenantId: 'tenant_empty',
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

  it('creates expected gated-entry query index for telemetry lookups', async () => {
    const indexRes = await pool.query<{ indexname: string; indexdef: string }>(
      `
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'audit_log'
          AND indexdef LIKE '%(payload ->> ''tenantId''::text)%'
          AND indexdef LIKE '%(payload ->> ''gate''::text)%'
      `,
    );

    expect(indexRes.rows).toHaveLength(1);
    expect(indexRes.rows[0]?.indexname).toBe('idx_audit_log_gated_entry_tenant_gate_ts');
  });
});
