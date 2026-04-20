-- TB-V16-006: phase-2 RLS expansion + function search_path hardening
-- Purpose: close remaining high-risk public-schema advisor findings for app-domain tables.

BEGIN;

-- Enable RLS for remaining app-domain public tables flagged by advisors.
ALTER TABLE public.cadence_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cooperative_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.country_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exporter_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farmer_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.importer_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sinaph_zone ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.indigenous_zone ENABLE ROW LEVEL SECURITY;

-- Harden mutable function search_path warnings.
ALTER FUNCTION public.content_tasks_due(date) SET search_path = public, pg_temp;
ALTER FUNCTION public.daily_outreach_actions(date) SET search_path = public, pg_temp;
ALTER FUNCTION public.generate_content_tasks(date) SET search_path = public, pg_temp;
ALTER FUNCTION public.generate_daily_actions(date) SET search_path = public, pg_temp;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public, pg_temp;

COMMIT;
