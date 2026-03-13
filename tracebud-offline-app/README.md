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
```

These are used by the app’s API client to:

- Call the NestJS backend.
- Log in automatically to Supabase to obtain a JWT for each sync call.

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

