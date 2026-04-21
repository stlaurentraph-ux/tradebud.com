-- TB-V16-017: Canonicalize yield benchmark commodity/geography dimensions
-- Purpose:
-- - Standardize commodity keys to canonical runtime value (`coffee`) for coffee benchmarks.
-- - Standardize geography keys to ISO-2 country codes for seeded FAOSTAT exporter rows.
-- - Reduce future alias-lookup drift between import, activation, and harvest runtime resolution.

BEGIN;

UPDATE yield_benchmarks
SET commodity = 'coffee'
WHERE LOWER(commodity) IN ('656', 'coffee, green', 'coffee');

UPDATE yield_benchmarks
SET geography = CASE geography
  WHEN '21' THEN 'BR'
  WHEN '37' THEN 'CF'
  WHEN '44' THEN 'CO'
  WHEN '48' THEN 'CR'
  WHEN '89' THEN 'GT'
  WHEN '95' THEN 'HN'
  WHEN '100' THEN 'IN'
  WHEN '101' THEN 'ID'
  WHEN '107' THEN 'CI'
  WHEN '114' THEN 'KE'
  WHEN '138' THEN 'MX'
  WHEN '168' THEN 'PG'
  WHEN '170' THEN 'PE'
  WHEN '215' THEN 'TZ'
  WHEN '226' THEN 'UG'
  WHEN '237' THEN 'VN'
  WHEN '238' THEN 'ET'
  ELSE geography
END
WHERE geography IN (
  '21', '37', '44', '48', '89', '95', '100', '101', '107', '114',
  '138', '168', '170', '215', '226', '237', '238'
);

COMMIT;
