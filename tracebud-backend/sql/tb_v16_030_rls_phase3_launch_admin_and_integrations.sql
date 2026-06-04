-- TB-V16-030: phase-3 RLS hardening for launch/admin/integration/request tables
-- Purpose:
-- - Close Supabase advisor critical findings for public tables created in later v1.6 slices.
-- - Enforce tenant-scoped access on exposed public-schema tables.
-- - Keep PostGIS `spatial_ref_sys` readable while preventing write paths through exposed roles.

BEGIN;

DO $$
BEGIN
  IF to_regclass('public.spatial_ref_sys') IS NOT NULL THEN
    BEGIN
      EXECUTE 'ALTER TABLE public.spatial_ref_sys ENABLE ROW LEVEL SECURITY';
      EXECUTE 'DROP POLICY IF EXISTS spatial_ref_sys_public_read ON public.spatial_ref_sys';
      EXECUTE 'CREATE POLICY spatial_ref_sys_public_read ON public.spatial_ref_sys FOR SELECT TO public USING (true)';
    EXCEPTION
      WHEN insufficient_privilege THEN
        RAISE NOTICE 'Skipping spatial_ref_sys RLS hardening in TB-V16-030: owner privileges required.';
    END;
  END IF;
END
$$;

DO $$
BEGIN
  IF to_regclass('public.admin_organizations') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.admin_organizations ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS admin_organizations_tenant_all ON public.admin_organizations';
    EXECUTE 'CREATE POLICY admin_organizations_tenant_all ON public.admin_organizations FOR ALL TO authenticated USING (tenant_id = (auth.jwt() -> ''app_metadata'' ->> ''tenant_id'')) WITH CHECK (tenant_id = (auth.jwt() -> ''app_metadata'' ->> ''tenant_id''))';
  END IF;
END
$$;

DO $$
BEGIN
  IF to_regclass('public.admin_users') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS admin_users_tenant_all ON public.admin_users';
    EXECUTE 'CREATE POLICY admin_users_tenant_all ON public.admin_users FOR ALL TO authenticated USING (tenant_id = (auth.jwt() -> ''app_metadata'' ->> ''tenant_id'')) WITH CHECK (tenant_id = (auth.jwt() -> ''app_metadata'' ->> ''tenant_id''))';
  END IF;
END
$$;

DO $$
BEGIN
  IF to_regclass('public.tenant_trial_state') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.tenant_trial_state ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS tenant_trial_state_tenant_all ON public.tenant_trial_state';
    EXECUTE 'CREATE POLICY tenant_trial_state_tenant_all ON public.tenant_trial_state FOR ALL TO authenticated USING (tenant_id = (auth.jwt() -> ''app_metadata'' ->> ''tenant_id'')) WITH CHECK (tenant_id = (auth.jwt() -> ''app_metadata'' ->> ''tenant_id''))';
  END IF;
END
$$;

DO $$
BEGIN
  IF to_regclass('public.tenant_onboarding_progress') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.tenant_onboarding_progress ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS tenant_onboarding_progress_tenant_all ON public.tenant_onboarding_progress';
    EXECUTE 'CREATE POLICY tenant_onboarding_progress_tenant_all ON public.tenant_onboarding_progress FOR ALL TO authenticated USING (tenant_id = (auth.jwt() -> ''app_metadata'' ->> ''tenant_id'')) WITH CHECK (tenant_id = (auth.jwt() -> ''app_metadata'' ->> ''tenant_id''))';
  END IF;
END
$$;

DO $$
BEGIN
  IF to_regclass('public.tenant_feature_entitlements') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.tenant_feature_entitlements ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS tenant_feature_entitlements_tenant_all ON public.tenant_feature_entitlements';
    EXECUTE 'CREATE POLICY tenant_feature_entitlements_tenant_all ON public.tenant_feature_entitlements FOR ALL TO authenticated USING (tenant_id = (auth.jwt() -> ''app_metadata'' ->> ''tenant_id'')) WITH CHECK (tenant_id = (auth.jwt() -> ''app_metadata'' ->> ''tenant_id''))';
  END IF;
END
$$;

DO $$
BEGIN
  IF to_regclass('public.integration_assessment_requests') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.integration_assessment_requests ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS integration_assessment_requests_tenant_all ON public.integration_assessment_requests';
    EXECUTE 'CREATE POLICY integration_assessment_requests_tenant_all ON public.integration_assessment_requests FOR ALL TO authenticated USING (tenant_id = (auth.jwt() -> ''app_metadata'' ->> ''tenant_id'')) WITH CHECK (tenant_id = (auth.jwt() -> ''app_metadata'' ->> ''tenant_id''))';
  END IF;
END
$$;

DO $$
BEGIN
  IF to_regclass('public.integration_questionnaire_v2') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.integration_questionnaire_v2 ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS integration_questionnaire_v2_tenant_all ON public.integration_questionnaire_v2';
    EXECUTE 'CREATE POLICY integration_questionnaire_v2_tenant_all ON public.integration_questionnaire_v2 FOR ALL TO authenticated USING (tenant_id = (auth.jwt() -> ''app_metadata'' ->> ''tenant_id'')) WITH CHECK (tenant_id = (auth.jwt() -> ''app_metadata'' ->> ''tenant_id''))';
  END IF;
END
$$;

DO $$
BEGIN
  IF to_regclass('public.integration_runs_v2') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.integration_runs_v2 ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS integration_runs_v2_tenant_all ON public.integration_runs_v2';
    EXECUTE 'CREATE POLICY integration_runs_v2_tenant_all ON public.integration_runs_v2 FOR ALL TO authenticated USING (tenant_id = (auth.jwt() -> ''app_metadata'' ->> ''tenant_id'')) WITH CHECK (tenant_id = (auth.jwt() -> ''app_metadata'' ->> ''tenant_id''))';
  END IF;
END
$$;

DO $$
BEGIN
  IF to_regclass('public.integration_evidence_v2') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.integration_evidence_v2 ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS integration_evidence_v2_tenant_all ON public.integration_evidence_v2';
    EXECUTE 'CREATE POLICY integration_evidence_v2_tenant_all ON public.integration_evidence_v2 FOR ALL TO authenticated USING (tenant_id = (auth.jwt() -> ''app_metadata'' ->> ''tenant_id'')) WITH CHECK (tenant_id = (auth.jwt() -> ''app_metadata'' ->> ''tenant_id''))';
  END IF;
END
$$;

DO $$
BEGIN
  IF to_regclass('public.integration_audit_v2') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.integration_audit_v2 ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS integration_audit_v2_tenant_all ON public.integration_audit_v2';
    EXECUTE 'CREATE POLICY integration_audit_v2_tenant_all ON public.integration_audit_v2 FOR ALL TO authenticated USING (tenant_id = (auth.jwt() -> ''app_metadata'' ->> ''tenant_id'')) WITH CHECK (tenant_id = (auth.jwt() -> ''app_metadata'' ->> ''tenant_id''))';
  END IF;
END
$$;

DO $$
BEGIN
  IF to_regclass('public.crm_contacts') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.crm_contacts ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS crm_contacts_tenant_all ON public.crm_contacts';
    EXECUTE 'CREATE POLICY crm_contacts_tenant_all ON public.crm_contacts FOR ALL TO authenticated USING (tenant_id = (auth.jwt() -> ''app_metadata'' ->> ''tenant_id'')) WITH CHECK (tenant_id = (auth.jwt() -> ''app_metadata'' ->> ''tenant_id''))';
  END IF;
END
$$;

DO $$
BEGIN
  IF to_regclass('public.request_campaigns') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.request_campaigns ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS request_campaigns_tenant_all ON public.request_campaigns';
    EXECUTE 'CREATE POLICY request_campaigns_tenant_all ON public.request_campaigns FOR ALL TO authenticated USING (tenant_id = (auth.jwt() -> ''app_metadata'' ->> ''tenant_id'')) WITH CHECK (tenant_id = (auth.jwt() -> ''app_metadata'' ->> ''tenant_id''))';
  END IF;
END
$$;

DO $$
BEGIN
  IF to_regclass('public.request_campaign_recipient_decisions') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.request_campaign_recipient_decisions ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS request_campaign_recipient_decisions_tenant_all ON public.request_campaign_recipient_decisions';
    EXECUTE '
      CREATE POLICY request_campaign_recipient_decisions_tenant_all
      ON public.request_campaign_recipient_decisions
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.request_campaigns rc
          WHERE rc.id = request_campaign_recipient_decisions.campaign_id
            AND rc.tenant_id = (auth.jwt() -> ''app_metadata'' ->> ''tenant_id'')
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.request_campaigns rc
          WHERE rc.id = request_campaign_recipient_decisions.campaign_id
            AND rc.tenant_id = (auth.jwt() -> ''app_metadata'' ->> ''tenant_id'')
        )
      )
    ';
  END IF;
END
$$;

DO $$
BEGIN
  IF to_regclass('public.tenant_commercial_profiles') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.tenant_commercial_profiles ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS tenant_commercial_profiles_tenant_all ON public.tenant_commercial_profiles';
    EXECUTE 'CREATE POLICY tenant_commercial_profiles_tenant_all ON public.tenant_commercial_profiles FOR ALL TO authenticated USING (tenant_id = (auth.jwt() -> ''app_metadata'' ->> ''tenant_id'')) WITH CHECK (tenant_id = (auth.jwt() -> ''app_metadata'' ->> ''tenant_id''))';
  END IF;
END
$$;

COMMIT;
