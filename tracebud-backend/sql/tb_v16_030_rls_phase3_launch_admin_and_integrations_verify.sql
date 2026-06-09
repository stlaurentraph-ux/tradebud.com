-- TB-V16-030 verification: phase-3 RLS hardening
-- Run after tb_v16_030_rls_phase3_launch_admin_and_integrations.sql

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
    c.oid,
    c.relrowsecurity
  FROM target_tables t
  LEFT JOIN pg_class c
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
policy_state AS (
  SELECT
    schemaname,
    tablename,
    policyname
  FROM pg_policies
  WHERE schemaname = 'public'
),
table_checks AS (
  SELECT
    e.table_name,
    e.oid IS NOT NULL AS table_exists,
    COALESCE(e.relrowsecurity, false) AS rls_enabled,
    pe.policy_name,
    EXISTS (
      SELECT 1
      FROM policy_state ps
      WHERE ps.tablename = e.table_name
        AND ps.policyname = pe.policy_name
    ) AS expected_policy_present
  FROM existing_tables e
  JOIN policy_expectations pe
    ON pe.table_name = e.table_name
),
spatial_ref_state AS (
  SELECT
    c.relrowsecurity AS relrowsecurity_enabled,
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
  CASE
    WHEN EXISTS (
      SELECT 1 FROM table_checks
      WHERE table_exists
        AND (NOT rls_enabled OR NOT expected_policy_present)
    ) THEN 'fail'
    ELSE 'pass'
  END AS phase3_table_rls_status,
  (SELECT COUNT(*) FROM table_checks WHERE table_exists) AS tables_present_count,
  (SELECT COUNT(*) FROM table_checks WHERE table_exists AND rls_enabled AND expected_policy_present) AS tables_hardened_count,
  CASE
    WHEN EXISTS (SELECT 1 FROM spatial_ref_state)
      THEN CASE
        WHEN (SELECT relrowsecurity_enabled FROM spatial_ref_state)
          AND (SELECT select_policy_present FROM spatial_ref_state)
          THEN 'pass'
        ELSE 'fail'
      END
    ELSE 'warn'
  END AS spatial_ref_sys_public_status;

-- Supporting table-by-table snapshot:
SELECT
  table_name,
  table_exists,
  rls_enabled,
  policy_name,
  expected_policy_present
FROM table_checks
ORDER BY table_name;

-- Supporting policy snapshot:
SELECT schemaname, tablename, policyname, cmd, roles, qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
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
    'tenant_commercial_profiles',
    'spatial_ref_sys'
  )
ORDER BY tablename, policyname;
