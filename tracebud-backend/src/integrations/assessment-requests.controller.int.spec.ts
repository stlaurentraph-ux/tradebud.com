import { Pool } from 'pg';
import { AssessmentRequestsController } from './assessment-requests.controller';

const testDbUrl = process.env.TEST_DATABASE_URL;
const describeIfDb = testDbUrl ? describe : describe.skip;
const schema = 'tb_assessment_requests_controller_test';

function withSearchPath(connectionString: string, targetSchema: string) {
  const url = new URL(connectionString);
  url.searchParams.set('options', `-c search_path=${targetSchema},public`);
  return url.toString();
}

describeIfDb('AssessmentRequestsController integration', () => {
  let pool: Pool;
  let controller: AssessmentRequestsController;

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
      CREATE TABLE IF NOT EXISTS integration_assessment_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id TEXT NOT NULL,
        pathway TEXT NOT NULL CHECK (pathway IN ('annuals', 'rice')),
        farmer_user_id UUID NOT NULL,
        questionnaire_id UUID NULL REFERENCES integration_questionnaire_v2(id) ON DELETE SET NULL,
        requested_by_user_id UUID NULL,
        status TEXT NOT NULL CHECK (
          status IN ('sent', 'opened', 'in_progress', 'submitted', 'reviewed', 'needs_changes', 'cancelled')
        ),
        title TEXT NOT NULL,
        instructions TEXT NOT NULL DEFAULT '',
        due_at TIMESTAMPTZ NULL,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NULL,
        device_id TEXT NULL,
        event_type TEXT NOT NULL,
        payload JSONB NOT NULL DEFAULT '{}'::jsonb,
        timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    controller = new AssessmentRequestsController(pool as any);
  }, 25_000);

  afterAll(async () => {
    await pool.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    await pool.end();
  });

  beforeEach(async () => {
    await pool.query('DELETE FROM audit_log');
    await pool.query('DELETE FROM integration_assessment_requests');
    await pool.query('DELETE FROM integration_questionnaire_v2');
  });

  const exporterReq = {
    user: {
      id: '11111111-1111-1111-1111-111111111111',
      app_metadata: { tenant_id: 'tenant_1', role: 'EXPORTER' },
    },
  };

  it('auto-creates and links questionnaire draft when request is created without questionnaireDraftId', async () => {
    const result = await controller.create(
      {
        pathway: 'annuals',
        farmerUserId: '22222222-2222-2222-2222-222222222222',
        title: 'Auto-linked assessment',
        instructions: 'Complete form',
      },
      exporterReq,
    );
    expect(result).toEqual(
      expect.objectContaining({
        status: 'sent',
      }),
    );

    const requestRows = await pool.query(
      `
        SELECT id, questionnaire_id
        FROM integration_assessment_requests
        WHERE id = $1::uuid
      `,
      [result.id],
    );
    expect(requestRows.rowCount).toBe(1);
    expect(requestRows.rows[0].questionnaire_id).toBeTruthy();

    const questionnaireRows = await pool.query(
      `
        SELECT id, status
        FROM integration_questionnaire_v2
        WHERE id = $1::uuid
      `,
      [requestRows.rows[0].questionnaire_id],
    );
    expect(questionnaireRows.rowCount).toBe(1);
    expect(questionnaireRows.rows[0].status).toBe('draft');
  });
});

