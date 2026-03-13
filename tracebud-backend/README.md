## Tracebud Backend (NestJS + Postgres + Supabase)

**Purpose:** API for plots, harvests, vouchers and DDS packages, using Supabase Auth and a PostgreSQL database with PostGIS.

### 1. Prerequisites

- Node.js 18+
- A Supabase project with:
  - Postgres + PostGIS enabled
  - Connection pooling URL (used as `DATABASE_URL`)
  - Auth configured with at least one test user

### 2. Environment variables

Create a `.env` file in `tracebud-backend` with:

```bash
PORT=4001
DATABASE_URL=postgresql://postgres.uzsktajlnofosxeqwdwl:YOUR_PASSWORD@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

> The `DATABASE_URL` should match the **pooling** URL from Supabase. For migrations you can also keep a `DIRECT_URL` if needed, but the app only uses `DATABASE_URL`.

### 3. Install & run

From the `tracebud-backend` directory:

```bash
npm install
npm run build
npm start
```

The API will listen on `http://localhost:4001/api`.

Open Swagger docs at:

```text
http://localhost:4001/api/docs
```

#### Option B: Run with Docker

From the repo root (one level above `tracebud-backend`), you can use the provided
`Dockerfile` and `docker-compose.yml`:

```bash
# Ensure these env vars are set in your shell or a .env file:
# DATABASE_URL=...
# SUPABASE_URL=...
# SUPABASE_ANON_KEY=...

docker compose up --build
```

This will build the backend image and expose it on `http://localhost:4001/api`.

### 4. Auth & roles

- All main endpoints are protected by **Supabase JWT** using the `Authorization: Bearer <token>` header.
- Roles are derived from the Supabase user’s email:
  - `agent+...@...` → **agent**
  - `exporter+...@...` or `@tracebud.com` → **exporter**
  - everything else → **farmer**
- Permissions (simplified):
  - **farmer / agent**: create plots, record harvests (vouchers).
  - **exporter**: create & submit DDS packages; run compliance checks.

To get a token for testing, use the script in `scripts/get-supabase-token.ts`:

```bash
npm run ts-node scripts/get-supabase-token.ts
```

…then copy the printed `access_token` into `curl` or Swagger’s “Authorize” button.

### 5. Key endpoints (high level)

- **Plots**
  - `POST /api/v1/plots` – create a plot (point or polygon). Computes `area_ha` in PostGIS and enforces a 5 % tolerance vs `declaredAreaHa`.
  - `GET /api/v1/plots?farmerId=...` – list plots for a farmer, including compliance flags and status.
  - `PATCH /api/v1/plots/:id/compliance-check` – SINAPH/Indigenous re-check that sets `status`, `sinaph_overlap`, `indigenous_overlap` based on spatial overlaps with external layers.

- **Harvests / vouchers / DDS**
  - `POST /api/v1/harvest` – create harvest + voucher with yield cap (kg/ha).
  - `GET /api/v1/harvest/vouchers?farmerId=...` – list vouchers.
  - `POST /api/v1/harvest/packages` – create DDS package from vouchers (exporter-only).
  - `GET /api/v1/harvest/packages?farmerId=...` – list DDS packages.
  - `PATCH /api/v1/harvest/packages/:id/submit` – submit DDS package and assign a fake TRACES reference (exporter-only).

- **Reports**
  - `GET /api/v1/reports/plots?farmerId=...&format=json|csv` – plots + compliance flags for a farmer, optionally as CSV.
  - `GET /api/v1/reports/harvests?farmerId=...&from=YYYY-MM-DD&to=YYYY-MM-DD&format=json|csv` – harvests + vouchers and plots, optionally as CSV.

### 6. Architecture at a glance

- `src/app.module.ts` – root Nest module.
- `src/db` – Drizzle schema + `DbModule` wiring Postgres connection.
- `src/auth` – Supabase JWT guard and role derivation.
- `src/plots` – plots controller/service (geometry handling, area, compliance flags).
- `src/harvest` – harvests, vouchers, and DDS packages.

### 7. Integrating satellite / SINAPH data

- The compliance check expects two PostGIS tables:
  - `sinaph_zone(id, name, geometry geometry(Polygon, 4326))`
  - `indigenous_zone(id, name, geometry geometry(Polygon, 4326))`
- On each `PATCH /api/v1/plots/:id/compliance-check` call the backend:
  - Reads the plot geometry from `plot.geometry`.
  - Uses a 50m buffer around the plot (`ST_Buffer(geometry::geography, 50)::geometry`) and `ST_Intersects` against `sinaph_zone` and `indigenous_zone`.
  - Updates:
    - `sinaph_overlap` / `indigenous_overlap` booleans.
    - `status` = `compliant` / `degradation_risk` / `deforestation_detected` based on overlaps.

To try this locally, you can run the helper SQL script:

```bash
# In Supabase SQL editor or psql, run:
-- contents of sql/example_compliance_layers.sql
```

For production, replace the demo polygons with official SINAPH / Indigenous layers
loaded into those tables (e.g. via GeoJSON imports or ETL from your satellite pipeline).

