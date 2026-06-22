import { Pool } from 'pg';

export async function createInboxTablesForIntTest(pool: Pool): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS inbox_requests (
      id TEXT PRIMARY KEY,
      campaign_id TEXT NOT NULL,
      title TEXT NOT NULL,
      request_type TEXT NOT NULL CHECK (
        request_type IN ('MISSING_PLOT_GEOMETRY', 'GENERAL_EVIDENCE', 'CONSENT_GRANT')
      ),
      due_at TIMESTAMPTZ NOT NULL,
      from_org TEXT NOT NULL,
      sender_tenant_id TEXT NOT NULL,
      recipient_tenant_id TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('PENDING', 'RESPONDED')),
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS inbox_request_events (
      id BIGSERIAL PRIMARY KEY,
      request_id TEXT NOT NULL REFERENCES inbox_requests(id) ON DELETE CASCADE,
      event_type TEXT NOT NULL,
      actor_tenant_id TEXT NULL,
      payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}
