import { ForbiddenException } from '@nestjs/common';
import { Pool } from 'pg';
import { WorkflowTemplatesController } from './workflow-templates.controller';

const testDbUrl = process.env.TEST_DATABASE_URL;
const describeIfDb = testDbUrl ? describe : describe.skip;
const schema = 'tb_workflow_templates_controller_test';

function withSearchPath(connectionString: string, _targetSchema: string) {
  return connectionString;
}

describeIfDb('WorkflowTemplatesController integration', () => {
  let pool: Pool;
  let controller: WorkflowTemplatesController;

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
    controller = new WorkflowTemplatesController(pool as any);
  }, 20_000);

  afterAll(async () => {
    await pool.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    await pool.end();
  });

  beforeEach(async () => {
    await pool.query('DELETE FROM audit_log');
  });

  it('rejects list when tenant claim is missing', async () => {
    await expect(
      controller.listTemplates(undefined, undefined, {
        user: { id: 'user_1', email: 'exporter+demo@tracebud.com' },
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('returns tenant-scoped template events', async () => {
    await pool.query(`
      INSERT INTO audit_log (event_type, payload)
      VALUES
        ('workflow_template_created', '{"tenantId":"tenant_1","templateId":"t_1","name":"Template A"}'::jsonb),
        ('workflow_template_created', '{"tenantId":"tenant_2","templateId":"t_2","name":"Template B"}'::jsonb)
    `);
    const result = await controller.listTemplates('20', '0', {
      user: { id: 'user_1', email: 'agent+demo@tracebud.com', app_metadata: { tenant_id: 'tenant_1' } },
    });
    expect(result.total).toBe(1);
    expect(result.items[0]).toEqual(
      expect.objectContaining({
        event_type: 'workflow_template_created',
        payload: expect.objectContaining({ tenantId: 'tenant_1' }),
      }),
    );
  });

  it('persists transition evidence and enforces state machine', async () => {
    const req = {
      user: { id: 'user_1', email: 'exporter+demo@tracebud.com', app_metadata: { tenant_id: 'tenant_1' } },
    };
    const transition1 = await controller.transitionStage('template_1', 'collect_docs', { toStatus: 'in_progress' }, req);
    expect(transition1).toEqual(expect.objectContaining({ fromStatus: 'pending', toStatus: 'in_progress' }));
    const transition2 = await controller.transitionStage('template_1', 'collect_docs', { toStatus: 'completed' }, req);
    expect(transition2).toEqual(expect.objectContaining({ fromStatus: 'in_progress', toStatus: 'completed' }));
    await expect(
      controller.transitionStage('template_1', 'collect_docs', { toStatus: 'in_progress' }, req),
    ).rejects.toThrow('Invalid stage transition: completed -> in_progress');
  });

  it('persists SLA transition evidence and enforces SLA recovery state machine', async () => {
    const req = {
      user: { id: 'user_1', email: 'exporter+demo@tracebud.com', app_metadata: { tenant_id: 'tenant_1' } },
    };
    const warning = await controller.transitionStageSla('template_1', 'collect_docs', { toState: 'warning' }, req);
    expect(warning).toEqual(expect.objectContaining({ fromState: 'on_track', toState: 'warning' }));
    const breached = await controller.transitionStageSla('template_1', 'collect_docs', { toState: 'breached' }, req);
    expect(breached).toEqual(expect.objectContaining({ fromState: 'warning', toState: 'breached' }));
    const escalated = await controller.transitionStageSla('template_1', 'collect_docs', { toState: 'escalated' }, req);
    expect(escalated).toEqual(expect.objectContaining({ fromState: 'breached', toState: 'escalated' }));
    const recovered = await controller.transitionStageSla('template_1', 'collect_docs', { toState: 'on_track' }, req);
    expect(recovered).toEqual(expect.objectContaining({ fromState: 'escalated', toState: 'on_track' }));
    await expect(
      controller.transitionStageSla('template_1', 'collect_docs', { toState: 'escalated' }, req),
    ).rejects.toThrow('Invalid SLA transition: on_track -> escalated');
  });
});

