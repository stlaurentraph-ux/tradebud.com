## Tracebud Offline App (Expo React Native)

**Purpose:** Offline-first field app to walk a plot perimeter, store farmer/plot data locally, and sync to the Tracebud backend for compliance and traceability.

### 1. Prerequisites

- Node.js 18+
- Expo tooling (`npx expo` will auto-install)
- A running Tracebud backend (see `tracebud-backend/README.md`)
- A Supabase project with:
  - Same project as the backend
  - A test user (email + password) that maps to the desired role (farmer / agent / exporter)

### 2. Environment variables

Create an `.env` or `.env.local` in `tracebud-offline-app` (depending on how you prefer to run Expo) with:

```bash
EXPO_PUBLIC_API_URL=http://localhost:4001/api
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
EXPO_PUBLIC_TRACEBUD_TEST_EMAIL=YOUR_TEST_USER_EMAIL
EXPO_PUBLIC_TRACEBUD_TEST_PASSWORD=YOUR_TEST_USER_PASSWORD
EXPO_PUBLIC_ALLOW_TEST_AUTH=1
EXPO_PUBLIC_ALLOW_LOCALHOST_API=1
EXPO_PUBLIC_ALLOW_INSECURE_API=1
```

These are used by the app’s API client to:

- Call the NestJS backend.
- Log in automatically to Supabase to obtain a JWT for each sync call.

Production safety defaults:

- `EXPO_PUBLIC_ALLOW_TEST_AUTH` defaults to off unless explicitly set to `1`.
- `EXPO_PUBLIC_ALLOW_LOCALHOST_API` defaults to off unless explicitly set to `1`.
- `EXPO_PUBLIC_ALLOW_INSECURE_API` defaults to off unless explicitly set to `1`.
- For preview/production builds, use a reachable HTTPS API URL (not localhost).
- Sync account credentials are stored in secure platform storage (Keychain/Keystore). Legacy
  plaintext settings are migrated automatically on first load.

### 3. Install & run

From the `tracebud-offline-app` directory:

```bash
npm install
npx expo start
```

Open the app in:

- iOS simulator
- Android emulator
- A physical device using the Expo Go app

Make sure the **backend** is already running and reachable from your device at `EXPO_PUBLIC_API_URL`.

### 4. Features & flows

**Tabs:**

- **Home** – Walk the field perimeter with GPS, see live area estimate and precision, and save a plot with farmer declaration and self-identity.
- **Plots** – See locally stored plots, plus “Synced plots (backend)” with:
  - Computed area, declared area & discrepancy.
  - Compliance status and SINAPH/Indigenous overlap flags (after running compliance checks).
  - Harvest form to record kg and create vouchers in the backend.
  - DDS package creation from active vouchers.

**Offline behaviour:**

- Local data is stored with SQLite (`features/state/persistence.ts`).
- Sync calls are **best-effort**: if the network is unavailable, local state still persists; backend operations simply fail quietly (or show a simple error) and can be retried later.

### 5. Quick demo script

1. Start the backend (`npm run build && npm start` in `tracebud-backend`).
2. Start the app (`npx expo start` in `tracebud-offline-app`).
3. In the app:
   - Go to **Home**, walk a perimeter and save a plot.
   - Switch to **Plots**:
     - Select a local plot.
     - Check it appears under “Synced plots (backend)” once sync succeeds.
     - Tap **Run compliance check** to flip compliance/overlap flags.
     - Enter kg and tap **Record harvest** to create a voucher.
     - Use **Create DDS package from active vouchers** to create an exporter package.

### 6. Release model (testing vs official app)

Use one codebase with separate release tracks:

- `development` -> internal dev builds
- `preview` -> QA and pilot testers
- `production` -> official public app for farmers

Commands:

```bash
# Build for testers
npm run release:preview

# Build for official users
npm run release:production

# Production preflight + build (recommended)
npm run release:production:safe

# Rollout SLO go/no-go gate (before preview -> production promotion)
npm run release:slo:gate -- --report=release-health-report.json

# Submit official build to stores
npm run submit:production

# OTA updates (after validation)
npm run update:preview
npm run update:production
```

See `RELEASE_MODEL.md` for the full branch and promotion workflow.
For operational launch steps and staged rollout procedure, see `RELEASE_RUNBOOK.md`.
Example SLO report payload lives at `release-health-report.example.json`.

