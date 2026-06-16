# FDP coffee screening worker (Earth Engine)

Hosts Forest Data Partnership `model_2025b` coffee probability queries for Tracebud plot polygons.

## Pilot scope

- Commodity: **coffee** only
- Countries: **Nigeria (NG)**, **Rwanda (RW)**, **Tanzania (TZ)**

## Setup

```bash
cd tracebud-backend/scripts/fdp-screening-worker
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
earthengine authenticate
# Or set GOOGLE_APPLICATION_CREDENTIALS to a GCP service account with Earth Engine access.
export EE_PROJECT=your-gcp-project-id
```

## Run locally

```bash
uvicorn main:app --host 0.0.0.0 --port 8095
```

Point the NestJS backend at the worker:

```bash
FDP_ENABLED=true
FDP_SCREENING_WORKER_URL=http://127.0.0.1:8095
```

## API

`POST /screen`

```json
{
  "geometry": { "type": "Polygon", "coordinates": [...] },
  "commodity": "coffee",
  "countryCode": "TZ",
  "years": [2019, 2020, 2021],
  "modelVersion": "2025b"
}
```

Returns per-year mean / p50 / p90 coffee probability, plus the strongest competing commodity at the 2020 baseline.

## Earth Engine collections

- `projects/forestdatapartnership/assets/coffee/model_2025b`
- Competing crops: `cocoa`, `palm`, `rubber` (same model version)

## Commercial use

FDP datasets have separate Earth Engine commercial terms. Set `FDP_COMMERCIAL_TERMS_ACK=true` on the backend before enabling in production.

## Spike polygons (coffee belt sanity checks)

| Country | Approx. center | Use |
|---------|----------------|-----|
| Tanzania | `-3.35, 37.34` | Kilimanjaro / Arusha coffee |
| Rwanda | `-1.95, 29.87` | Lake Kivu coffee belt |
| Nigeria | `9.90, 8.90` | Plateau State coffee |

Run `npm run check:fdp` from `tracebud-backend/` after the worker is up.
