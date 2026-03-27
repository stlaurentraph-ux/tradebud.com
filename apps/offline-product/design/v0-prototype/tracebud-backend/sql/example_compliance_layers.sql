-- Example SINAPH / Indigenous layers for compliance re-checks
-- This is purely illustrative. In a real deployment you would
-- load official layers (e.g. GeoJSON/shape files) into these tables.

create table if not exists sinaph_zone (
  id uuid primary key default gen_random_uuid(),
  name text,
  geometry geometry(Polygon, 4326)
);

create table if not exists indigenous_zone (
  id uuid primary key default gen_random_uuid(),
  name text,
  geometry geometry(Polygon, 4326)
);

-- Example small demo polygons (replace with real data)
insert into sinaph_zone (name, geometry)
values (
  'Demo SINAPH block',
  ST_SetSRID(
    ST_GeomFromText('POLYGON((-87.13 14.12, -87.11 14.12, -87.11 14.14, -87.13 14.14, -87.13 14.12))'),
    4326
  )
)
on conflict do nothing;

insert into indigenous_zone (name, geometry)
values (
  'Demo Indigenous territory',
  ST_SetSRID(
    ST_GeomFromText('POLYGON((-87.15 14.10, -87.12 14.10, -87.12 14.13, -87.15 14.13, -87.15 14.10))'),
    4326
  )
)
on conflict do nothing;

