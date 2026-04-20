-- TB-V16-008: leads insert policy hardening
-- Purpose: replace permissive WITH CHECK (true) policy with minimal input guards.

BEGIN;

DROP POLICY IF EXISTS "Allow public form submissions" ON public.leads;
DROP POLICY IF EXISTS leads_public_insert_guarded ON public.leads;

CREATE POLICY leads_public_insert_guarded
ON public.leads
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
