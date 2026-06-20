-- ADR-006 Phase 1: domain schema split (Table Editor organization)
-- Keeps core EUDR product in public; moves commercial/crm/gtm/integrations/ops/internal.

BEGIN;

CREATE SCHEMA IF NOT EXISTS commercial;
CREATE SCHEMA IF NOT EXISTS crm;
CREATE SCHEMA IF NOT EXISTS gtm;
CREATE SCHEMA IF NOT EXISTS integrations;
CREATE SCHEMA IF NOT EXISTS ops;
CREATE SCHEMA IF NOT EXISTS internal;

COMMENT ON SCHEMA commercial IS 'Billing, subscriptions, shipment commercial metadata (backend-primary).';
COMMENT ON SCHEMA crm IS 'Founder OS pipeline, outreach, content calendar, tenant CRM contacts.';
COMMENT ON SCHEMA gtm IS 'Marketing/waitlist lead capture forms.';
COMMENT ON SCHEMA integrations IS 'CoolFarm, yield benchmarks, partner exports.';
COMMENT ON SCHEMA ops IS 'Dashboard inbox, chat threads, request campaigns.';
COMMENT ON SCHEMA internal IS 'Audit log, admin orgs, tenant onboarding captures.';

-- ── integrations ────────────────────────────────────────────────────────────

ALTER TABLE IF EXISTS public.integration_questionnaire_v2 SET SCHEMA integrations;
ALTER TABLE IF EXISTS public.integration_runs_v2 SET SCHEMA integrations;
ALTER TABLE IF EXISTS public.integration_evidence_v2 SET SCHEMA integrations;
ALTER TABLE IF EXISTS public.integration_audit_v2 SET SCHEMA integrations;
ALTER TABLE IF EXISTS public.integration_assessment_requests SET SCHEMA integrations;
ALTER TABLE IF EXISTS public.yield_benchmarks SET SCHEMA integrations;
ALTER TABLE IF EXISTS public.yield_benchmark_import_runs SET SCHEMA integrations;

-- ── commercial ──────────────────────────────────────────────────────────────

ALTER TABLE IF EXISTS public.billing_usage_meters SET SCHEMA commercial;
ALTER TABLE IF EXISTS public.billing_invoices SET SCHEMA commercial;
ALTER TABLE IF EXISTS public.shipment_headers SET SCHEMA commercial;
ALTER TABLE IF EXISTS public.tenant_commercial_profiles SET SCHEMA commercial;
ALTER TABLE IF EXISTS public.tenant_billing_subscription SET SCHEMA commercial;
ALTER TABLE IF EXISTS public.tenant_billing_adoption_promo SET SCHEMA commercial;
ALTER TABLE IF EXISTS public.tenant_feature_entitlements SET SCHEMA commercial;
ALTER TABLE IF EXISTS public.shipment_billing_legs SET SCHEMA commercial;
ALTER TABLE IF EXISTS public.shipment_header_packages SET SCHEMA commercial;

-- ── internal ────────────────────────────────────────────────────────────────

ALTER TABLE IF EXISTS public.audit_log SET SCHEMA internal;
ALTER TABLE IF EXISTS public.admin_organizations SET SCHEMA internal;
ALTER TABLE IF EXISTS public.admin_users SET SCHEMA internal;
ALTER TABLE IF EXISTS public.tenant_trial_state SET SCHEMA internal;
ALTER TABLE IF EXISTS public.tenant_onboarding_progress SET SCHEMA internal;
ALTER TABLE IF EXISTS public.tenant_signup_contacts SET SCHEMA internal;
ALTER TABLE IF EXISTS public.field_app_signup_contacts SET SCHEMA internal;

-- ── ops ─────────────────────────────────────────────────────────────────────

ALTER TABLE IF EXISTS public.request_campaigns SET SCHEMA ops;
ALTER TABLE IF EXISTS public.inbox_requests SET SCHEMA ops;
ALTER TABLE IF EXISTS public.chat_threads SET SCHEMA ops;
ALTER TABLE IF EXISTS public.request_campaign_recipient_decisions SET SCHEMA ops;
ALTER TABLE IF EXISTS public.inbox_request_events SET SCHEMA ops;
ALTER TABLE IF EXISTS public.chat_messages SET SCHEMA ops;

-- ── crm ─────────────────────────────────────────────────────────────────────

ALTER TABLE IF EXISTS public.prospects SET SCHEMA crm;
ALTER TABLE IF EXISTS public.outreach_templates SET SCHEMA crm;
ALTER TABLE IF EXISTS public.content_ideas SET SCHEMA crm;
ALTER TABLE IF EXISTS public.content_calendar SET SCHEMA crm;
ALTER TABLE IF EXISTS public.cadence_settings SET SCHEMA crm;
ALTER TABLE IF EXISTS public.crm_contacts SET SCHEMA crm;
ALTER TABLE IF EXISTS public.outreach_activity SET SCHEMA crm;
ALTER TABLE IF EXISTS public.daily_actions SET SCHEMA crm;
ALTER TABLE IF EXISTS public.content_tasks SET SCHEMA crm;

-- ── gtm ─────────────────────────────────────────────────────────────────────

ALTER TABLE IF EXISTS public.leads SET SCHEMA gtm;
ALTER TABLE IF EXISTS public.waitlist_signups SET SCHEMA gtm;
ALTER TABLE IF EXISTS public.exporter_leads SET SCHEMA gtm;
ALTER TABLE IF EXISTS public.importer_leads SET SCHEMA gtm;
ALTER TABLE IF EXISTS public.farmer_leads SET SCHEMA gtm;
ALTER TABLE IF EXISTS public.cooperative_leads SET SCHEMA gtm;
ALTER TABLE IF EXISTS public.country_leads SET SCHEMA gtm;

-- ── privileges: backend roles ───────────────────────────────────────────────

GRANT USAGE ON SCHEMA commercial, integrations, ops, internal, crm, gtm TO postgres, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA commercial, integrations, ops, internal TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA commercial, integrations, ops, internal TO postgres, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA crm TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA crm TO postgres, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA gtm TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA gtm TO postgres, service_role;

-- PostgREST client roles (crm/gtm exposed in Dashboard API settings)
GRANT USAGE ON SCHEMA crm, gtm TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA crm TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA gtm TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA crm, gtm TO authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA gtm TO anon;

-- Hide commercial/integrations/ops/internal from direct client API
REVOKE ALL ON SCHEMA commercial FROM anon, authenticated;
REVOKE ALL ON SCHEMA integrations FROM anon, authenticated;
REVOKE ALL ON SCHEMA ops FROM anon, authenticated;
REVOKE ALL ON SCHEMA internal FROM anon, authenticated;

-- ── fix ops RLS policy referencing old public.request_campaigns ─────────────

DROP POLICY IF EXISTS request_campaign_recipient_decisions_tenant_all ON ops.request_campaign_recipient_decisions;
CREATE POLICY request_campaign_recipient_decisions_tenant_all
ON ops.request_campaign_recipient_decisions
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM ops.request_campaigns rc
    WHERE rc.id = request_campaign_recipient_decisions.campaign_id
      AND rc.tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM ops.request_campaigns rc
    WHERE rc.id = request_campaign_recipient_decisions.campaign_id
      AND rc.tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')
  )
);

-- ── fix commercial shipment_header_packages policy ────────────────────────────

DROP POLICY IF EXISTS shipment_header_packages_tenant_all ON commercial.shipment_header_packages;
CREATE POLICY shipment_header_packages_tenant_all
ON commercial.shipment_header_packages
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM commercial.shipment_headers sh
    WHERE sh.id = shipment_header_packages.shipment_header_id
      AND sh.tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM commercial.shipment_headers sh
    WHERE sh.id = shipment_header_packages.shipment_header_id
      AND sh.tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')
  )
);

-- ── fix ops inbox_request_events policy ───────────────────────────────────────

DROP POLICY IF EXISTS inbox_request_events_tenant ON ops.inbox_request_events;
CREATE POLICY inbox_request_events_tenant
ON ops.inbox_request_events
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM ops.inbox_requests ir
    WHERE ir.id = inbox_request_events.request_id
      AND (
        ir.recipient_tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')
        OR ir.sender_tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM ops.inbox_requests ir
    WHERE ir.id = inbox_request_events.request_id
      AND (
        ir.recipient_tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')
        OR ir.sender_tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')
      )
  )
);

-- ── fix internal document_provenance policy (if evidence stays public) ───────
-- evidence_documents_access unchanged in public

-- ── founder OS functions: search_path ───────────────────────────────────────

ALTER FUNCTION public.daily_outreach_actions(date) SET search_path = crm, public;
ALTER FUNCTION public.generate_daily_actions(date) SET search_path = crm, public;
ALTER FUNCTION public.content_tasks_due(date) SET search_path = crm, public;
ALTER FUNCTION public.generate_content_tasks(date) SET search_path = crm, public;

COMMIT;
