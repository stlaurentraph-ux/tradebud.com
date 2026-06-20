-- ADR-006 Phase 2a: table comments (Table Editor hygiene).

BEGIN;

COMMENT ON TABLE commercial.billing_invoices IS 'Monthly usage invoices per tenant (backend-primary).';
COMMENT ON TABLE commercial.billing_usage_meters IS 'Metered usage counters for tenant billing.';
COMMENT ON TABLE commercial.shipment_billing_legs IS 'Billable legs linking shipments to billing tenants.';
COMMENT ON TABLE commercial.shipment_header_packages IS 'DDS packages attached to commercial shipment headers.';
COMMENT ON TABLE commercial.shipment_headers IS 'Commercial shipment filing headers per tenant.';
COMMENT ON TABLE commercial.tenant_billing_adoption_promo IS 'Early-adopter promotional billing overrides.';
COMMENT ON TABLE commercial.tenant_billing_subscription IS 'Subscription and Stripe billing state per tenant.';
COMMENT ON TABLE commercial.tenant_commercial_profiles IS 'Exporter commercial profile metadata per tenant.';
COMMENT ON TABLE commercial.tenant_feature_entitlements IS 'Feature flags and entitlements by tenant.';

COMMENT ON TABLE crm.cadence_settings IS 'Founder OS outreach and content cadence defaults.';
COMMENT ON TABLE crm.content_calendar IS 'Scheduled content publishing calendar.';
COMMENT ON TABLE crm.content_ideas IS 'Marketing content idea backlog.';
COMMENT ON TABLE crm.content_tasks IS 'Generated content tasks from calendar cadence.';
COMMENT ON TABLE crm.crm_contacts IS 'Tenant-scoped CRM contacts; may link to farmer_profile.';
COMMENT ON TABLE crm.daily_actions IS 'Daily Founder OS outreach action queue.';
COMMENT ON TABLE crm.outreach_activity IS 'Prospect outreach activity log.';
COMMENT ON TABLE crm.outreach_templates IS 'LinkedIn and email outreach templates.';
COMMENT ON TABLE crm.prospects IS 'Founder OS sales pipeline prospects.';

COMMENT ON TABLE gtm.cooperative_leads IS 'Cooperative interest form submissions (marketing site).';
COMMENT ON TABLE gtm.country_leads IS 'Government or registry interest form submissions.';
COMMENT ON TABLE gtm.exporter_leads IS 'Exporter interest form submissions.';
COMMENT ON TABLE gtm.farmer_leads IS 'Farmer interest form submissions.';
COMMENT ON TABLE gtm.importer_leads IS 'Importer interest form submissions.';
COMMENT ON TABLE gtm.leads IS 'Legacy unified contact and pilot lead form submissions.';

COMMENT ON TABLE integrations.integration_assessment_requests IS 'CoolFarm/SAI assessment intake requests.';
COMMENT ON TABLE integrations.integration_audit_v2 IS 'Integration run audit trail events.';
COMMENT ON TABLE integrations.integration_evidence_v2 IS 'Evidence artifacts from integration runs.';
COMMENT ON TABLE integrations.integration_questionnaire_v2 IS 'Questionnaire responses for integration assessments.';
COMMENT ON TABLE integrations.integration_runs_v2 IS 'CoolFarm SAI integration execution runs.';
COMMENT ON TABLE integrations.yield_benchmark_import_runs IS 'Batch import metadata for yield benchmarks.';
COMMENT ON TABLE integrations.yield_benchmarks IS 'Regional yield benchmark reference data (backend-primary).';

COMMENT ON TABLE internal.admin_organizations IS 'Tracebud internal admin organization registry.';
COMMENT ON TABLE internal.admin_users IS 'Tracebud internal admin user accounts.';
COMMENT ON TABLE internal.audit_log IS 'Append-only domain event audit log (backend-primary).';
COMMENT ON TABLE internal.field_app_signup_contacts IS 'Field app signup interest captures.';
COMMENT ON TABLE internal.tenant_onboarding_progress IS 'Tenant onboarding checklist progress.';
COMMENT ON TABLE internal.tenant_signup_contacts IS 'Dashboard signup contact captures.';
COMMENT ON TABLE internal.tenant_trial_state IS 'Trial expiration and conversion state per tenant.';

COMMENT ON TABLE ops.request_campaign_recipient_decisions IS 'Per-recipient decisions for request campaigns.';
COMMENT ON TABLE ops.request_campaigns IS 'Dashboard request and info campaigns (tenant-scoped).';

COMMENT ON TABLE public.compliance_issues IS 'Plot and shipment compliance issues requiring review.';
COMMENT ON TABLE public.consent_grants IS 'Farmer consent grants to tenant agents and exporters.';
COMMENT ON TABLE public.dds_package IS 'Due diligence statement filing packages.';
COMMENT ON TABLE public.dds_package_voucher IS 'Links traceability vouchers to DDS packages.';
COMMENT ON TABLE public.document_provenance_events IS 'Evidence document provenance chain events.';
COMMENT ON TABLE public.evidence_documents IS 'Plot and shipment evidence document metadata.';
COMMENT ON TABLE public.farmer_profile IS 'Farmer identity, country, and self-declaration state.';
COMMENT ON TABLE public.harvest_transaction IS 'Field harvest and delivery transactions per plot.';
COMMENT ON TABLE public.indigenous_zone IS 'Indigenous territory overlay polygons for Honduras compliance checks.';
COMMENT ON TABLE public.plot_tenure_verification IS 'Land tenure document verification jobs per plot.';
COMMENT ON TABLE public.sinaph_zone IS 'SINAPH protected-area overlay polygons for Honduras compliance checks.';
COMMENT ON TABLE public.user_account IS 'Authenticated user accounts (farmer, agent, exporter, viewer).';
COMMENT ON TABLE public.voucher IS 'Traceability vouchers and lot tokens.';
COMMENT ON TABLE public.voucher_buyer_claims IS 'Buyer claims on voucher lineage for filing.';

COMMIT;
