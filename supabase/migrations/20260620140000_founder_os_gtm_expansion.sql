-- Founder OS GTM expansion

BEGIN;

ALTER TABLE crm.prospects
  ADD COLUMN IF NOT EXISTS icp_score integer,
  ADD COLUMN IF NOT EXISTS icp_factors jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS segment text,
  ADD COLUMN IF NOT EXISTS market_id uuid;

CREATE TABLE IF NOT EXISTS crm.market_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code text NOT NULL,
  country_name text NOT NULL,
  commodity text NOT NULL,
  segment text NOT NULL,
  priority_tier text NOT NULL DEFAULT 'explore'
    CHECK (priority_tier IN ('beachhead', 'expand', 'explore', 'paused')),
  entry_wedge text,
  tam_notes text,
  regulatory_notes text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (country_code, commodity, segment)
);

CREATE INDEX IF NOT EXISTS idx_market_registry_priority ON crm.market_registry (priority_tier, active);

ALTER TABLE crm.prospects DROP CONSTRAINT IF EXISTS prospects_market_id_fkey;
ALTER TABLE crm.prospects
  ADD CONSTRAINT prospects_market_id_fkey
  FOREIGN KEY (market_id) REFERENCES crm.market_registry (id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS crm.pilots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id uuid REFERENCES crm.prospects (id) ON DELETE SET NULL,
  market_id uuid REFERENCES crm.market_registry (id) ON DELETE SET NULL,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'lead'
    CHECK (status IN ('lead', 'qualified', 'active', 'success', 'stalled', 'lost')),
  segment text,
  country text,
  commodity text,
  success_criteria text,
  start_date date,
  target_end_date date,
  tenant_id uuid,
  health_score integer CHECK (health_score IS NULL OR (health_score >= 0 AND health_score <= 100)),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pilots_status ON crm.pilots (status);
CREATE INDEX IF NOT EXISTS idx_pilots_prospect ON crm.pilots (prospect_id);

CREATE TABLE IF NOT EXISTS crm.partnerships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id uuid REFERENCES crm.prospects (id) ON DELETE SET NULL,
  organization_name text NOT NULL,
  partner_type text NOT NULL
    CHECK (partner_type IN ('cooperative', 'auditor', 'ngo', 'government', 'tech', 'consultant', 'other')),
  status text NOT NULL DEFAULT 'identified'
    CHECK (status IN ('identified', 'conversation', 'pilot', 'active', 'paused')),
  country text,
  owner text NOT NULL DEFAULT 'raph',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_partnerships_status ON crm.partnerships (status);

CREATE TABLE IF NOT EXISTS crm.objection_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id uuid REFERENCES crm.prospects (id) ON DELETE CASCADE,
  market_id uuid REFERENCES crm.market_registry (id) ON DELETE SET NULL,
  category text NOT NULL,
  objection_text text NOT NULL,
  response_text text,
  outcome text NOT NULL DEFAULT 'open'
    CHECK (outcome IN ('open', 'addressed', 'lost', 'won')),
  logged_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_objection_log_category ON crm.objection_log (category);

CREATE OR REPLACE FUNCTION crm.refresh_prospect_icp_scores()
RETURNS integer
LANGUAGE plpgsql
SET search_path = crm, public
AS $$
DECLARE
  updated_count integer := 0;
BEGIN
  UPDATE crm.prospects p
  SET
    icp_score = LEAST(100, GREATEST(0,
      30
      + CASE WHEN p.commodity_focus IS NOT NULL AND p.commodity_focus <> '' THEN 15 ELSE 0 END
      + CASE WHEN p.country IS NOT NULL AND p.country <> '' THEN 10 ELSE 0 END
      + CASE WHEN p.company_size IS NOT NULL AND p.company_size <> '' THEN 10 ELSE 0 END
      + CASE WHEN p.linkedin_url IS NOT NULL AND p.linkedin_url <> '' THEN 5 ELSE 0 END
      + CASE WHEN COALESCE(p.pilot_interest_score, 0) >= 7 THEN 15
             WHEN COALESCE(p.pilot_interest_score, 0) >= 4 THEN 8 ELSE 0 END
      + CASE WHEN p.tags && ARRAY['source:pilot', 'intent:high']::text[] THEN 15 ELSE 0 END
      + CASE WHEN p.stage IN ('demo_scheduled', 'demo_completed', 'pilot', 'customer') THEN 10 ELSE 0 END
    )),
    icp_factors = jsonb_build_object(
      'commodity_focus', p.commodity_focus IS NOT NULL,
      'country', p.country IS NOT NULL,
      'company_size', p.company_size IS NOT NULL,
      'linkedin', p.linkedin_url IS NOT NULL,
      'pilot_interest', COALESCE(p.pilot_interest_score, 0),
      'high_intent_tags', p.tags && ARRAY['source:pilot', 'intent:high']::text[],
      'advanced_stage', p.stage IN ('demo_scheduled', 'demo_completed', 'pilot', 'customer')
    ),
    updated_at = now()
  WHERE p.stage NOT IN ('dead', 'not_interested');

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_prospect_icp_scores()
RETURNS integer
LANGUAGE sql
SET search_path = crm, public
AS $$ SELECT crm.refresh_prospect_icp_scores(); $$;

CREATE OR REPLACE FUNCTION crm.penetration_metrics()
RETURNS TABLE (metric_key text, metric_value bigint, metric_label text)
LANGUAGE sql
STABLE
SET search_path = crm, public
AS $$
  SELECT 'prospects_total'::text, COUNT(*)::bigint, 'Total prospects'::text FROM crm.prospects
  UNION ALL
  SELECT 'prospects_active', COUNT(*)::bigint, 'Active pipeline'
    FROM crm.prospects WHERE stage NOT IN ('dead', 'not_interested', 'customer')
  UNION ALL
  SELECT 'prospects_demo_plus', COUNT(*)::bigint, 'Demo scheduled or beyond'
    FROM crm.prospects WHERE stage IN ('demo_scheduled', 'demo_completed', 'pilot', 'customer')
  UNION ALL
  SELECT 'prospects_customers', COUNT(*)::bigint, 'Customers'
    FROM crm.prospects WHERE stage = 'customer'
  UNION ALL
  SELECT 'pilots_active', COUNT(*)::bigint, 'Active pilots'
    FROM crm.pilots WHERE status = 'active'
  UNION ALL
  SELECT 'pilots_success', COUNT(*)::bigint, 'Successful pilots'
    FROM crm.pilots WHERE status = 'success'
  UNION ALL
  SELECT 'partnerships_active', COUNT(*)::bigint, 'Active partnerships'
    FROM crm.partnerships WHERE status IN ('pilot', 'active')
  UNION ALL
  SELECT 'markets_beachhead', COUNT(*)::bigint, 'Beachhead markets'
    FROM crm.market_registry WHERE priority_tier = 'beachhead' AND active = true
  UNION ALL
  SELECT 'objections_open', COUNT(*)::bigint, 'Open objections'
    FROM crm.objection_log WHERE outcome = 'open'
  UNION ALL
  SELECT 'icp_high', COUNT(*)::bigint, 'ICP score 70+'
    FROM crm.prospects WHERE COALESCE(icp_score, 0) >= 70
$$;

CREATE OR REPLACE FUNCTION public.penetration_metrics()
RETURNS TABLE (metric_key text, metric_value bigint, metric_label text)
LANGUAGE sql
STABLE
SET search_path = crm, public
AS $$ SELECT * FROM crm.penetration_metrics(); $$;

INSERT INTO crm.market_registry (country_code, country_name, commodity, segment, priority_tier, entry_wedge, regulatory_notes)
VALUES
  ('CI', 'Côte d''Ivoire', 'cocoa', 'exporter', 'beachhead', 'Co-op traceability + EUDR dossier prep', 'EUDR due diligence for cocoa exports to EU'),
  ('GH', 'Ghana', 'cocoa', 'exporter', 'beachhead', 'Farmer polygon capture offline', 'National cocoa board alignment'),
  ('BR', 'Brazil', 'coffee', 'exporter', 'expand', 'Smallholder polygon + deforestation attestation', 'Large exporter base; EUDR coffee scope'),
  ('ID', 'Indonesia', 'palm', 'exporter', 'expand', 'Plot-level geodata for RSPO/EUDR overlap', 'Palm oil EUDR high scrutiny'),
  ('DE', 'Germany', 'multi', 'importer', 'beachhead', 'Operator due diligence workflow', 'EU operator obligations'),
  ('NL', 'Netherlands', 'multi', 'importer', 'expand', 'Port/trader compliance desk', 'Major EU import hub')
ON CONFLICT (country_code, commodity, segment) DO NOTHING;

COMMIT;
