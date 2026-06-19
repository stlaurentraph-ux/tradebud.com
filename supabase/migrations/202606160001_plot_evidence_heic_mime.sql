-- Allow iPhone HEIC/HEIF land-document photos in plot-evidence bucket.

UPDATE storage.buckets
SET allowed_mime_types = ARRAY(
  SELECT DISTINCT unnest(
    COALESCE(allowed_mime_types, ARRAY[]::text[])
      || ARRAY['image/heic', 'image/heif']::text[]
  )
)
WHERE id = 'plot-evidence';
