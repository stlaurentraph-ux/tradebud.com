# AGENTS.md

## Cursor Cloud specific instructions

### Repository structure

This is NOT a monorepo with shared workspace tooling. Each service has its own independent `package.json` and `package-lock.json`. Use `npm` as the package manager (lockfiles are `package-lock.json`).

| Service | Path | Framework | Dev command | Default port |
|---------|------|-----------|-------------|--------------|
| Root app | `/` | Next.js 16 | `npm run dev` | 3000 |
| Backend API | `/tracebud-backend` | NestJS + Drizzle + PostGIS | `npm run start:dev` | 4001 (or `PORT` env) |
| Dashboard | `/apps/dashboard-product` | Next.js 16 | `npm run dev` | 3000 (use `PORT=3001` to avoid conflict) |
| Offline mobile | `/apps/offline-product` | Expo 54 / React Native | `expo start` | 8081 (Metro) |

### Running services

- **Backend** requires env vars: `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`. Without a real Supabase Postgres, the server starts but DB-dependent endpoints return connection errors.
- **Backend** builds with `npm run build` (NestJS CLI). Dev mode: `npm run start:dev` (uses `--watch`).
- **Dashboard and root app** both default to port 3000. Run one with `PORT=3001 npm run dev` to avoid conflict.
- The backend Swagger docs are at `http://localhost:4001/api/docs`.

### Lint and test

- **Root**: `npm run lint` (ESLint, flat config at `eslint.config.mjs`; ignores `apps/` and `tracebud-backend/`)
- **Backend**: `npm run lint` in `/tracebud-backend` (flat config `eslint.config.mjs`)
- **Backend unit tests**: `npm test` in `/tracebud-backend` (Jest, `--runInBand`)
- **Backend integration tests**: `npm run test:integration` (requires `TEST_DATABASE_URL` via `scripts/run-with-root-test-db.mjs`)
- **Dashboard**: `npm run lint` and `npm test` (Vitest) in `/apps/dashboard-product`
- **Offline app**: `npm run lint` (Expo lint) in `/apps/offline-product`

### Known pre-existing issues

- Root lint: 6 errors in `app/page.tsx` (undefined `Navigation`, `@typescript-eslint/no-explicit-any`)
- Dashboard lint: ~37 errors (pre-existing issues with `@typescript-eslint/no-require-imports`, `react-hooks/set-state-in-effect`)
- Backend tests: 3 suites fail due to `ReportsController` constructor signature mismatch in spec files
- Dashboard tests: 21 tests fail due to missing `useSearchParams` mock in some component tests

### Gotchas

- The ESLint config is a flat config (`eslint.config.mjs`) at root; each sub-project references it or has its own.
- Backend uses CommonJS (`"module": "commonjs"` in tsconfig); root and dashboard use ESM.
- The `apps/offline-product` is Expo/React Native; running it requires a simulator or device (not testable in headless cloud environments).
- OpenAPI governance scripts (root `package.json` `openapi:*` commands) operate on `docs/openapi/tracebud-v1-draft.yaml`.
