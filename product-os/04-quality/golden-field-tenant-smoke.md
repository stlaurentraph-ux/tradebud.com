# Golden field tenant smoke (slice 4.O.2)

Dedicated **production API** farmer pair for cross-tenant isolation probes in Expo CI. Farmer A must **not** read or mutate Farmer B's plots.

**Manifest:** `golden-field-tenant-smoke.json`  
**Backend constants:** `tracebud-backend/src/testing/golden-field-tenant-smoke.constants.ts`  
**Smoke:** `npm run qa:tenant-isolation` (local)  
**CI guard:** `npm run qa:tenant-isolation:assert`

---

## Farmer pair (human-created — values in secrets only)

| Role | Label | Recommended email | Stored in GitHub |
|------|-------|-------------------|------------------|
| **Farmer A** (probe actor) | Field tenant smoke probe A | `field+tenant-smoke-a@tracebud.com` | `FIELD_TENANT_SMOKE_FARMER_A_EMAIL`, `FIELD_TENANT_SMOKE_FARMER_A_PASSWORD` |
| **Farmer B** (victim data) | Field tenant smoke probe B | `field+tenant-smoke-b@tracebud.com` | `FIELD_TENANT_SMOKE_FARMER_B_ID`, `FIELD_TENANT_SMOKE_FARMER_B_PLOT_ID` |

Farmer B does **not** need a password in CI — only A signs in. B must exist on production with at least one synced plot so probes have a real foreign `farmerId` + `plotId`.

---

## One-time fixture setup (production)

1. **Create Supabase auth users** for A and B (Google or email/password). Set `app_metadata.role = farmer` on both.
2. **Sign in as Farmer B** on the field app (or Metro production API) once — complete farmer profile and register **one plot** (any name; keep it stable).
3. **Resolve IDs** (Supabase SQL or backend logs):
   - `FIELD_TENANT_SMOKE_FARMER_B_ID` → `farmer_profile.id` (or API farmer uuid linked to B's auth user)
   - `FIELD_TENANT_SMOKE_FARMER_B_PLOT_ID` → `plot.id` owned by B
4. **Sign in as Farmer A** — confirm A has **zero** plots under B's farmer id (A is a separate farmer account).

**Production fixture IDs (2026-06-22):** after setup, store in GitHub secrets only — `FIELD_TENANT_SMOKE_FARMER_B_ID` = farmer B profile uuid; `FIELD_TENANT_SMOKE_FARMER_B_PLOT_ID` = plot uuid owned by B. Farmer A password in `FIELD_TENANT_SMOKE_FARMER_A_PASSWORD`.

5. **Local smoke** (from `apps/offline-product`):

```bash
cp .env.example .env.local
# Set EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY
# Set FIELD_TENANT_SMOKE_* vars (see .env.example)

npm run qa:tenant-isolation
```

Expected: `PASS farmer A cannot list farmer B plots (403)` and foreign PATCH denied.

---

## Probes (must stay green)

| Probe | Request | Expected |
|-------|---------|----------|
| Foreign farmer list | `GET /v1/plots?farmerId={B}&scope=farmer` as A | **403** |
| Foreign plot patch | `PATCH /v1/plots/{plotBId}` as A | **≥400** (403 Plot scope violation) |

---

## GitHub secrets (human setup)

Add in **Settings → Secrets and variables → Actions**:

| Secret | Purpose |
|--------|---------|
| `SUPABASE_URL` | Already used by deploy smoke — reused here |
| `SUPABASE_ANON_KEY` | Already used by deploy smoke — reused here |
| `FIELD_TENANT_SMOKE_FARMER_A_EMAIL` | Farmer A login |
| `FIELD_TENANT_SMOKE_FARMER_A_PASSWORD` | Farmer A password |
| `FIELD_TENANT_SMOKE_FARMER_B_ID` | Farmer B profile uuid |
| `FIELD_TENANT_SMOKE_FARMER_B_PLOT_ID` | Farmer B plot uuid |
| `FIELD_TENANT_SMOKE_API_URL` | Optional — defaults to `https://api.tracebud.com/api` |

**CI behavior:** Expo `app` job sets `FIELD_TENANT_SMOKE_STRICT=1`. Missing secrets **fail** the job (no silent skip). Wiring is guarded by `qa:tenant-isolation:assert`.

---

## Rotation

- Rotate A's password in Supabase → update `FIELD_TENANT_SMOKE_FARMER_A_PASSWORD`.
- If B's plot is deleted, re-register one plot and update `FIELD_TENANT_SMOKE_FARMER_B_PLOT_ID`.
- Do **not** reuse real farmer accounts (Hector, demo users, etc.) — dedicated smoke pair only.

---

## Unblocks

- **4.O.2** — blocking tenant isolation in offline Expo CI
- **Launch readiness** — `LAUNCH_READINESS_CHECKLIST.md` tenant isolation checkbox
