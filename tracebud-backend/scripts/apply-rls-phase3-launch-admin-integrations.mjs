import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { withMigrationClient } from './migration-db-client.mjs';

function loadMigrationSql() {
  const sqlPath = resolve(process.cwd(), 'sql', 'tb_v16_030_rls_phase3_launch_admin_and_integrations.sql');
  return readFileSync(sqlPath, 'utf8');
}

async function verifyPhase3(client) {
  const result = await client.query(
    `
      WITH target_tables AS (
        SELECT unnest(
          ARRAY[
            'admin_organizations',
            'admin_users',
            'tenant_trial_state',
            'tenant_onboarding_progress',
            'tenant_feature_entitlements',
            'integration_assessment_requests',
            'integration_questionnaire_v2',
            'integration_runs_v2',
            'integration_evidence_v2',
            'integration_audit_v2',
            'crm_contacts',
            'request_campaigns',
            'request_campaign_recipient_decisions',
            'tenant_commercial_profiles'
          ]
        ) AS table_name
      ),
      existing_tables AS (
        SELECT
          t.table_name,
          c.relrowsecurity
        FROM target_tables t
        JOIN pg_class c
          ON c.relname = t.table_name
         AND c.relkind = 'r'
         AND c.relnamespace = 'public'::regnamespace
      ),
      policy_expectations AS (
        SELECT * FROM (
          VALUES
            ('admin_organizations', 'admin_organizations_tenant_all'),
            ('admin_users', 'admin_users_tenant_all'),
            ('tenant_trial_state', 'tenant_trial_state_tenant_all'),
            ('tenant_onboarding_progress', 'tenant_onboarding_progress_tenant_all'),
            ('tenant_feature_entitlements', 'tenant_feature_entitlements_tenant_all'),
            ('integration_assessment_requests', 'integration_assessment_requests_tenant_all'),
            ('integration_questionnaire_v2', 'integration_questionnaire_v2_tenant_all'),
            ('integration_runs_v2', 'integration_runs_v2_tenant_all'),
            ('integration_evidence_v2', 'integration_evidence_v2_tenant_all'),
            ('integration_audit_v2', 'integration_audit_v2_tenant_all'),
            ('crm_contacts', 'crm_contacts_tenant_all'),
            ('request_campaigns', 'request_campaigns_tenant_all'),
            ('request_campaign_recipient_decisions', 'request_campaign_recipient_decisions_tenant_all'),
            ('tenant_commercial_profiles', 'tenant_commercial_profiles_tenant_all')
        ) AS x(table_name, policy_name)
      ),
      checks AS (
        SELECT
          e.table_name,
          e.relrowsecurity,
          pe.policy_name,
          EXISTS (
            SELECT 1
            FROM pg_policies ps
            WHERE ps.schemaname = 'public'
              AND ps.tablename = e.table_name
              AND ps.policyname = pe.policy_name
          ) AS policy_present
        FROM existing_tables e
        JOIN policy_expectations pe
          ON pe.table_name = e.table_name
      ),
      spatial_ref_sys AS (
        SELECT
          c.relrowsecurity AS rls_enabled,
          EXISTS (
            SELECT 1
            FROM pg_policies p
            WHERE p.schemaname = 'public'
              AND p.tablename = 'spatial_ref_sys'
              AND p.policyname = 'spatial_ref_sys_public_read'
              AND p.cmd = 'SELECT'
          ) AS select_policy_present
        FROM pg_class c
        WHERE c.relname = 'spatial_ref_sys'
          AND c.relkind = 'r'
          AND c.relnamespace = 'public'::regnamespace
        LIMIT 1
      )
      SELECT
        COALESCE((SELECT COUNT(*) FROM checks), 0) AS checked_table_count,
        COALESCE((SELECT COUNT(*) FROM checks WHERE relrowsecurity AND policy_present), 0) AS hardened_table_count,
        EXISTS (SELECT 1 FROM checks WHERE NOT relrowsecurity OR NOT policy_present) AS has_failures,
        EXISTS (SELECT 1 FROM spatial_ref_sys) AS spatial_ref_sys_present,
        COALESCE((SELECT rls_enabled FROM spatial_ref_sys), false) AS spatial_ref_sys_rls_enabled,
        COALESCE((SELECT select_policy_present FROM spatial_ref_sys), false) AS spatial_ref_sys_select_policy_present
    `,
  );

  const row = result.rows[0];
  if (!row) {
    throw new Error('TB-V16-030 verification returned no rows.');
  }
  if (Number(row.checked_table_count) === 0) {
    throw new Error('TB-V16-030 verification found zero target tables in public schema.');
  }
  if (row.has_failures) {
    throw new Error('TB-V16-030 verification failed: one or more target tables are missing RLS or expected policy.');
  }
  if (row.spatial_ref_sys_present && (!row.spatial_ref_sys_rls_enabled || !row.spatial_ref_sys_select_policy_present)) {
    throw new Error('TB-V16-030 verification failed: spatial_ref_sys public RLS/policy hardening is incomplete.');
  }
}

async function run() {
  const verifyOnly = process.argv.includes('--verify-only');

  await withMigrationClient(
    async (client) => {
      if (!verifyOnly) {
        await client.query(loadMigrationSql());
      }
      await verifyPhase3(client);
      console.log(
        verifyOnly
          ? 'Verified TB-V16-030 phase-3 RLS hardening.'
          : 'Applied and verified TB-V16-030 phase-3 RLS hardening.',
      );
    },
    { overrideEnvKeys: ['RLS_PHASE3_DATABASE_URL'] },
  );
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
