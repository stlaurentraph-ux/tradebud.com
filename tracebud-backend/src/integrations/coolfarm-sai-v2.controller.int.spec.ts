import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Pool } from 'pg';
import { CoolFarmSaiV2Controller } from './coolfarm-sai-v2.controller';

const testDbUrl = process.env.TEST_DATABASE_URL;
const describeIfDb = testDbUrl ? describe : describe.skip;
const schema = 'tb_coolfarm_sai_v2_controller_test';

function withSearchPath(connectionString: string, _targetSchema: string) {
  return connectionString;
}

describeIfDb('CoolFarmSaiV2Controller integration', () => {
  let pool: Pool;
  let controller: CoolFarmSaiV2Controller;

  beforeAll(async () => {
    pool = new Pool({
      connectionString: withSearchPath(testDbUrl!, schema),
      ssl: { rejectUnauthorized: false },
      max: 1,
    });
    await pool.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    await pool.query(`CREATE SCHEMA IF NOT EXISTS ${schema}`);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS integration_questionnaire_v2 (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id TEXT NOT NULL,
        farm_id UUID NULL,
        pathway TEXT NOT NULL CHECK (pathway IN ('annuals', 'rice')),
        schema_id TEXT NOT NULL DEFAULT 'farmQuestionnaireV1',
        schema_version TEXT NOT NULL DEFAULT '0.1.0-draft',
        status TEXT NOT NULL CHECK (status IN ('draft', 'submitted', 'validated', 'scored', 'reviewed')),
        idempotency_key TEXT NOT NULL,
        response JSONB NOT NULL DEFAULT '{}'::jsonb,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_by_user_id UUID NULL,
        updated_by_user_id UUID NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (tenant_id, idempotency_key)
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS integration_runs_v2 (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id TEXT NOT NULL,
        questionnaire_id UUID NOT NULL REFERENCES integration_questionnaire_v2(id) ON DELETE CASCADE,
        run_type TEXT NOT NULL CHECK (run_type IN ('validation', 'scoring', 'review')),
        status TEXT NOT NULL CHECK (status IN ('started', 'completed', 'failed')),
        details JSONB NOT NULL DEFAULT '{}'::jsonb,
        queued_at TIMESTAMPTZ NULL,
        attempt_count INTEGER NOT NULL DEFAULT 1 CHECK (attempt_count >= 0),
        error_code TEXT NULL,
        next_retry_at TIMESTAMPTZ NULL,
        claimed_by_user_id UUID NULL,
        claimed_at TIMESTAMPTZ NULL,
        started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        finished_at TIMESTAMPTZ NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS integration_audit_v2 (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id TEXT NOT NULL,
        questionnaire_id UUID NULL REFERENCES integration_questionnaire_v2(id) ON DELETE SET NULL,
        event_type TEXT NOT NULL,
        payload JSONB NOT NULL DEFAULT '{}'::jsonb,
        actor_user_id UUID NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    controller = new CoolFarmSaiV2Controller(pool as any);
  }, 25_000);

  afterAll(async () => {
    delete process.env.COOLFARM_SAI_V2_SCHEDULER_TOKEN;
    delete process.env.COOLFARM_SAI_V2_SCHEDULER_TOKEN_VERSION;
    await pool.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    await pool.end();
  });

  beforeEach(async () => {
    await pool.query('DELETE FROM integration_audit_v2');
    await pool.query('DELETE FROM integration_runs_v2');
    await pool.query('DELETE FROM integration_questionnaire_v2');
  });

  const adminReq = {
    user: {
      id: '11111111-1111-1111-1111-111111111111',
      app_metadata: { tenant_id: 'tenant_1', role: 'ADMIN' },
    },
  };

  it('rejects scheduler trigger when token env is missing', async () => {
    delete process.env.COOLFARM_SAI_V2_SCHEDULER_TOKEN;
    await expect(
      controller.triggerScheduledStaleSweeper(
        { staleMinutes: 10, limit: 5 },
        'abc',
        adminReq,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects scheduler trigger when token is invalid', async () => {
    process.env.COOLFARM_SAI_V2_SCHEDULER_TOKEN = 'expected';
    await expect(
      controller.triggerScheduledStaleSweeper(
        { staleMinutes: 10, limit: 5 },
        'wrong',
        adminReq,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('executes scheduler trigger and writes sweeper audit event', async () => {
    process.env.COOLFARM_SAI_V2_SCHEDULER_TOKEN = 'expected';
    process.env.COOLFARM_SAI_V2_SCHEDULER_TOKEN_VERSION = 'v7';

    const result = await controller.triggerScheduledStaleSweeper(
      { staleMinutes: 10, limit: 5 },
      'expected',
      adminReq,
    );
    expect(result).toEqual(
      expect.objectContaining({
        tenantId: 'tenant_1',
        triggerSource: 'scheduled',
        schedulerContract: true,
        schedulerTokenVersion: 'v7',
      }),
    );

    const auditRows = await pool.query(
      `SELECT event_type, payload FROM integration_audit_v2 WHERE event_type = 'integration_v2_stale_sweeper_executed'`,
    );
    expect(auditRows.rows.length).toBe(1);
    expect(auditRows.rows[0].payload).toEqual(
      expect.objectContaining({
        triggerSource: 'scheduled',
        schedulerTokenVersion: 'v7',
      }),
    );
  });
});

