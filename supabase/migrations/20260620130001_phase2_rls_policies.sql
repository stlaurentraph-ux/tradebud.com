-- ADR-006 Phase 2 (part 2): RLS policies, security invoker view, farmer display name fixes.

BEGIN;

-- ── RLS: tables with RLS enabled but no policy (security advisor) ───────────

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'prospects', 'outreach_templates', 'outreach_activity', 'daily_actions',
    'content_ideas', 'content_calendar', 'content_tasks', 'cadence_settings'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS crm_%I_postgrest_deny ON crm.%I', t, t);
    EXECUTE format(
      'CREATE POLICY crm_%I_postgrest_deny ON crm.%I FOR ALL TO anon, authenticated USING (false) WITH CHECK (false)',
      t, t
    );
  END LOOP;

  FOREACH t IN ARRAY ARRAY[
    'waitlist_signups', 'cooperative_leads', 'country_leads',
    'exporter_leads', 'farmer_leads', 'importer_leads'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS gtm_%I_postgrest_deny ON gtm.%I', t, t);
    EXECUTE format(
      'CREATE POLICY gtm_%I_postgrest_deny ON gtm.%I FOR ALL TO anon, authenticated USING (false) WITH CHECK (false)',
      t, t
    );
  END LOOP;
END $$;

DROP POLICY IF EXISTS integrations_yield_benchmarks_postgrest_deny ON integrations.yield_benchmarks;
CREATE POLICY integrations_yield_benchmarks_postgrest_deny
ON integrations.yield_benchmarks
FOR ALL TO anon, authenticated
USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS integrations_yield_benchmark_import_runs_postgrest_deny ON integrations.yield_benchmark_import_runs;
CREATE POLICY integrations_yield_benchmark_import_runs_postgrest_deny
ON integrations.yield_benchmark_import_runs
FOR ALL TO anon, authenticated
USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS sinaph_zone_postgrest_deny ON public.sinaph_zone;
CREATE POLICY sinaph_zone_postgrest_deny
ON public.sinaph_zone
FOR ALL TO anon, authenticated
USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS indigenous_zone_postgrest_deny ON public.indigenous_zone;
CREATE POLICY indigenous_zone_postgrest_deny
ON public.indigenous_zone
FOR ALL TO anon, authenticated
USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "Allow public form submissions" ON gtm.leads;
DROP POLICY IF EXISTS leads_public_insert_guarded ON gtm.leads;

CREATE POLICY leads_public_insert_guarded
ON gtm.leads
FOR INSERT
TO public
WITH CHECK (
  char_length(btrim(first_name)) > 0
  AND char_length(btrim(last_name)) > 0
  AND char_length(btrim(company)) > 0
  AND char_length(btrim(looking_for)) > 0
  AND email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  AND status = 'New'
);

COMMIT;
