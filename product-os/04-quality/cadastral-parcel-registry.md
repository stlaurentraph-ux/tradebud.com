# Cadastral parcel registry (demo fixtures)

Code mirror: `tracebud-backend/src/plots/backendCadastralParcelRegistry.ts`  
Fixtures: `tracebud-backend/src/plots/cadastral-parcel-fixtures.ts`  
Guard: `backend-cadastral-parcel-guard.mjs`

## Demo keys (`BACKEND_CADASTRAL_PARCEL_DEMO_KEYS`)

| Country | Raw key | Normalized fixture key |
|---------|---------|------------------------|
| HN | `0123456789` | `HN:012-345-678-9` |
| GT | `1234567890` | `GT:123-456-7890` |

## API

- `GET /api/v1/cadastral/parcels/lookup?countryIso=&cadastralKey=`
- Dashboard proxy: `/api/cadastral/parcels/lookup`

## Observability

Lookup misses emit Sentry message `cadastral_parcel_lookup_miss` with tags:

- `cadastral.lookup.miss`
- `cadastral.lookup.invalid_key`
- `cadastral.lookup.unsupported_country`

## Smoke

- `npm run smoke:cadastral-parcel-lookup -w tracebud-backend`
