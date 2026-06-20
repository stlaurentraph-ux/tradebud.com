BEGIN;

-- ── plot_ops_summary: security invoker (advisor ERROR fix) ──────────────────

DROP VIEW IF EXISTS public.plot_ops_summary;

CREATE VIEW public.plot_ops_summary
WITH (security_invoker = true)
AS
WITH
  legal_latest AS (
    SELECT DISTINCT ON (payload ->> 'plotId')
      (payload ->> 'plotId')::uuid AS plot_id,
      NULLIF(BTRIM(payload ->> 'cadastralKey'), '') AS cadastral_key,
      CASE
        WHEN payload ->> 'informalTenure' IN ('true', 't') THEN TRUE
        WHEN payload ->> 'informalTenure' IN ('false', 'f') THEN FALSE
        ELSE NULL
      END AS informal_tenure,
      timestamp AS legal_synced_at
    FROM internal.audit_log
    WHERE event_type = 'plot_legal_synced'
      AND payload ? 'plotId'
    ORDER BY payload ->> 'plotId', timestamp DESC
  ),
  tenure_agg AS (
    SELECT
      plot_id,
      COUNT(*)::int AS tenure_verification_count,
      MAX(updated_at) AS tenure_last_updated_at,
      CASE
        WHEN BOOL_OR(parse_status = 'MANUAL_REQUIRED') THEN 'manual_required'
        WHEN BOOL_OR(parse_status = 'FAILED') THEN 'failed'
        WHEN BOOL_OR(parse_status IN ('PENDING', 'IN_PROGRESS')) THEN 'pending'
        WHEN COUNT(*) FILTER (WHERE parse_status = 'COMPLETED') > 0 THEN 'completed'
        ELSE 'none'
      END AS tenure_parse_status
    FROM public.plot_tenure_verification
    GROUP BY plot_id
  ),
  evidence_agg AS (
    SELECT
      plot_id,
      COUNT(*)::int AS evidence_doc_count,
      COUNT(*) FILTER (WHERE evidence_kind = 'tenure_evidence')::int AS tenure_evidence_count,
      COUNT(*) FILTER (WHERE evidence_kind = 'fpic_repository')::int AS fpic_doc_count,
      COUNT(*) FILTER (WHERE evidence_kind = 'protected_area_permit')::int AS permit_doc_count,
      MAX(updated_at) AS evidence_last_updated_at
    FROM public.evidence_documents
    GROUP BY plot_id
  ),
  harvest_agg AS (
    SELECT
      plot_id,
      COUNT(*)::int AS delivery_count,
      COALESCE(SUM(kg), 0)::numeric AS total_harvest_kg,
      MAX(harvest_date) AS last_delivery_date,
      MAX(created_at) AS last_delivery_at
    FROM public.harvest_transaction
    GROUP BY plot_id
  ),
  photo_latest AS (
    SELECT DISTINCT ON (payload ->> 'plotId')
      (payload ->> 'plotId')::uuid AS plot_id,
      payload -> 'photos' AS photos,
      timestamp AS photos_synced_at
    FROM internal.audit_log
    WHERE event_type = 'plot_photos_synced'
      AND payload ->> 'kind' = 'ground_truth'
      AND payload ? 'plotId'
    ORDER BY payload ->> 'plotId', timestamp DESC
  ),
  photo_agg AS (
    SELECT
      plot_id,
      COALESCE(jsonb_array_length(photos), 0)::int AS ground_truth_photo_count,
      photos_synced_at
    FROM photo_latest
  )
SELECT
  p.id AS plot_id,
  p.name,
  p.farmer_id,
  p.farmer_display_name,
  p.client_plot_id,
  CASE
    WHEN p.id = '39d548f9-1ef4-449f-9ebd-fd244ae5d69e'::uuid THEN 'demo'
    WHEN NULLIF(BTRIM(p.client_plot_id), '') IS NOT NULL THEN 'device'
    ELSE 'crm'
  END AS upload_source,
  CASE
    WHEN p.kind = 'polygon' AND p.geography IS NOT NULL THEN 'mapped_boundary'
    WHEN p.kind = 'polygon' THEN 'polygon_pending'
    WHEN p.kind = 'point' THEN 'pin_location'
    ELSE 'unknown'
  END AS field_capture_code,
  CASE
    WHEN p.kind = 'polygon' AND p.geography IS NOT NULL THEN 'Mapped boundary'
    WHEN p.kind = 'polygon' THEN 'Polygon — boundary pending'
    WHEN p.kind = 'point' THEN 'Pin location'
    ELSE 'Unknown capture'
  END AS field_capture_label,
  p.kind,
  p.created_at,
  p.updated_at,
  COALESCE(
    NULLIF(p.deforestation_screening ->> 'screenedAt', '')::timestamptz,
    p.updated_at
  ) AS last_screened_at,
  p.status::text AS deforestation_screening_status,
  CASE p.status::text
    WHEN 'deforestation_clear' THEN 'Deforestation clear'
    WHEN 'pending_check' THEN 'Screening pending'
    WHEN 'under_review' THEN 'Under review'
    WHEN 'degradation_risk' THEN 'Degradation / overlap risk'
    WHEN 'deforestation_detected' THEN 'Deforestation signal'
    ELSE p.status::text
  END AS deforestation_screening_label,
  NULLIF(p.deforestation_screening ->> 'signalTier', '') AS deforestation_signal_tier,
  p.sinaph_overlap,
  p.indigenous_overlap,
  COALESCE(ten.tenure_verification_count, 0) AS tenure_verification_count,
  COALESCE(ten.tenure_parse_status, 'none') AS tenure_parse_status,
  ten.tenure_last_updated_at,
  leg.cadastral_key,
  leg.informal_tenure,
  leg.legal_synced_at,
  CASE
    WHEN leg.informal_tenure IS TRUE
      AND (
        COALESCE(ten.tenure_verification_count, 0) > 0
        OR COALESCE(ev.tenure_evidence_count, 0) > 0
        OR leg.cadastral_key IS NOT NULL
      ) THEN 'producer_in_possession'
    WHEN leg.cadastral_key IS NOT NULL
      OR COALESCE(ten.tenure_verification_count, 0) > 0
      OR COALESCE(ev.tenure_evidence_count, 0) > 0 THEN 'formal_documented'
    WHEN leg.cadastral_key IS NULL
      AND COALESCE(ten.tenure_verification_count, 0) = 0
      AND COALESCE(ev.tenure_evidence_count, 0) = 0 THEN 'missing'
    ELSE 'undeclared'
  END AS land_tenure_status,
  CASE
    WHEN leg.informal_tenure IS TRUE
      AND (
        COALESCE(ten.tenure_verification_count, 0) > 0
        OR COALESCE(ev.tenure_evidence_count, 0) > 0
        OR leg.cadastral_key IS NOT NULL
      ) THEN 'Producer in possession'
    WHEN leg.cadastral_key IS NOT NULL
      OR COALESCE(ten.tenure_verification_count, 0) > 0
      OR COALESCE(ev.tenure_evidence_count, 0) > 0 THEN 'Documented'
    WHEN leg.cadastral_key IS NULL
      AND COALESCE(ten.tenure_verification_count, 0) = 0
      AND COALESCE(ev.tenure_evidence_count, 0) = 0 THEN 'Missing documentation'
    ELSE 'Not declared yet'
  END AS land_tenure_label,
  COALESCE(ev.evidence_doc_count, 0) AS evidence_doc_count,
  COALESCE(ev.tenure_evidence_count, 0) AS tenure_evidence_count,
  COALESCE(ev.fpic_doc_count, 0) AS fpic_doc_count,
  COALESCE(ev.permit_doc_count, 0) AS permit_doc_count,
  ev.evidence_last_updated_at,
  COALESCE(ph.ground_truth_photo_count, 0) AS ground_truth_photo_count,
  ph.photos_synced_at AS ground_truth_photos_synced_at,
  COALESCE(hv.delivery_count, 0) AS delivery_count,
  COALESCE(hv.total_harvest_kg, 0) AS total_harvest_kg,
  hv.last_delivery_date,
  hv.last_delivery_at,
  p.area_ha,
  p.declared_area_ha,
  p.area_discrepancy_pct,
  (p.geography IS NOT NULL) AS has_geography,
  (
    p.status = 'deforestation_clear'::plot_status
    AND (
      (p.kind = 'polygon'::plot_kind AND p.geography IS NOT NULL)
      OR (
        p.kind = 'point'::plot_kind
        AND COALESCE(p.area_ha, p.declared_area_ha, 0) > 0
        AND COALESCE(p.area_ha, p.declared_area_ha, 0) < 4
      )
    )
    AND CASE
      WHEN leg.informal_tenure IS TRUE
        AND (
          COALESCE(ten.tenure_verification_count, 0) > 0
          OR COALESCE(ev.tenure_evidence_count, 0) > 0
          OR leg.cadastral_key IS NOT NULL
        ) THEN TRUE
      WHEN leg.cadastral_key IS NOT NULL
        OR COALESCE(ten.tenure_verification_count, 0) > 0
        OR COALESCE(ev.tenure_evidence_count, 0) > 0 THEN TRUE
      ELSE FALSE
    END
    AND (
      p.status <> 'under_review'::plot_status
      OR COALESCE(ph.ground_truth_photo_count, 0) >= 4
    )
  ) AS eudr_dossier_ready_hint
FROM public.plot p
LEFT JOIN legal_latest leg ON leg.plot_id = p.id
LEFT JOIN tenure_agg ten ON ten.plot_id = p.id
LEFT JOIN evidence_agg ev ON ev.plot_id = p.id
LEFT JOIN harvest_agg hv ON hv.plot_id = p.id
LEFT JOIN photo_agg ph ON ph.plot_id = p.id;

COMMENT ON VIEW public.plot_ops_summary IS
  'Default Supabase browse surface for ops/support. One row per plot with human-readable screening/tenure labels and aggregated counts. Canonical writes still go to plot + child tables. eudr_dossier_ready_hint is approximate — CRM plot detail is authoritative for shipment filing.';

-- ── Function search_path hardening (security advisor WARN) ────────────────────

ALTER FUNCTION public.resolve_farmer_display_name(uuid) SET search_path = public, crm, pg_temp;
ALTER FUNCTION public.plot_set_farmer_display_name() SET search_path = public, crm, pg_temp;
ALTER FUNCTION public.user_account_refresh_plot_farmer_names() SET search_path = public, crm, pg_temp;
ALTER FUNCTION public.crm_contacts_refresh_plot_farmer_names() SET search_path = public, crm, pg_temp;

-- ── Farmer display name: fix crm schema references after Phase 1 move ────────

CREATE OR REPLACE FUNCTION resolve_farmer_display_name(p_farmer_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SET search_path = public, crm, pg_temp
AS $$
DECLARE
  v_name TEXT;
BEGIN
  SELECT COALESCE(
    (
      SELECT cc.full_name
      FROM crm.crm_contacts cc
      WHERE cc.farmer_profile_id = fp.id
      ORDER BY cc.updated_at DESC
      LIMIT 1
    ),
    ua.name,
    LEFT(fp.id::text, 8)
  )
  INTO v_name
  FROM farmer_profile fp
  LEFT JOIN user_account ua ON ua.id = fp.user_id
  WHERE fp.id = p_farmer_id;

  RETURN v_name;
END;
$$;

CREATE OR REPLACE FUNCTION crm_contacts_refresh_plot_farmer_names()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, crm, pg_temp
AS $$
DECLARE
  v_farmer_id UUID;
BEGIN
  v_farmer_id := COALESCE(NEW.farmer_profile_id, OLD.farmer_profile_id);
  IF v_farmer_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF TG_OP = 'UPDATE'
    AND (OLD.full_name IS NOT DISTINCT FROM NEW.full_name)
    AND (OLD.farmer_profile_id IS NOT DISTINCT FROM NEW.farmer_profile_id) THEN
    RETURN NEW;
  END IF;

  UPDATE plot
  SET farmer_display_name = resolve_farmer_display_name(v_farmer_id)
  WHERE farmer_id = v_farmer_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS crm_contacts_refresh_plot_farmer_names_trg ON crm.crm_contacts;

CREATE TRIGGER crm_contacts_refresh_plot_farmer_names_trg
  AFTER INSERT OR UPDATE OF full_name, farmer_profile_id OR DELETE
  ON crm.crm_contacts
  FOR EACH ROW
  EXECUTE FUNCTION crm_contacts_refresh_plot_farmer_names();

COMMIT;
