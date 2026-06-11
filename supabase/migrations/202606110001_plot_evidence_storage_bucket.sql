-- Offline farmer plot evidence (FPIC, tenure, permits, labor)
-- Applied to Tracebud CRM (uzsktajlnofosxeqwdwl) via Supabase migration 2026-06-11.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'plot-evidence',
  'plot-evidence',
  false,
  52428800,
  ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
    'text/plain'
  ]::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS plot_evidence_insert_own ON storage.objects;
CREATE POLICY plot_evidence_insert_own
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'plot-evidence'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );

DROP POLICY IF EXISTS plot_evidence_select_own ON storage.objects;
CREATE POLICY plot_evidence_select_own
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'plot-evidence'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );

DROP POLICY IF EXISTS plot_evidence_update_own ON storage.objects;
CREATE POLICY plot_evidence_update_own
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'plot-evidence'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  )
  WITH CHECK (
    bucket_id = 'plot-evidence'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );

DROP POLICY IF EXISTS plot_evidence_delete_own ON storage.objects;
CREATE POLICY plot_evidence_delete_own
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'plot-evidence'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );
