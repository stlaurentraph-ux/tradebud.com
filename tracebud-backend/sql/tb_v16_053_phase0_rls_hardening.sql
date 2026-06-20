-- ADR-006 Phase 0: RLS hardening for tables exposed in public without policies.

BEGIN;

-- Helper expression reused in policies
-- tenant claim: (auth.jwt() -> 'app_metadata' ->> 'tenant_id')

-- ── consent_grants (TB-V16-041; idempotent re-apply) ────────────────────────

ALTER TABLE public.consent_grants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS consent_grants_farmer_select ON public.consent_grants;
DROP POLICY IF EXISTS consent_grants_farmer_update ON public.consent_grants;
DROP POLICY IF EXISTS consent_grants_tenant_select ON public.consent_grants;

CREATE POLICY consent_grants_farmer_select
ON public.consent_grants FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.farmer_profile fp
    WHERE fp.id = consent_grants.farmer_id AND fp.user_id = auth.uid()
  )
);

CREATE POLICY consent_grants_farmer_update
ON public.consent_grants FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.farmer_profile fp
    WHERE fp.id = consent_grants.farmer_id AND fp.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.farmer_profile fp
    WHERE fp.id = consent_grants.farmer_id AND fp.user_id = auth.uid()
  )
);

CREATE POLICY consent_grants_tenant_select
ON public.consent_grants FOR SELECT TO authenticated
USING (grantee_tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'));

-- ── billing / commercial (tenant-scoped; backend service_role bypasses RLS) ──

ALTER TABLE public.billing_usage_meters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS billing_usage_meters_tenant_all ON public.billing_usage_meters;
CREATE POLICY billing_usage_meters_tenant_all
ON public.billing_usage_meters FOR ALL TO authenticated
USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'))
WITH CHECK (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'));

ALTER TABLE public.billing_invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS billing_invoices_tenant_all ON public.billing_invoices;
CREATE POLICY billing_invoices_tenant_all
ON public.billing_invoices FOR ALL TO authenticated
USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'))
WITH CHECK (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'));

ALTER TABLE public.tenant_billing_subscription ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_billing_subscription_tenant_all ON public.tenant_billing_subscription;
CREATE POLICY tenant_billing_subscription_tenant_all
ON public.tenant_billing_subscription FOR ALL TO authenticated
USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'))
WITH CHECK (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'));

ALTER TABLE public.tenant_billing_adoption_promo ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_billing_adoption_promo_tenant_all ON public.tenant_billing_adoption_promo;
CREATE POLICY tenant_billing_adoption_promo_tenant_all
ON public.tenant_billing_adoption_promo FOR ALL TO authenticated
USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'))
WITH CHECK (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'));

ALTER TABLE public.shipment_billing_legs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS shipment_billing_legs_tenant_all ON public.shipment_billing_legs;
CREATE POLICY shipment_billing_legs_tenant_all
ON public.shipment_billing_legs FOR ALL TO authenticated
USING (billing_tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'))
WITH CHECK (billing_tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'));

ALTER TABLE public.shipment_headers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS shipment_headers_tenant_all ON public.shipment_headers;
CREATE POLICY shipment_headers_tenant_all
ON public.shipment_headers FOR ALL TO authenticated
USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'))
WITH CHECK (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'));

ALTER TABLE public.shipment_header_packages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS shipment_header_packages_tenant_all ON public.shipment_header_packages;
CREATE POLICY shipment_header_packages_tenant_all
ON public.shipment_header_packages FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.shipment_headers sh
    WHERE sh.id = shipment_header_packages.shipment_header_id
      AND sh.tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.shipment_headers sh
    WHERE sh.id = shipment_header_packages.shipment_header_id
      AND sh.tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')
  )
);

-- ── compliance / evidence (plot owner + tenant) ─────────────────────────────

ALTER TABLE public.plot_tenure_verification ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS plot_tenure_verification_owner_all ON public.plot_tenure_verification;
CREATE POLICY plot_tenure_verification_owner_all
ON public.plot_tenure_verification FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.plot p
    JOIN public.farmer_profile fp ON fp.id = p.farmer_id
    WHERE p.id = plot_tenure_verification.plot_id
      AND fp.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.plot p
    JOIN public.farmer_profile fp ON fp.id = p.farmer_id
    WHERE p.id = plot_tenure_verification.plot_id
      AND fp.user_id = auth.uid()
  )
);

ALTER TABLE public.evidence_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS evidence_documents_access ON public.evidence_documents;
CREATE POLICY evidence_documents_access
ON public.evidence_documents FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.plot p
    JOIN public.farmer_profile fp ON fp.id = p.farmer_id
    WHERE p.id = evidence_documents.plot_id
      AND fp.user_id = auth.uid()
  )
  OR tenant_id::text = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.plot p
    JOIN public.farmer_profile fp ON fp.id = p.farmer_id
    WHERE p.id = evidence_documents.plot_id
      AND fp.user_id = auth.uid()
  )
  OR tenant_id::text = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')
);

ALTER TABLE public.document_provenance_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS document_provenance_events_access ON public.document_provenance_events;
CREATE POLICY document_provenance_events_access
ON public.document_provenance_events FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.evidence_documents ed
    WHERE ed.id = document_provenance_events.evidence_document_id
      AND (
        EXISTS (
          SELECT 1
          FROM public.plot p
          JOIN public.farmer_profile fp ON fp.id = p.farmer_id
          WHERE p.id = ed.plot_id AND fp.user_id = auth.uid()
        )
        OR ed.tenant_id::text = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.evidence_documents ed
    WHERE ed.id = document_provenance_events.evidence_document_id
      AND (
        EXISTS (
          SELECT 1
          FROM public.plot p
          JOIN public.farmer_profile fp ON fp.id = p.farmer_id
          WHERE p.id = ed.plot_id AND fp.user_id = auth.uid()
        )
        OR ed.tenant_id::text = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')
      )
  )
);

ALTER TABLE public.compliance_issues ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS compliance_issues_tenant_all ON public.compliance_issues;
CREATE POLICY compliance_issues_tenant_all
ON public.compliance_issues FOR ALL TO authenticated
USING (tenant_id::text = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'))
WITH CHECK (tenant_id::text = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'));

ALTER TABLE public.voucher_buyer_claims ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS voucher_buyer_claims_tenant_all ON public.voucher_buyer_claims;
CREATE POLICY voucher_buyer_claims_tenant_all
ON public.voucher_buyer_claims FOR ALL TO authenticated
USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'))
WITH CHECK (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'));

-- ── onboarding / signup captures ────────────────────────────────────────────

ALTER TABLE public.tenant_signup_contacts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_signup_contacts_self ON public.tenant_signup_contacts;
CREATE POLICY tenant_signup_contacts_self
ON public.tenant_signup_contacts FOR ALL TO authenticated
USING (
  user_id = auth.uid()::text
  OR tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')
)
WITH CHECK (
  user_id = auth.uid()::text
  OR tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')
);

ALTER TABLE public.field_app_signup_contacts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS field_app_signup_contacts_self ON public.field_app_signup_contacts;
CREATE POLICY field_app_signup_contacts_self
ON public.field_app_signup_contacts FOR ALL TO authenticated
USING (user_id = auth.uid()::text)
WITH CHECK (user_id = auth.uid()::text);

-- ── new Phase 0 tables ──────────────────────────────────────────────────────

ALTER TABLE public.agent_plot_assignment ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS agent_plot_assignment_scope ON public.agent_plot_assignment;
CREATE POLICY agent_plot_assignment_scope
ON public.agent_plot_assignment FOR ALL TO authenticated
USING (
  agent_user_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.plot p
    JOIN public.farmer_profile fp ON fp.id = p.farmer_id
    WHERE p.id = agent_plot_assignment.plot_id
      AND fp.user_id = auth.uid()
  )
)
WITH CHECK (
  agent_user_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.plot p
    JOIN public.farmer_profile fp ON fp.id = p.farmer_id
    WHERE p.id = agent_plot_assignment.plot_id
      AND fp.user_id = auth.uid()
  )
);

ALTER TABLE public.farmer_push_devices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS farmer_push_devices_self ON public.farmer_push_devices;
CREATE POLICY farmer_push_devices_self
ON public.farmer_push_devices FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

ALTER TABLE public.inbox_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS inbox_requests_tenant ON public.inbox_requests;
CREATE POLICY inbox_requests_tenant
ON public.inbox_requests FOR ALL TO authenticated
USING (
  recipient_tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')
  OR sender_tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')
)
WITH CHECK (
  recipient_tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')
  OR sender_tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')
);

ALTER TABLE public.inbox_request_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS inbox_request_events_tenant ON public.inbox_request_events;
CREATE POLICY inbox_request_events_tenant
ON public.inbox_request_events FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.inbox_requests ir
    WHERE ir.id = inbox_request_events.request_id
      AND (
        ir.recipient_tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')
        OR ir.sender_tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.inbox_requests ir
    WHERE ir.id = inbox_request_events.request_id
      AND (
        ir.recipient_tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')
        OR ir.sender_tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')
      )
  )
);

ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS chat_threads_tenant_all ON public.chat_threads;
CREATE POLICY chat_threads_tenant_all
ON public.chat_threads FOR ALL TO authenticated
USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'))
WITH CHECK (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'));

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS chat_messages_tenant_all ON public.chat_messages;
CREATE POLICY chat_messages_tenant_all
ON public.chat_messages FOR ALL TO authenticated
USING (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'))
WITH CHECK (tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'));

COMMIT;
